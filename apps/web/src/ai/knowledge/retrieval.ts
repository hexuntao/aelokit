import 'server-only';

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

    const filteredResults = results.filter((result: any) => {
      const metadata = result.metadata as Record<string, unknown> | undefined;
      if (!metadata) return false;

      const resultUserId = metadata.userId as string | undefined;
      const resultVisibility = metadata.visibility as string | undefined;
      const score = result.score ?? 0;

      if (score < minScore) return false;

      if (resultUserId === options.userId) {
        return true;
      }

      if (includeOtherUserPublic && resultVisibility === 'public') {
        return true;
      }

      return false;
    });

    const chunks: RetrievedChunk[] = filteredResults.map((result: any) => {
      const metadata = result.metadata as Record<string, unknown>;
      return {
        id: result.id as string,
        sourceId: metadata.sourceId as AIKnowledgeSourceId,
        documentId: metadata.documentId as AIKnowledgeDocumentId,
        chunkId: metadata.chunkId as string,
        text: metadata.text as string,
        score: result.score as number,
        title: metadata.title as string,
        userId: metadata.userId as string,
        visibility: metadata.visibility as string,
        indexedAt: metadata.indexedAt as string,
      };
    });

    const citations: SourceCitationMetadata[] = chunks.map((chunk) => ({
      sourceId: chunk.sourceId,
      title: chunk.title,
      documentId: chunk.documentId,
      chunkId: chunk.chunkId,
      provenance: `manual-note:${chunk.sourceId}`,
      score: chunk.score,
      provider: 'openai-embedding',
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
