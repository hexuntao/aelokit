import assert from 'node:assert/strict';
import test from 'node:test';
import { resolveSelectedModelId, selectModelReference } from './selection';

test('falls back to the system default when the user default is unavailable', () => {
  const selectedModelId = resolveSelectedModelId({
    userDefaultModelId: 'disabled-model',
    systemDefaultModelId: 'gpt-5.5',
    selectableModelIds: ['gpt-5.5', 'gpt-4.1'],
  });

  assert.equal(selectedModelId, 'gpt-5.5');
});

test('keeps per-chat selection above user and system defaults', () => {
  const selection = selectModelReference({
    selectedModel: {
      providerId: 'openai',
      modelId: 'gpt-4.1',
    },
    userDefaultModel: {
      providerId: 'openai',
      modelId: 'gpt-4.1-mini',
    },
    systemDefaultModel: {
      providerId: 'openai',
      modelId: 'gpt-5.5',
    },
  });

  assert.deepEqual(selection, {
    reference: {
      providerId: 'openai',
      modelId: 'gpt-4.1',
    },
    source: 'thread',
  });
});
