import type { AIModelId, AIModelReference } from '@repo/ai/models';
import type { AIProviderId } from '@repo/ai/providers';
import type { ChatModelOption, ChatThreadSummary } from '@/components/ai/types';

export interface AppLocalModelCatalogEntry {
  readonly id: AIModelId;
  readonly providerId: AIProviderId;
  readonly providerModelId: string;
  readonly displayName: string;
  readonly capabilities: readonly string[];
  readonly contextWindowTokens: number;
  readonly status: 'enabled' | 'disabled' | 'deprecated';
  readonly isDefault: boolean;
  readonly sortOrder: number;
}

export const DEFAULT_PROVIDER_ID = 'openai' as const;
export const DEFAULT_MODEL_ID = 'gpt-5.5' as const;

const APP_LOCAL_MODEL_CATALOG: readonly AppLocalModelCatalogEntry[] = [
  {
    id: 'gpt-5.5',
    providerId: DEFAULT_PROVIDER_ID,
    providerModelId: 'gpt-5.5',
    displayName: 'GPT-5.5',
    isDefault: true,
    capabilities: ['chat', 'streaming', 'tool-calling', 'json-mode'],
    contextWindowTokens: 1_050_000,
    status: 'enabled',
    sortOrder: 0,
  },
  {
    id: 'gpt-4.1-mini',
    providerId: DEFAULT_PROVIDER_ID,
    providerModelId: 'gpt-4.1-mini',
    displayName: 'GPT-4.1 Mini',
    isDefault: false,
    capabilities: ['chat', 'streaming', 'tool-calling', 'json-mode'],
    contextWindowTokens: 1_047_576,
    status: 'enabled',
    sortOrder: 1,
  },
  {
    id: 'gpt-4.1',
    providerId: DEFAULT_PROVIDER_ID,
    providerModelId: 'gpt-4.1',
    displayName: 'GPT-4.1',
    isDefault: false,
    capabilities: ['chat', 'streaming', 'tool-calling', 'json-mode'],
    contextWindowTokens: 1_047_576,
    status: 'enabled',
    sortOrder: 2,
  },
  {
    id: 'gpt-4o-mini',
    providerId: DEFAULT_PROVIDER_ID,
    providerModelId: 'gpt-4o-mini',
    displayName: 'GPT-4o Mini',
    isDefault: false,
    capabilities: ['chat', 'streaming', 'tool-calling', 'json-mode'],
    contextWindowTokens: 128_000,
    status: 'enabled',
    sortOrder: 3,
  },
  {
    id: 'gpt-4o',
    providerId: DEFAULT_PROVIDER_ID,
    providerModelId: 'gpt-4o',
    displayName: 'GPT-4o',
    isDefault: false,
    capabilities: ['chat', 'streaming', 'tool-calling', 'json-mode'],
    contextWindowTokens: 128_000,
    status: 'enabled',
    sortOrder: 4,
  },
];

export function getAppLocalModelCatalog(): readonly AppLocalModelCatalogEntry[] {
  return APP_LOCAL_MODEL_CATALOG;
}

export function isSelectableModel(
  entry: Pick<AppLocalModelCatalogEntry, 'status'>
): boolean {
  return entry.status === 'enabled';
}

export function toModelOption(
  entry: Pick<AppLocalModelCatalogEntry, 'providerId' | 'id' | 'displayName'>
): ChatModelOption {
  return {
    providerId: entry.providerId,
    modelId: entry.id,
    providerLabel: 'OpenAI',
    modelLabel: entry.displayName,
    label: entry.displayName,
  };
}

export function getSelectableModelOptions(
  catalog: readonly AppLocalModelCatalogEntry[] = APP_LOCAL_MODEL_CATALOG
): readonly ChatModelOption[] {
  return [...catalog]
    .filter(isSelectableModel)
    .sort((left, right) => left.sortOrder - right.sortOrder)
    .map(toModelOption);
}

export function getCatalogModelReference(
  modelId: string,
  catalog: readonly AppLocalModelCatalogEntry[] = APP_LOCAL_MODEL_CATALOG
): AIModelReference | null {
  const model = catalog.find((entry) => entry.id === modelId);
  if (!model) {
    return null;
  }

  return {
    providerId: model.providerId,
    modelId: model.id,
  };
}

export function formatThreadModelLabel(
  thread: Pick<
    ChatThreadSummary,
    'providerName' | 'providerId' | 'modelName' | 'modelId'
  >
): string | null {
  if (!thread.providerId || !thread.modelId) {
    return null;
  }

  const providerLabel = thread.providerName ?? thread.providerId;
  const modelLabel = thread.modelName ?? thread.modelId;

  return `${providerLabel} / ${modelLabel}`;
}
