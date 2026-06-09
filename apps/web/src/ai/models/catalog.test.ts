import assert from 'node:assert/strict';
import test from 'node:test';
import {
  getSelectableModelOptions,
  toModelOption,
  validateDefaultModelCandidate,
  type AppLocalModelCatalogEntry,
} from './catalog';

const enabledModel: AppLocalModelCatalogEntry = {
  id: 'gpt-5.5',
  providerId: 'openai',
  providerModelId: 'gpt-5.5',
  displayName: 'GPT-5.5',
  capabilities: ['chat'],
  contextWindowTokens: 1_000,
  status: 'enabled',
  isDefault: true,
  sortOrder: 0,
};

test('maps model catalog entries to UI options', () => {
  assert.deepEqual(toModelOption(enabledModel), {
    providerId: 'openai',
    modelId: 'gpt-5.5',
    providerLabel: 'OpenAI',
    modelLabel: 'GPT-5.5',
    label: 'GPT-5.5',
  });
});

test('excludes disabled models from selectable options', () => {
  const options = getSelectableModelOptions([
    enabledModel,
    {
      ...enabledModel,
      id: 'gpt-4o',
      providerModelId: 'gpt-4o',
      displayName: 'GPT-4o',
      isDefault: false,
      sortOrder: 1,
      status: 'disabled',
    },
  ]);

  assert.deepEqual(
    options.map((option) => option.modelId),
    ['gpt-5.5']
  );
});

test('rejects an invalid default model candidate', () => {
  const result = validateDefaultModelCandidate(null, {
    providerId: 'openai',
    modelId: 'missing-model',
  });

  assert.deepEqual(result, {
    success: false,
    error: 'Model "missing-model" was not found for provider "openai".',
  });
});

test('rejects a disabled provider default model candidate', () => {
  const result = validateDefaultModelCandidate(
    {
      providerId: 'openai',
      modelId: 'gpt-5.5',
      providerStatus: 'disabled',
      modelStatus: 'enabled',
    },
    {
      providerId: 'openai',
      modelId: 'gpt-5.5',
    }
  );

  assert.deepEqual(result, {
    success: false,
    error: 'Provider "openai" is not enabled.',
  });
});

test('rejects a disabled default model candidate', () => {
  const result = validateDefaultModelCandidate(
    {
      providerId: 'openai',
      modelId: 'gpt-5.5',
      providerStatus: 'enabled',
      modelStatus: 'disabled',
    },
    {
      providerId: 'openai',
      modelId: 'gpt-5.5',
    }
  );

  assert.deepEqual(result, {
    success: false,
    error: 'Model "gpt-5.5" is not selectable.',
  });
});

test('accepts an enabled default model candidate', () => {
  const result = validateDefaultModelCandidate(
    {
      providerId: 'openai',
      modelId: 'gpt-5.5',
      providerStatus: 'enabled',
      modelStatus: 'enabled',
    },
    {
      providerId: 'openai',
      modelId: 'gpt-5.5',
    }
  );

  assert.deepEqual(result, { success: true });
});
