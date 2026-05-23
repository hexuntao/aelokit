import type { AIModelReference, AIModelSelectionSource } from '@repo/ai/models';

interface SelectModelReferenceInput {
  readonly selectedModel?: AIModelReference | null;
  readonly userDefaultModel?: AIModelReference | null;
  readonly systemDefaultModel?: AIModelReference | null;
}

interface ResolveSelectedModelIdInput {
  readonly requestedModelId?: string | null;
  readonly userDefaultModelId?: string | null;
  readonly systemDefaultModelId?: string | null;
  readonly selectableModelIds: readonly string[];
}

export function selectModelReference({
  selectedModel,
  userDefaultModel,
  systemDefaultModel,
}: SelectModelReferenceInput): {
  readonly reference: AIModelReference;
  readonly source: AIModelSelectionSource;
} | null {
  if (selectedModel) {
    return {
      reference: selectedModel,
      source: 'thread',
    };
  }

  if (userDefaultModel) {
    return {
      reference: userDefaultModel,
      source: 'user-default',
    };
  }

  if (systemDefaultModel) {
    return {
      reference: systemDefaultModel,
      source: 'system-default',
    };
  }

  return null;
}

export function resolveSelectedModelId({
  requestedModelId,
  userDefaultModelId,
  systemDefaultModelId,
  selectableModelIds,
}: ResolveSelectedModelIdInput): string | undefined {
  const selectableIds = new Set(selectableModelIds);

  for (const candidate of [
    requestedModelId,
    userDefaultModelId,
    systemDefaultModelId,
  ]) {
    if (candidate && selectableIds.has(candidate)) {
      return candidate;
    }
  }

  return selectableModelIds[0];
}
