import assert from 'node:assert/strict';
import test from 'node:test';
import {
  DEFAULT_AGENT_ID,
  resolveAgentSelectionFromCatalog,
  getSelectableAgentOptions,
  resolveAgentSelection,
} from './index';

test('returns the default agent when no agent is requested', () => {
  const result = resolveAgentSelection();
  assert.equal(result.success, true);
  if (!result.success) {
    return;
  }
  assert.equal(result.data.agent.id, DEFAULT_AGENT_ID);
  assert.equal(result.data.fallbackFromUnknown, false);
});

test('resolves a known requested agent id', () => {
  const result = resolveAgentSelection({
    requestedAgentId: 'agent-concise-assistant',
  });

  assert.equal(result.success, true);
  if (!result.success) {
    return;
  }
  assert.equal(result.data.agent.id, 'agent-concise-assistant');
  assert.equal(result.data.fallbackFromUnknown, false);
});

test('rejects an unknown requested agent id', () => {
  const result = resolveAgentSelection({
    requestedAgentId: 'agent-missing',
  });

  assert.equal(result.success, false);
  if (result.success) {
    return;
  }
  assert.equal(result.error.code, 'agent-not-found');
  assert.equal(result.error.agentId, 'agent-missing');
});

test('rejects a disabled or private requested agent id', () => {
  const result = resolveAgentSelectionFromCatalog(
    getSelectableAgentOptions().filter(
      (agent) => agent.id !== 'agent-concise-assistant'
    ),
    {
      requestedAgentId: 'agent-concise-assistant',
    }
  );

  assert.equal(result.success, false);
  if (result.success) {
    return;
  }
  assert.equal(result.error.code, 'agent-unavailable');
  assert.equal(result.error.agentId, 'agent-concise-assistant');
});

test('rejects when no agents are selectable', () => {
  const result = resolveAgentSelectionFromCatalog([]);

  assert.equal(result.success, false);
  if (result.success) {
    return;
  }
  assert.equal(result.error.code, 'no-agents-available');
});

test('exposes agent options for UI selection', () => {
  const options = getSelectableAgentOptions();
  assert.equal(options.length >= 3, true);
  assert.deepEqual(
    options.map((option) => option.id),
    ['agent-default-chat', 'agent-knowledge-focused', 'agent-concise-assistant']
  );
});
