import 'server-only';

import { nanoid } from 'nanoid';
import { and, desc, eq } from 'drizzle-orm';
import { getDb } from '@repo/db';
import {
  knowledgeChunk,
  knowledgeDocument,
  knowledgeSource,
} from '@repo/db/knowledge-schema';
import type {
  AIKnowledgeManualSourceInput,
  AIKnowledgeIngestionResult,
  AIKnowledgeSourceId,
  AIKnowledgeDocumentId,
  AIKnowledgeSourceOwnership,
  AIKnowledgeSourceKind,
  AIKnowledgeSourceVisibility,
} from '@repo/ai/knowledge';
import {
  isEmbeddingProviderConfigured,
  resolveKnowledgeIngestionConfig,
  resolveKnowledgeRuntimeConfig,
} from './config';
import { chunkText } from './chunking';
import { generateEmbeddings } from './embedding';
import { getKnowledgeVectorStore, ensureKnowledgeVectorIndex } from './vector';
import { KNOWLEDGE_INDEX_NAME } from './vector';

export interface KnowledgeSourceRecord {
  readonly id: AIKnowledgeSourceId;
  readonly kind: AIKnowledgeSourceKind;
  readonly title: string;
  readonly userId: string;
  readonly visibility: AIKnowledgeSourceVisibility;
  readonly status: 'draft' | 'indexing' | 'ready' | 'failed' | 'archived';
  readonly chunkCount: number;
  readonly vectorCount: number;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly indexedAt?: string;
}

export interface KnowledgeDocumentRecord {
  readonly id: AIKnowledgeDocumentId;
  readonly sourceId: AIKnowledgeSourceId;
  readonly title: string;
  readonly text: string;
  readonly userId: string;
  readonly chunkCount: number;
  readonly vectorCount: number;
  readonly status: 'ready' | 'failed';
  readonly createdAt: string;
}

function toISOString(value: Date | string | null | undefined): string {
  if (!value) {
    return new Date(0).toISOString();
  }
  return value instanceof Date ? value.toISOString() : value;
}

function toKnowledgeSourceRecord(
  row: typeof knowledgeSource.$inferSelect
): KnowledgeSourceRecord {
  return {
    id: row.id as AIKnowledgeSourceId,
    kind: row.kind,
    title: row.title,
    userId: row.userId,
    visibility: row.visibility,
    status: row.status,
    chunkCount: row.chunkCount,
    vectorCount: row.vectorCount,
    createdAt: toISOString(row.createdAt),
    updatedAt: toISOString(row.updatedAt),
    indexedAt: row.indexedAt ? toISOString(row.indexedAt) : undefined,
  };
}

function toKnowledgeDocumentRecord(input: {
  readonly document: typeof knowledgeDocument.$inferSelect;
  readonly source: typeof knowledgeSource.$inferSelect;
}): KnowledgeDocumentRecord {
  return {
    id: input.document.id as AIKnowledgeDocumentId,
    sourceId: input.document.sourceId as AIKnowledgeSourceId,
    title: input.document.title,
    text: input.document.text,
    userId: input.source.userId,
    chunkCount: input.source.chunkCount,
    vectorCount: input.source.vectorCount,
    status: input.source.status === 'ready' ? 'ready' : 'failed',
    createdAt: toISOString(input.document.createdAt),
  };
}

async function markKnowledgeSourceFailed(
  sourceId: AIKnowledgeSourceId,
  errorMessage: string
) {
  try {
    const db = await getDb();
    await db
      .update(knowledgeSource)
      .set({
        status: 'failed',
        errorMessage,
        updatedAt: new Date(),
      })
      .where(eq(knowledgeSource.id, sourceId));
  } catch (error) {
    console.error('[Knowledge Ingestion Failed Status Error]', error);
  }
}

export async function ingestManualKnowledgeSource(
  input: AIKnowledgeManualSourceInput
): Promise<AIKnowledgeIngestionResult> {
  if (!isEmbeddingProviderConfigured()) {
    return {
      sourceId: '' as AIKnowledgeSourceId,
      documentId: '' as AIKnowledgeDocumentId,
      chunkCount: 0,
      vectorCount: 0,
      status: 'failed',
      error:
        'Embedding provider is not configured. ' +
        'Set OPENAI_API_KEY environment variable.',
      indexedAt: new Date().toISOString(),
    };
  }

  const sourceId = nanoid() as AIKnowledgeSourceId;
  const documentId = nanoid() as AIKnowledgeDocumentId;
  const now = new Date();
  const indexedAt = now.toISOString();
  const visibility = input.visibility ?? 'private';

  try {
    const ingestionConfig = resolveKnowledgeIngestionConfig();
    const runtimeConfig = resolveKnowledgeRuntimeConfig();
    const db = await getDb();

    await db.insert(knowledgeSource).values({
      id: sourceId,
      kind: 'manual-note',
      title: input.title,
      userId: input.userId,
      visibility,
      status: 'indexing',
      chunkCount: 0,
      vectorCount: 0,
      embeddingModel: ingestionConfig.embeddingModel,
      embeddingDimensions: ingestionConfig.embeddingDimensions,
      createdAt: now,
      updatedAt: now,
    });

    await db.insert(knowledgeDocument).values({
      id: documentId,
      sourceId,
      title: input.title,
      text: input.text,
      mimeType: 'text/plain',
      charCount: input.text.length,
      createdAt: now,
    });

    const chunks = await chunkText(input.text, ingestionConfig);

    if (chunks.length === 0) {
      await markKnowledgeSourceFailed(
        sourceId,
        'No chunks were generated from the input text.'
      );
      return {
        sourceId,
        documentId,
        chunkCount: 0,
        vectorCount: 0,
        status: 'failed',
        error: 'No chunks were generated from the input text.',
        indexedAt,
      };
    }

    const embeddingsResult = await generateEmbeddings(
      chunks.map((c) => c.text)
    );

    const vectorStore = getKnowledgeVectorStore();
    await ensureKnowledgeVectorIndex(vectorStore, embeddingsResult.dimensions);

    const mutableVectors = embeddingsResult.embeddings.map((e) => [...e]);
    const chunkIds = chunks.map((chunk) => `${documentId}:${chunk.id}`);
    const vectorIds = chunkIds.map((chunkId) => `${sourceId}:${chunkId}`);
    const provenance = `manual-note:${sourceId}`;

    const upsertedVectorIds = await vectorStore.upsert({
      indexName: KNOWLEDGE_INDEX_NAME,
      vectors: mutableVectors,
      ids: vectorIds,
      metadata: chunks.map((chunk, index) => ({
        sourceId,
        documentId,
        chunkId: chunkIds[index],
        chunkIndex: index,
        text: chunk.text,
        title: input.title,
        userId: input.userId,
        visibility,
        provenance,
        provider: runtimeConfig.embeddingProvider,
        embeddingModel: embeddingsResult.model,
        indexedAt,
      })),
    });

    await db.insert(knowledgeChunk).values(
      chunks.map((chunk, index) => ({
        id: chunkIds[index],
        documentId,
        sourceId,
        text: chunk.text,
        chunkIndex: index,
        charCount: chunk.text.length,
        vectorId: upsertedVectorIds[index] ?? vectorIds[index],
        createdAt: now,
      }))
    );

    await db
      .update(knowledgeSource)
      .set({
        status: 'ready',
        chunkCount: chunks.length,
        vectorCount: embeddingsResult.embeddings.length,
        embeddingDimensions: embeddingsResult.dimensions,
        indexedAt: now,
        updatedAt: new Date(),
      })
      .where(eq(knowledgeSource.id, sourceId));

    return {
      sourceId,
      documentId,
      chunkCount: chunks.length,
      vectorCount: embeddingsResult.embeddings.length,
      status: 'success',
      indexedAt,
    };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error during ingestion';
    await markKnowledgeSourceFailed(sourceId, errorMessage);

    return {
      sourceId,
      documentId,
      chunkCount: 0,
      vectorCount: 0,
      status: 'failed',
      error: errorMessage,
      indexedAt,
    };
  }
}

export async function getKnowledgeSource(
  sourceId: AIKnowledgeSourceId
): Promise<KnowledgeSourceRecord | undefined> {
  const db = await getDb();
  const [source] = await db
    .select()
    .from(knowledgeSource)
    .where(eq(knowledgeSource.id, sourceId))
    .limit(1);

  return source ? toKnowledgeSourceRecord(source) : undefined;
}

export async function getKnowledgeDocument(
  documentId: AIKnowledgeDocumentId
): Promise<KnowledgeDocumentRecord | undefined> {
  const db = await getDb();
  const [row] = await db
    .select({
      document: knowledgeDocument,
      source: knowledgeSource,
    })
    .from(knowledgeDocument)
    .innerJoin(
      knowledgeSource,
      eq(knowledgeDocument.sourceId, knowledgeSource.id)
    )
    .where(eq(knowledgeDocument.id, documentId))
    .limit(1);

  return row ? toKnowledgeDocumentRecord(row) : undefined;
}

export async function listUserKnowledgeSources(
  userId: string
): Promise<KnowledgeSourceRecord[]> {
  const db = await getDb();
  const sources = await db
    .select()
    .from(knowledgeSource)
    .where(eq(knowledgeSource.userId, userId))
    .orderBy(desc(knowledgeSource.createdAt));

  return sources.map(toKnowledgeSourceRecord);
}

export async function getSourceOwnership(
  sourceId: AIKnowledgeSourceId
): Promise<AIKnowledgeSourceOwnership | undefined> {
  const source = await getKnowledgeSource(sourceId);
  if (!source) return undefined;

  return {
    sourceId,
    userId: source.userId,
    visibility: source.visibility,
    createdAt: source.createdAt,
    updatedAt: source.updatedAt,
  };
}

export async function archiveKnowledgeSource(
  sourceId: AIKnowledgeSourceId,
  userId: string
): Promise<KnowledgeSourceRecord | undefined> {
  const db = await getDb();
  const [updated] = await db
    .update(knowledgeSource)
    .set({
      status: 'archived',
      updatedAt: new Date(),
    })
    .where(
      and(eq(knowledgeSource.id, sourceId), eq(knowledgeSource.userId, userId))
    )
    .returning();

  return updated ? toKnowledgeSourceRecord(updated) : undefined;
}

export async function deleteKnowledgeSource(
  sourceId: AIKnowledgeSourceId,
  userId: string
): Promise<boolean> {
  const db = await getDb();
  const deleted = await db
    .delete(knowledgeSource)
    .where(
      and(eq(knowledgeSource.id, sourceId), eq(knowledgeSource.userId, userId))
    )
    .returning({ id: knowledgeSource.id });

  return deleted.length > 0;
}

export const PARTIAL_UNTIL_WIRED = false;
