import 'server-only';

import { and, eq, inArray } from 'drizzle-orm';
import { getDb } from '@repo/db';
import {
  knowledgeChunk,
  knowledgeSource,
  knowledgeSourceAccess,
} from '@repo/db/knowledge-schema';
import { getKnowledgeVectorStore, KNOWLEDGE_INDEX_NAME } from './vector';
import { isEmbeddingProviderConfigured } from './config';
import { generateSingleEmbedding } from './embedding';
import type {
  AIKnowledgeSourceId,
  AIKnowledgeDocumentId,
} from '@repo/ai/knowledge';

export interface RetrievedChunk {
  readonly id: string;
  readonly sourceId: AIKnowledgeSourceId;
  readonly documentId: AIKnowledgeDocumentId;
  readonly chunkId: string;
  readonly text: string;
  readonly score: number;
  readonly title: string;
  readonly userId: string;
  readonly visibility: string;
  readonly indexedAt: string;
  readonly provider: string;
  readonly provenance: string;
}

export interface SourceCitationMetadata {
  readonly sourceId: AIKnowledgeSourceId;
  readonly title: string;
  readonly documentId: AIKnowledgeDocumentId;
  readonly chunkId: string;
  readonly provenance: string;
  readonly score: number;
  readonly provider: string;
}

export interface KnowledgeRetrievalResult {
  readonly success: boolean;
  readonly chunks: readonly RetrievedChunk[];
  readonly citations: readonly SourceCitationMetadata[];
  readonly contextText: string;
  readonly error?: string;
}

export interface KnowledgeRetrievalOptions {
  readonly userId: string;
  readonly topK?: number;
  readonly minScore?: number;
  readonly includeOtherUserPublic?: boolean;
}

interface VectorCandidate {
  readonly id: string;
  readonly score: number;
  readonly sourceId: AIKnowledgeSourceId;
  readonly documentId: AIKnowledgeDocumentId;
  readonly chunkId: string;
  readonly provider: string;
  readonly provenance: string;
  readonly indexedAt: string;
}

function getStringMetadata(
  metadata: Record<string, unknown>,
  key: string
): string | undefined {
  const value = metadata[key];
  return typeof value === 'string' ? value : undefined;
}

function toVectorCandidate(
  result: unknown,
  minScore: number
): VectorCandidate | undefined {
  const resultRecord = result as {
    id?: unknown;
    score?: unknown;
    metadata?: unknown;
  };
  const metadata = resultRecord.metadata as Record<string, unknown> | undefined;

  if (!metadata) {
    return undefined;
  }

  const score = typeof resultRecord.score === 'number' ? resultRecord.score : 0;

  if (score < minScore) {
    return undefined;
  }

  const sourceId = getStringMetadata(metadata, 'sourceId');
  const documentId = getStringMetadata(metadata, 'documentId');
  const chunkId = getStringMetadata(metadata, 'chunkId');

  if (!sourceId || !documentId || !chunkId) {
    return undefined;
  }

  return {
    id: typeof resultRecord.id === 'string' ? resultRecord.id : chunkId,
    score,
    sourceId: sourceId as AIKnowledgeSourceId,
    documentId: documentId as AIKnowledgeDocumentId,
    chunkId,
    provider:
      getStringMetadata(metadata, 'provider') ??
      getStringMetadata(metadata, 'embeddingModel') ??
      'unknown',
    provenance:
      getStringMetadata(metadata, 'provenance') ?? `manual-note:${sourceId}`,
    indexedAt: getStringMetadata(metadata, 'indexedAt') ?? '',
  };
}

async function getAccessibleChunkRows(input: {
  readonly candidates: readonly VectorCandidate[];
  readonly userId: string;
  readonly includeOtherUserPublic: boolean;
}) {
  const chunkIds = Array.from(
    new Set(input.candidates.map((candidate) => candidate.chunkId))
  );

  if (chunkIds.length === 0) {
    return new Map<
      string,
      {
        readonly chunk: typeof knowledgeChunk.$inferSelect;
        readonly source: typeof knowledgeSource.$inferSelect;
      }
    >();
  }

  const db = await getDb();
  const rows = await db
    .select({
      chunk: knowledgeChunk,
      source: knowledgeSource,
    })
    .from(knowledgeChunk)
    .innerJoin(knowledgeSource, eq(knowledgeChunk.sourceId, knowledgeSource.id))
    .where(
      and(
        inArray(knowledgeChunk.id, chunkIds),
        eq(knowledgeSource.status, 'ready')
      )
    );

  const sharedSourceIds = rows
    .filter(
      (row) =>
        row.source.visibility === 'shared' && row.source.userId !== input.userId
    )
    .map((row) => row.source.id);

  const sharedAccessSourceIds =
    sharedSourceIds.length > 0
      ? new Set(
          (
            await db
              .select({ sourceId: knowledgeSourceAccess.sourceId })
              .from(knowledgeSourceAccess)
              .where(
                and(
                  eq(knowledgeSourceAccess.userId, input.userId),
                  inArray(knowledgeSourceAccess.sourceId, sharedSourceIds),
                  inArray(knowledgeSourceAccess.permission, [
                    'read',
                    'write',
                    'admin',
                  ])
                )
              )
          ).map((row) => row.sourceId)
        )
      : new Set<string>();

  return new Map(
    rows
      .filter((row) => {
        if (row.source.userId === input.userId) {
          return true;
        }

        if (
          input.includeOtherUserPublic &&
          row.source.visibility === 'public'
        ) {
          return true;
        }

        if (row.source.visibility === 'shared') {
          return sharedAccessSourceIds.has(row.source.id);
        }

        return false;
      })
      .map((row) => [row.chunk.id, row])
  );
}

export async function retrieveKnowledgeContext(
  query: string,
  options: KnowledgeRetrievalOptions
): Promise<KnowledgeRetrievalResult> {
  if (!isEmbeddingProviderConfigured()) {
    return {
      success: false,
      chunks: [],
      citations: [],
      contextText: '',
      error:
        'Embedding provider is not configured. ' +
        'Set AI_EMBEDDING_API_KEY or OPENAI_API_KEY environment variable.',
    };
  }

  if (!query.trim()) {
    return {
      success: true,
      chunks: [],
      citations: [],
      contextText: '',
    };
  }

  const topK = options.topK ?? 5;
  const minScore = options.minScore ?? 0.0;
  const includeOtherUserPublic = options.includeOtherUserPublic ?? false;

  try {
    const queryEmbedding = await generateSingleEmbedding(query);

    if (queryEmbedding.length === 0) {
      return {
        success: false,
        chunks: [],
        citations: [],
        contextText: '',
        error: 'Failed to generate embedding for query.',
      };
    }

    const vectorStore = getKnowledgeVectorStore();

    const results = await vectorStore.query({
      indexName: KNOWLEDGE_INDEX_NAME,
      queryVector: [...queryEmbedding],
      topK,
    });

    if (!results || results.length === 0) {
      return {
        success: true,
        chunks: [],
        citations: [],
        contextText: '',
      };
    }

    const candidates = results
      .map((result) => toVectorCandidate(result, minScore))
      .filter((candidate): candidate is VectorCandidate => Boolean(candidate));
    const accessibleChunkRows = await getAccessibleChunkRows({
      candidates,
      userId: options.userId,
      includeOtherUserPublic,
    });

    const chunks: RetrievedChunk[] = candidates
      .map((candidate): RetrievedChunk | undefined => {
        const row = accessibleChunkRows.get(candidate.chunkId);
        if (!row) {
          return undefined;
        }

        return {
          id: candidate.id,
          sourceId: row.source.id as AIKnowledgeSourceId,
          documentId: row.chunk.documentId as AIKnowledgeDocumentId,
          chunkId: row.chunk.id,
          text: row.chunk.text,
          score: candidate.score,
          title: row.source.title,
          userId: row.source.userId,
          visibility: row.source.visibility,
          indexedAt: row.source.indexedAt?.toISOString() || candidate.indexedAt,
          provider: candidate.provider,
          provenance: candidate.provenance,
        };
      })
      .filter((chunk): chunk is RetrievedChunk => Boolean(chunk));

    const citations: SourceCitationMetadata[] = chunks.map((chunk) => ({
      sourceId: chunk.sourceId,
      title: chunk.title,
      documentId: chunk.documentId,
      chunkId: chunk.chunkId,
      provenance: chunk.provenance,
      score: chunk.score,
      provider: chunk.provider,
    }));

    const contextText =
      chunks.length > 0
        ? chunks
            .map((chunk, index) => `[${index + 1}] ${chunk.text}`)
            .join('\n\n')
        : '';

    return {
      success: true,
      chunks,
      citations,
      contextText,
    };
  } catch (error) {
    console.error('[Knowledge Retrieval Error]', error);
    return {
      success: false,
      chunks: [],
      citations: [],
      contextText: '',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

export function formatRetrievalContextForPrompt(
  result: KnowledgeRetrievalResult
): string {
  if (!result.success || result.chunks.length === 0) {
    return '';
  }

  const header = '## Relevant Knowledge Sources\n\n';
  const sources = result.contextText;
  const footer =
    '\n\n---\n\n' +
    'Use the above knowledge sources to inform your response. ' +
    'Cite sources using [1], [2], etc. when referencing specific information.';

  return header + sources + footer;
}

export function isKnowledgeRetrievalEnabled(): boolean {
  return isEmbeddingProviderConfigured();
}

export const RETRIEVAL_WIRED = true;
