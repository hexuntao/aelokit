import 'server-only';

import type { LanguageModel } from 'ai';
import { and, eq } from 'drizzle-orm';
import { getDb } from '@/db';
import { aiModel, aiProvider, aiUserModelSetting } from '@repo/db/ai-schema';
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
  readonly displayName: string;
  readonly capabilities: ReadonlyArray<string>;
  readonly contextWindowTokens: number;
}> = [
  {
    id: 'gpt-5.5',
    providerModelId: 'gpt-5.5',
    displayName: 'GPT-5.5',
    isDefault: true,
    capabilities: ['chat', 'streaming', 'tool-calling', 'json-mode'],
    contextWindowTokens: 1_050_000,
  },
  {
    id: 'gpt-4.1-mini',
    providerModelId: 'gpt-4.1-mini',
    displayName: 'GPT-4.1 Mini',
    isDefault: false,
    capabilities: ['chat', 'streaming', 'tool-calling', 'json-mode'],
    contextWindowTokens: 1_047_576,
  },
  {
    id: 'gpt-4.1',
    providerModelId: 'gpt-4.1',
    displayName: 'GPT-4.1',
    isDefault: false,
    capabilities: ['chat', 'streaming', 'tool-calling', 'json-mode'],
    contextWindowTokens: 1_047_576,
  },
  {
    id: 'gpt-4o-mini',
    providerModelId: 'gpt-4o-mini',
    displayName: 'GPT-4o Mini',
    isDefault: false,
    capabilities: ['chat', 'streaming', 'tool-calling', 'json-mode'],
    contextWindowTokens: 128_000,
  },
  {
    id: 'gpt-4o',
    providerModelId: 'gpt-4o',
    displayName: 'GPT-4o',
    isDefault: false,
    capabilities: ['chat', 'streaming', 'tool-calling', 'json-mode'],
    contextWindowTokens: 128_000,
  },
];

const DEFAULT_PROVIDER_ID = 'openai';
const DEFAULT_MODEL_ID = 'gpt-5.5';

export async function ensureAIModelCatalog(): Promise<void> {
  const db = await getDb();
  const updatedAt = new Date();

  await db
    .insert(aiProvider)
    .values({
      id: DEFAULT_PROVIDER_ID,
      displayName: 'OpenAI',
      description: 'OpenAI models for AeloKit v0.2 chat.',
      documentationUrl: 'https://platform.openai.com/docs/models',
      capabilities: ['chat', 'streaming', 'tool-calling', 'json-mode'],
      status: 'enabled',
      sortOrder: 0,
      createdAt: updatedAt,
      updatedAt,
    })
    .onConflictDoUpdate({
      target: aiProvider.id,
      set: {
        displayName: 'OpenAI',
        description: 'OpenAI models for AeloKit v0.2 chat.',
        documentationUrl: 'https://platform.openai.com/docs/models',
        capabilities: ['chat', 'streaming', 'tool-calling', 'json-mode'],
        status: 'enabled',
        sortOrder: 0,
        updatedAt,
      },
    });

  for (const [index, model] of DEFAULT_OPENAI_MODELS.entries()) {
    await db
      .insert(aiModel)
      .values({
        id: model.id,
        providerId: DEFAULT_PROVIDER_ID,
        providerModelId: model.providerModelId,
        displayName: model.displayName,
        capabilities: model.capabilities,
        contextWindowTokens: model.contextWindowTokens,
        status: 'enabled',
        isDefault: false,
        sortOrder: index,
        createdAt: updatedAt,
        updatedAt,
      })
      .onConflictDoUpdate({
        target: aiModel.id,
        set: {
          providerId: DEFAULT_PROVIDER_ID,
          providerModelId: model.providerModelId,
          displayName: model.displayName,
          capabilities: model.capabilities,
          contextWindowTokens: model.contextWindowTokens,
          status: 'enabled',
          sortOrder: index,
          updatedAt,
        },
      });
  }

  const existingDefault = await db
    .select({ id: aiModel.id })
    .from(aiModel)
    .where(
      and(
        eq(aiModel.providerId, DEFAULT_PROVIDER_ID),
        eq(aiModel.isDefault, true)
      )
    )
    .limit(1);

  if (existingDefault.length === 0) {
    await db
      .update(aiModel)
      .set({ isDefault: true, updatedAt })
      .where(
        and(
          eq(aiModel.providerId, DEFAULT_PROVIDER_ID),
          eq(aiModel.id, DEFAULT_MODEL_ID)
        )
      );
  }
}

async function findModelConfig(
  providerId: AIProviderId,
  modelId: AIModelId
): Promise<{ readonly providerModelId: string } | null> {
  const db = await getDb();
  const [model] = await db
    .select({
      id: aiModel.id,
      providerModelId: aiModel.providerModelId,
      status: aiModel.status,
    })
    .from(aiModel)
    .where(and(eq(aiModel.providerId, providerId), eq(aiModel.id, modelId)))
    .limit(1);

  if (!model || model.status !== 'enabled') {
    return null;
  }

  return { providerModelId: model.providerModelId };
}

async function getDefaultModelForProvider(
  providerId: AIProviderId
): Promise<AIModelReference | null> {
  const db = await getDb();
  const [model] = await db
    .select({ id: aiModel.id })
    .from(aiModel)
    .where(
      and(
        eq(aiModel.providerId, providerId),
        eq(aiModel.isDefault, true),
        eq(aiModel.status, 'enabled')
      )
    )
    .limit(1);

  if (model) {
    return { providerId, modelId: model.id };
  }

  if (providerId !== DEFAULT_PROVIDER_ID) {
    return null;
  }

  const fallbackModel = DEFAULT_OPENAI_MODELS.find((m) => m.isDefault);
  if (!fallbackModel) {
    return null;
  }
  return { providerId, modelId: fallbackModel.id };
}

async function getSystemDefaultModel(): Promise<AIModelReference | null> {
  if (!isProviderAvailable(DEFAULT_PROVIDER_ID)) {
    return null;
  }
  return getDefaultModelForProvider(DEFAULT_PROVIDER_ID);
}

export async function getUserDefaultModelReference(
  userId: string
): Promise<AIModelReference | null> {
  await ensureAIModelCatalog();

  const db = await getDb();
  const [setting] = await db
    .select({
      providerId: aiUserModelSetting.providerId,
      modelId: aiUserModelSetting.modelId,
    })
    .from(aiUserModelSetting)
    .where(eq(aiUserModelSetting.userId, userId))
    .limit(1);

  if (!setting) {
    return null;
  }

  return {
    providerId: setting.providerId,
    modelId: setting.modelId,
  };
}

export async function resolveModel(
  threadModel?: AIModelReference,
  userDefaultModel?: AIModelReference
): Promise<ModelResolutionResult> {
  await ensureAIModelCatalog();

  if (threadModel) {
    return tryResolveModel(threadModel, 'thread');
  }

  if (userDefaultModel) {
    const userDefaultResult = await tryResolveModel(
      userDefaultModel,
      'user-default'
    );
    if (userDefaultResult.success) {
      return userDefaultResult;
    }
  }

  const systemDefault = await getSystemDefaultModel();
  if (systemDefault) {
    const result = await tryResolveModel(systemDefault, 'system-default');
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

async function tryResolveModel(
  reference: AIModelReference,
  source: AIModelSelectionSource
): Promise<ModelResolutionResult> {
  const { providerId, modelId } = reference;
  const db = await getDb();
  const [provider] = await db
    .select({ id: aiProvider.id, status: aiProvider.status })
    .from(aiProvider)
    .where(eq(aiProvider.id, providerId))
    .limit(1);

  if (!provider || provider.status !== 'enabled') {
    return {
      success: false,
      error: {
        code: 'provider-unavailable',
        message: `Provider "${providerId}" is not enabled.`,
        providerId,
      },
    };
  }

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

  const modelConfig = await findModelConfig(providerId, modelId);
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
