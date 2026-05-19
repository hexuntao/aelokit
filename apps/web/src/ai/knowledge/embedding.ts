import 'server-only';

import { embedMany } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';
import { resolveKnowledgeRuntimeConfig } from './config';

export interface EmbeddingResult {
  readonly embeddings: readonly (readonly number[])[];
  readonly model: string;
  readonly dimensions: number;
}

export function createEmbeddingModel() {
  const config = resolveKnowledgeRuntimeConfig();

  if (!config.embeddingApiKey) {
    throw new Error(
      'Embedding provider is not configured. ' +
        'Set AI_EMBEDDING_API_KEY or OPENAI_API_KEY environment variable.'
    );
  }

  const openai = createOpenAI({
    apiKey: config.embeddingApiKey,
    baseURL: config.embeddingBaseUrl ?? undefined,
  });

  return openai.embedding(config.embeddingModel);
}

export async function generateEmbeddings(
  texts: readonly string[]
): Promise<EmbeddingResult> {
  if (texts.length === 0) {
    return {
      embeddings: [],
      model: resolveKnowledgeRuntimeConfig().embeddingModel,
      dimensions: 0,
    };
  }

  const model = createEmbeddingModel();
  const config = resolveKnowledgeRuntimeConfig();

  const { embeddings } = await embedMany({
    model,
    values: [...texts],
  });

  return {
    embeddings,
    model: config.embeddingModel,
    dimensions: embeddings[0]?.length ?? 0,
  };
}

export async function generateSingleEmbedding(
  text: string
): Promise<readonly number[]> {
  const result = await generateEmbeddings([text]);
  return result.embeddings[0] ?? [];
}

export const PARTIAL_UNTIL_WIRED = true;
