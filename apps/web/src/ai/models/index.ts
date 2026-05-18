import 'server-only';

import type { LanguageModel } from 'ai';
import type {
  AIModelId,
  AIModelReference,
  AIModelSelectionReference,
  AIModelSelectionSource,
} from '@repo/ai/models';
import type { AIProviderId } from '@repo/ai/providers';
import { createModel, isProviderAvailable } from '../providers';

export interface ResolvedModel {
  readonly model: LanguageModel;
  readonly reference: AIModelReference;
  readonly source: AIModelSelectionSource;
  readonly providerModelId: string;
}

export interface ModelResolutionError {
  readonly code:
    | 'provider-unavailable'
    | 'model-not-found'
    | 'model-disabled'
    | 'no-default-model';
  readonly message: string;
  readonly providerId?: AIProviderId;
  readonly modelId?: AIModelId;
}

export type ModelResolutionResult =
  | { readonly success: true; readonly data: ResolvedModel }
  | { readonly success: false; readonly error: ModelResolutionError };

const DEFAULT_OPENAI_MODELS: ReadonlyArray<{
  readonly id: AIModelId;
  readonly providerModelId: string;
  readonly isDefault: boolean;
}> = [
  { id: 'gpt-4.1-mini', providerModelId: 'gpt-4.1-mini', isDefault: true },
  { id: 'gpt-4.1', providerModelId: 'gpt-4.1', isDefault: false },
  { id: 'gpt-4o-mini', providerModelId: 'gpt-4o-mini', isDefault: false },
  { id: 'gpt-4o', providerModelId: 'gpt-4o', isDefault: false },
];

function findModelConfig(
  providerId: AIProviderId,
  modelId: AIModelId
): { readonly providerModelId: string } | null {
  if (providerId !== 'openai') {
    return null;
  }
  const config = DEFAULT_OPENAI_MODELS.find((m) => m.id === modelId);
  return config ? { providerModelId: config.providerModelId } : null;
}

function getDefaultModelForProvider(
  providerId: AIProviderId
): AIModelReference | null {
  if (providerId !== 'openai') {
    return null;
  }
  const defaultModel = DEFAULT_OPENAI_MODELS.find((m) => m.isDefault);
  if (!defaultModel) {
    return null;
  }
  return { providerId, modelId: defaultModel.id };
}

function getSystemDefaultModel(): AIModelReference | null {
  if (!isProviderAvailable('openai')) {
    return null;
  }
  return getDefaultModelForProvider('openai');
}

export function resolveModel(
  threadModel?: AIModelReference,
  userDefaultModel?: AIModelReference
): ModelResolutionResult {
  const selectionOrder: ReadonlyArray<{
    reference: AIModelReference;
    source: AIModelSelectionSource;
  }> = [
    ...(threadModel
      ? [{ reference: threadModel, source: 'thread' as const }]
      : []),
    ...(userDefaultModel
      ? [{ reference: userDefaultModel, source: 'user-default' as const }]
      : []),
  ];

  for (const { reference, source } of selectionOrder) {
    const result = tryResolveModel(reference, source);
    if (result.success) {
      return result;
    }
  }

  const systemDefault = getSystemDefaultModel();
  if (systemDefault) {
    const result = tryResolveModel(systemDefault, 'system-default');
    if (result.success) {
      return result;
    }
  }

  return {
    success: false,
    error: {
      code: 'no-default-model',
      message:
        'No available model found. Check provider configuration and model availability.',
    },
  };
}

function tryResolveModel(
  reference: AIModelReference,
  source: AIModelSelectionSource
): ModelResolutionResult {
  const { providerId, modelId } = reference;

  if (!isProviderAvailable(providerId)) {
    return {
      success: false,
      error: {
        code: 'provider-unavailable',
        message: `Provider "${providerId}" is not available or not configured.`,
        providerId,
      },
    };
  }

  const modelConfig = findModelConfig(providerId, modelId);
  if (!modelConfig) {
    return {
      success: false,
      error: {
        code: 'model-not-found',
        message: `Model "${modelId}" not found for provider "${providerId}".`,
        providerId,
        modelId,
      },
    };
  }

  const model = createModel(providerId, modelConfig.providerModelId);
  if (!model) {
    return {
      success: false,
      error: {
        code: 'provider-unavailable',
        message: `Failed to create model "${modelConfig.providerModelId}" for provider "${providerId}".`,
        providerId,
        modelId,
      },
    };
  }

  return {
    success: true,
    data: {
      model,
      reference,
      source,
      providerModelId: modelConfig.providerModelId,
    },
  };
}

export function createModelSelectionReference(
  reference: AIModelReference,
  source: AIModelSelectionSource
): AIModelSelectionReference {
  return {
    ...reference,
    source,
  };
}

export { getSystemDefaultModel, getDefaultModelForProvider };
