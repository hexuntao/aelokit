import 'server-only';

import type { LanguageModel } from 'ai';
import { and, eq } from 'drizzle-orm';
import { nanoid } from 'nanoid';
import { getDb } from '@/db';
import { aiModel, aiProvider, aiUserModelSetting } from '@repo/db/ai-schema';
import type {
  AIModelId,
  AIModelReference,
  AIModelSelectionReference,
  AIModelSelectionSource,
} from '@repo/ai/models';
import type { AIProviderId } from '@repo/ai/providers';
import type { ChatModelOption } from '@/ai/chat-types';
import { createModel, isProviderAvailable } from '../providers';
import {
  DEFAULT_MODEL_ID,
  DEFAULT_PROVIDER_ID,
  getAppLocalModelCatalog,
} from './catalog';
import { resolveSelectedModelId, selectModelReference } from './selection';

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

  for (const [index, model] of getAppLocalModelCatalog().entries()) {
    await db
      .insert(aiModel)
      .values({
        id: model.id,
        providerId: DEFAULT_PROVIDER_ID,
        providerModelId: model.providerModelId,
        displayName: model.displayName,
        capabilities: model.capabilities,
        contextWindowTokens: model.contextWindowTokens,
        status: model.status,
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
          status: model.status,
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
  await ensureAIModelCatalog();

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

  const fallbackModel = getAppLocalModelCatalog().find(
    (model) => model.isDefault
  );
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

  const systemDefaultModel = await getSystemDefaultModel();
  const preferredModel = selectModelReference({
    selectedModel: threadModel,
    userDefaultModel,
    systemDefaultModel,
  });

  if (!preferredModel) {
    return {
      success: false,
      error: {
        code: 'no-default-model',
        message:
          'No available model found. Check provider configuration and model availability.',
      },
    };
  }

  if (preferredModel.source === 'thread') {
    return tryResolveModel(preferredModel.reference, preferredModel.source);
  }

  if (preferredModel.source === 'user-default') {
    const userDefaultResult = await tryResolveModel(
      preferredModel.reference,
      preferredModel.source
    );
    if (userDefaultResult.success) {
      return userDefaultResult;
    }
  }

  if (systemDefaultModel) {
    const result = await tryResolveModel(systemDefaultModel, 'system-default');
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

export async function listSelectableModelOptions(): Promise<
  readonly ChatModelOption[]
> {
  await ensureAIModelCatalog();

  const db = await getDb();
  const rows = await db
    .select({
      providerId: aiProvider.id,
      providerLabel: aiProvider.displayName,
      modelId: aiModel.id,
      modelLabel: aiModel.displayName,
    })
    .from(aiModel)
    .innerJoin(aiProvider, eq(aiProvider.id, aiModel.providerId))
    .where(and(eq(aiProvider.status, 'enabled'), eq(aiModel.status, 'enabled')))
    .orderBy(aiProvider.sortOrder, aiModel.sortOrder);

  return rows.map((row) => ({
    providerId: row.providerId,
    modelId: row.modelId,
    providerLabel: row.providerLabel,
    modelLabel: row.modelLabel,
    label: row.modelLabel,
  }));
}

export async function getChatModelPreferenceState(userId: string): Promise<{
  readonly availableModels: readonly ChatModelOption[];
  readonly userDefaultModelId?: string;
  readonly systemDefaultModelId: string;
  readonly initialSelectedModelId?: string;
}> {
  await ensureAIModelCatalog();

  const [availableModels, rawUserDefaultModel, systemDefaultModel] =
    await Promise.all([
      listSelectableModelOptions(),
      getUserDefaultModelReference(userId),
      getDefaultModelForProvider(DEFAULT_PROVIDER_ID),
    ]);

  const selectableModelIds = availableModels.map((model) => model.modelId);
  const userDefaultModelId =
    rawUserDefaultModel &&
    availableModels.some(
      (model) =>
        model.providerId === rawUserDefaultModel.providerId &&
        model.modelId === rawUserDefaultModel.modelId
    )
      ? rawUserDefaultModel.modelId
      : undefined;

  const systemDefaultModelId =
    resolveSelectedModelId({
      requestedModelId: systemDefaultModel?.modelId ?? DEFAULT_MODEL_ID,
      selectableModelIds,
      systemDefaultModelId: DEFAULT_MODEL_ID,
    }) ?? DEFAULT_MODEL_ID;

  return {
    availableModels,
    userDefaultModelId,
    systemDefaultModelId,
    initialSelectedModelId: resolveSelectedModelId({
      userDefaultModelId,
      systemDefaultModelId,
      selectableModelIds,
    }),
  };
}

export async function saveUserDefaultModelSelection(
  userId: string,
  modelId: string
): Promise<
  | {
      readonly success: true;
      readonly data: {
        readonly userDefaultModelId: string;
        readonly selectedModel: ChatModelOption;
      };
    }
  | {
      readonly success: false;
      readonly error: Error;
    }
> {
  const availableModels = await listSelectableModelOptions();
  const selectedModel = availableModels.find(
    (model) => model.modelId === modelId
  );

  if (!selectedModel) {
    return {
      success: false,
      error: new Error('The selected model is not available.'),
    };
  }

  const db = await getDb();
  const updatedAt = new Date();

  await db
    .insert(aiUserModelSetting)
    .values({
      id: `ums-${nanoid()}`,
      userId,
      providerId: selectedModel.providerId,
      modelId: selectedModel.modelId,
      createdAt: updatedAt,
      updatedAt,
    })
    .onConflictDoUpdate({
      target: aiUserModelSetting.userId,
      set: {
        providerId: selectedModel.providerId,
        modelId: selectedModel.modelId,
        updatedAt,
      },
    });

  return {
    success: true,
    data: {
      userDefaultModelId: selectedModel.modelId,
      selectedModel,
    },
  };
}

export { validateDefaultModelCandidate } from './catalog';
export { getSystemDefaultModel, getDefaultModelForProvider };
