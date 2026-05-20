import 'server-only';

import { PgVector } from '@mastra/pg';
import { serverEnv } from '@repo/env/server';

export const KNOWLEDGE_INDEX_NAME = 'aelokit_knowledge_embeddings';

export interface KnowledgeVectorConfig {
  readonly id: string;
  readonly connectionString: string;
}

export function resolveKnowledgeVectorConfig(): KnowledgeVectorConfig {
  return {
    id: 'aelokit-knowledge-vector',
    connectionString: serverEnv.DATABASE_URL,
  };
}

export function createKnowledgeVectorStore(
  config: KnowledgeVectorConfig
): PgVector {
  return new PgVector({
    id: config.id,
    connectionString: config.connectionString,
  });
}

export function getKnowledgeVectorStore(): PgVector {
  const config = resolveKnowledgeVectorConfig();
  return createKnowledgeVectorStore(config);
}

export async function ensureKnowledgeVectorIndex(
  store: PgVector,
  dimension: number = 1536
): Promise<void> {
  try {
    await store.createIndex({
      indexName: KNOWLEDGE_INDEX_NAME,
      dimension,
    });
  } catch (error) {
    if (error instanceof Error && error.message.includes('already exists')) {
      return;
    }
    throw error;
  }
}

export const PARTIAL_UNTIL_WIRED = false;
