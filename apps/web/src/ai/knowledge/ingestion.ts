import 'server-only';

import { nanoid } from 'nanoid';
import type {
  AIKnowledgeManualSourceInput,
  AIKnowledgeIngestionResult,
  AIKnowledgeSourceId,
  AIKnowledgeDocumentId,
  AIKnowledgeSourceOwnership,
  AIKnowledgeSourceVisibility,
} from '@repo/ai/knowledge';
import {
  isEmbeddingProviderConfigured,
  resolveKnowledgeIngestionConfig,
} from './config';
import { chunkText } from './chunking';
import { generateEmbeddings } from './embedding';
import { getKnowledgeVectorStore, ensureKnowledgeVectorIndex } from './vector';
import { KNOWLEDGE_INDEX_NAME } from './vector';

export interface KnowledgeSourceRecord {
  readonly id: AIKnowledgeSourceId;
  readonly kind: 'manual-note';
  readonly title: string;
  readonly userId: string;
  readonly visibility: AIKnowledgeSourceVisibility;
  readonly createdAt: string;
  readonly updatedAt: string;
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

const knowledgeSources: Map<AIKnowledgeSourceId, KnowledgeSourceRecord> =
  new Map();
const knowledgeDocuments: Map<AIKnowledgeDocumentId, KnowledgeDocumentRecord> =
  new Map();

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
        'Set AI_EMBEDDING_API_KEY or OPENAI_API_KEY environment variable.',
      indexedAt: new Date().toISOString(),
    };
  }

  const sourceId = nanoid() as AIKnowledgeSourceId;
  const documentId = nanoid() as AIKnowledgeDocumentId;
  const now = new Date().toISOString();
  const visibility = input.visibility ?? 'private';

  try {
    const ingestionConfig = resolveKnowledgeIngestionConfig();

    const chunks = await chunkText(input.text, ingestionConfig);

    if (chunks.length === 0) {
      return {
        sourceId,
        documentId,
        chunkCount: 0,
        vectorCount: 0,
        status: 'failed',
        error: 'No chunks were generated from the input text.',
        indexedAt: now,
      };
    }

    const embeddingsResult = await generateEmbeddings(
      chunks.map((c) => c.text)
    );

    const vectorStore = getKnowledgeVectorStore();
    await ensureKnowledgeVectorIndex(vectorStore, embeddingsResult.dimensions);

    const mutableVectors = embeddingsResult.embeddings.map((e) => [...e]);

    await vectorStore.upsert({
      indexName: KNOWLEDGE_INDEX_NAME,
      vectors: mutableVectors,
      metadata: chunks.map((chunk, index) => ({
        sourceId,
        documentId,
        chunkId: chunk.id,
        chunkIndex: index,
        text: chunk.text,
        title: input.title,
        userId: input.userId,
        visibility,
        indexedAt: now,
      })),
    });

    const sourceRecord: KnowledgeSourceRecord = {
      id: sourceId,
      kind: 'manual-note',
      title: input.title,
      userId: input.userId,
      visibility,
      createdAt: now,
      updatedAt: now,
    };
    knowledgeSources.set(sourceId, sourceRecord);

    const documentRecord: KnowledgeDocumentRecord = {
      id: documentId,
      sourceId,
      title: input.title,
      text: input.text,
      userId: input.userId,
      chunkCount: chunks.length,
      vectorCount: embeddingsResult.embeddings.length,
      status: 'ready',
      createdAt: now,
    };
    knowledgeDocuments.set(documentId, documentRecord);

    return {
      sourceId,
      documentId,
      chunkCount: chunks.length,
      vectorCount: embeddingsResult.embeddings.length,
      status: 'success',
      indexedAt: now,
    };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error during ingestion';

    return {
      sourceId,
      documentId,
      chunkCount: 0,
      vectorCount: 0,
      status: 'failed',
      error: errorMessage,
      indexedAt: now,
    };
  }
}

export function getKnowledgeSource(
  sourceId: AIKnowledgeSourceId
): KnowledgeSourceRecord | undefined {
  return knowledgeSources.get(sourceId);
}

export function getKnowledgeDocument(
  documentId: AIKnowledgeDocumentId
): KnowledgeDocumentRecord | undefined {
  return knowledgeDocuments.get(documentId);
}

export function listUserKnowledgeSources(
  userId: string
): KnowledgeSourceRecord[] {
  return Array.from(knowledgeSources.values()).filter(
    (source) => source.userId === userId
  );
}

export function getSourceOwnership(
  sourceId: AIKnowledgeSourceId
): AIKnowledgeSourceOwnership | undefined {
  const source = knowledgeSources.get(sourceId);
  if (!source) return undefined;

  return {
    sourceId,
    userId: source.userId,
    visibility: source.visibility,
    createdAt: source.createdAt,
    updatedAt: source.updatedAt,
  };
}

export const PARTIAL_UNTIL_WIRED = true;
