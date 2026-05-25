import assert from 'node:assert/strict';
import test from 'node:test';
import {
  DEFAULT_AGENT_ID,
  getSelectableAgentOptions,
  resolveAgentSelection,
} from './index';

test('returns the default agent when no agent is requested', () => {
  const result = resolveAgentSelection();
  assert.equal(result.agent.id, DEFAULT_AGENT_ID);
  assert.equal(result.fallbackFromUnknown, false);
});

test('resolves a known requested agent id', () => {
  const result = resolveAgentSelection({
    requestedAgentId: 'agent-concise-assistant',
  });

  assert.equal(result.agent.id, 'agent-concise-assistant');
  assert.equal(result.fallbackFromUnknown, false);
});

test('falls back to the default agent for an unknown request', () => {
  const result = resolveAgentSelection({
    requestedAgentId: 'agent-missing',
  });

  assert.equal(result.agent.id, DEFAULT_AGENT_ID);
  assert.equal(result.fallbackFromUnknown, true);
});

test('exposes agent options for UI selection', () => {
  const options = getSelectableAgentOptions();
  assert.equal(options.length >= 3, true);
  assert.deepEqual(
    options.map((option) => option.id),
    ['agent-default-chat', 'agent-knowledge-focused', 'agent-concise-assistant']
  );
});
