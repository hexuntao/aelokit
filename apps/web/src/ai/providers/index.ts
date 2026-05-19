import 'server-only';

import { createOpenAI } from '@ai-sdk/openai';
import type { LanguageModel } from 'ai';
import { serverEnv } from '@repo/env/server';
import type { AIProviderId } from '@repo/ai/providers';

export interface AIProviderConfig {
  readonly id: AIProviderId;
  readonly isAvailable: boolean;
  readonly createModel: (modelId: string) => LanguageModel | null;
}

function createOpenAIProvider() {
  const apiKey = serverEnv.OPENAI_API_KEY;
  if (!apiKey) {
    return null;
  }
  const baseURL = serverEnv.OPENAI_BASE_URL;
  return createOpenAI({
    apiKey,
    baseURL: baseURL || undefined,
  });
}

function createOpenAIModel(modelId: string): LanguageModel | null {
  const provider = createOpenAIProvider();
  if (!provider) {
    return null;
  }
  return provider.chat(modelId);
}

export const providerRegistry: ReadonlyMap<AIProviderId, AIProviderConfig> =
  new Map([
    [
      'openai',
      {
        id: 'openai',
        isAvailable: Boolean(serverEnv.OPENAI_API_KEY),
        createModel: createOpenAIModel,
      },
    ],
  ]);

export function createModel(
  providerId: AIProviderId,
  modelId: string
): LanguageModel | null {
  const config = providerRegistry.get(providerId);
  if (!config || !config.isAvailable) {
    return null;
  }
  return config.createModel(modelId);
}

export function isProviderAvailable(providerId: AIProviderId): boolean {
  const config = providerRegistry.get(providerId);
  return config?.isAvailable ?? false;
}

export function getAvailableProviders(): AIProviderId[] {
  const available: AIProviderId[] = [];
  for (const [id, config] of providerRegistry) {
    if (config.isAvailable) {
      available.push(id);
    }
  }
  return available;
}
