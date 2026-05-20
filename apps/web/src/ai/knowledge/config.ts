import 'server-only';

import { serverEnv } from '@repo/env/server';
import type { AIKnowledgeIngestionConfig } from '@repo/ai/knowledge';

export interface KnowledgeRuntimeConfig {
  readonly embeddingProvider: string;
  readonly embeddingModel: string;
  readonly embeddingBaseUrl: string | undefined;
  readonly embeddingApiKey: string | undefined;
  readonly databaseUrl: string;
}

export function resolveKnowledgeRuntimeConfig(): KnowledgeRuntimeConfig {
  const embeddingProvider = serverEnv.AI_EMBEDDING_PROVIDER;
  const embeddingModel = serverEnv.AI_EMBEDDING_MODEL;
  const embeddingBaseUrl =
    serverEnv.AI_EMBEDDING_BASE_URL ?? serverEnv.OPENAI_BASE_URL;
  const embeddingApiKey =
    serverEnv.AI_EMBEDDING_API_KEY ?? serverEnv.OPENAI_API_KEY;
  const databaseUrl = serverEnv.DATABASE_URL;

  return {
    embeddingProvider,
    embeddingModel,
    embeddingBaseUrl,
    embeddingApiKey,
    databaseUrl,
  };
}

export function resolveKnowledgeIngestionConfig(): AIKnowledgeIngestionConfig {
  return {
    chunkStrategy: 'recursive',
    chunkSize: 512,
    chunkOverlap: 50,
    embeddingModel: serverEnv.AI_EMBEDDING_MODEL,
    embeddingDimensions: 1536,
  };
}

export const KNOWLEDGE_INDEX_NAME = 'aelokit_knowledge_embeddings';

export function isEmbeddingProviderConfigured(): boolean {
  const config = resolveKnowledgeRuntimeConfig();
  return Boolean(config.embeddingApiKey);
}

export const PARTIAL_UNTIL_WIRED = false;
