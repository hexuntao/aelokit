import 'server-only';

import { embedMany } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';
import { resolveKnowledgeRuntimeConfig } from './config';

export interface EmbeddingResult {
  readonly embeddings: readonly (readonly number[])[];
  readonly model: string;
  readonly dimensions: number;
}

interface OpenAICompatibleEmbeddingResponse {
  readonly data?: readonly {
    readonly embedding?: readonly number[];
  }[];
}

const DEFAULT_OPENAI_BASE_URL = 'https://api.openai.com/v1';
const ENCODING_FORMAT_UNSUPPORTED = 'encoding_format';

function normalizeBaseUrl(baseUrl: string): string {
  return baseUrl.replace(/\/+$/, '');
}

function isEncodingFormatUnsupportedError(error: unknown): boolean {
  const responseBody =
    error && typeof error === 'object' && 'responseBody' in error
      ? String(error.responseBody)
      : '';
  const message =
    error instanceof Error
      ? error.message
      : typeof error === 'string'
        ? error
        : '';
  const combinedMessage = `${message}\n${responseBody}`;

  return combinedMessage.toLowerCase().includes(ENCODING_FORMAT_UNSUPPORTED);
}

async function readErrorBody(response: Response): Promise<string> {
  try {
    return await response.text();
  } catch {
    return '';
  }
}

function parseOpenAICompatibleEmbeddings(
  response: OpenAICompatibleEmbeddingResponse
): readonly (readonly number[])[] {
  return (
    response.data
      ?.map((item) => item.embedding)
      .filter((embedding): embedding is readonly number[] =>
        Array.isArray(embedding)
      ) ?? []
  );
}

async function generateEmbeddingsWithoutEncodingFormat(
  texts: readonly string[]
): Promise<EmbeddingResult> {
  const config = resolveKnowledgeRuntimeConfig();

  if (!config.embeddingApiKey) {
    throw new Error(
      'Embedding provider is not configured. ' +
        'Set OPENAI_API_KEY environment variable.'
    );
  }

  const baseUrl = normalizeBaseUrl(
    config.embeddingBaseUrl ?? DEFAULT_OPENAI_BASE_URL
  );
  const response = await fetch(`${baseUrl}/embeddings`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${config.embeddingApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: config.embeddingModel,
      input: [...texts],
    }),
  });

  if (!response.ok) {
    const errorBody = await readErrorBody(response);
    throw new Error(
      `Embedding provider request failed with HTTP ${response.status}. ${errorBody}`
    );
  }

  const responseBody =
    (await response.json()) as OpenAICompatibleEmbeddingResponse;
  const embeddings = parseOpenAICompatibleEmbeddings(responseBody);

  if (embeddings.length !== texts.length) {
    const responseKeys = Object.keys(responseBody).slice(0, 8).join(', ');
    throw new Error(
      `Embedding provider returned ${embeddings.length} embeddings for ${texts.length} input values. ` +
        `Expected OpenAI-compatible embeddings response with data[].embedding. ` +
        `Response keys: ${responseKeys || 'none'}.`
    );
  }

  return {
    embeddings,
    model: config.embeddingModel,
    dimensions: embeddings[0]?.length ?? 0,
  };
}

export function createEmbeddingModel() {
  const config = resolveKnowledgeRuntimeConfig();

  if (!config.embeddingApiKey) {
    throw new Error(
      'Embedding provider is not configured. ' +
        'Set OPENAI_API_KEY environment variable.'
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

  try {
    const { embeddings } = await embedMany({
      model,
      values: [...texts],
    });

    return {
      embeddings,
      model: config.embeddingModel,
      dimensions: embeddings[0]?.length ?? 0,
    };
  } catch (error) {
    if (!isEncodingFormatUnsupportedError(error)) {
      throw error;
    }

    return generateEmbeddingsWithoutEncodingFormat(texts);
  }
}

export async function generateSingleEmbedding(
  text: string
): Promise<readonly number[]> {
  const result = await generateEmbeddings([text]);
  return result.embeddings[0] ?? [];
}

export const PARTIAL_UNTIL_WIRED = false;
