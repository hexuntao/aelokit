import assert from 'node:assert/strict';
import test from 'node:test';
import {
  enforceEntitlement,
  type AIEntitlementRequest,
} from './index';
import type { AIRuntimeContext } from '../context';

function createContext(
  overrides?: Partial<AIRuntimeContext>
): AIRuntimeContext {
  return {
    session: {
      session: {
        id: 'session-1',
        userId: 'user-1',
      },
      user: {
        id: 'user-1',
        email: 'user@example.com',
        name: 'User',
      },
    } as AIRuntimeContext['session'],
    userId: 'user-1',
    requestedAt: new Date(),
    ...overrides,
  };
}

function createRequest(
  overrides?: Partial<AIEntitlementRequest>
): AIEntitlementRequest {
  return {
    requestedModelId: 'gpt-5.5',
    allowedModelIds: ['gpt-5.5', 'gpt-4.1-mini'],
    knowledgeEnabled: false,
    knowledgeAvailable: true,
    memoryEnabled: false,
    toolsRequested: 0,
    toolsAllowed: false,
    creditsBillingEnabled: false,
    creditsRequired: 2,
    currentCredits: undefined,
    ...overrides,
  };
}

test('allows authenticated chat with an allowed model', () => {
  const result = enforceEntitlement(createContext(), createRequest());
  assert.equal(result.allowed, true);
});

test('rejects unauthenticated access', () => {
  const result = enforceEntitlement(
    createContext({
      userId: '',
      session: {
        session: null,
        user: null,
      } as unknown as AIRuntimeContext['session'],
    }),
    createRequest()
  );

  assert.equal(result.allowed, false);
  if (!result.allowed) {
    assert.equal(result.error?.code, 'unauthenticated');
  }
});

test('rejects unavailable selected model', () => {
  const result = enforceEntitlement(
    createContext(),
    createRequest({
      requestedModelId: 'gpt-4o',
      allowedModelIds: ['gpt-5.5'],
    })
  );

  assert.equal(result.allowed, false);
  if (!result.allowed) {
    assert.equal(result.error?.code, 'forbidden');
    assert.match(result.error?.message ?? '', /Selected model/);
  }
});

test('rejects knowledge when knowledge retrieval is unavailable', () => {
  const result = enforceEntitlement(
    createContext(),
    createRequest({
      knowledgeEnabled: true,
      knowledgeAvailable: false,
    })
  );

  assert.equal(result.allowed, false);
  if (!result.allowed) {
    assert.equal(result.error?.code, 'forbidden');
    assert.match(result.error?.message ?? '', /Knowledge retrieval/);
  }
});

test('rejects tool usage when tools are not allowed', () => {
  const result = enforceEntitlement(
    createContext(),
    createRequest({
      toolsRequested: 1,
      toolsAllowed: false,
    })
  );

  assert.equal(result.allowed, false);
  if (!result.allowed) {
    assert.equal(result.error?.code, 'forbidden');
    assert.match(result.error?.message ?? '', /Tool usage/);
  }
});

test('rejects insufficient credits when billing is enabled', () => {
  const result = enforceEntitlement(
    createContext(),
    createRequest({
      creditsBillingEnabled: true,
      creditsRequired: 4,
      currentCredits: 2,
    })
  );

  assert.equal(result.allowed, false);
  if (!result.allowed) {
    assert.equal(result.error?.code, 'payment_required');
    assert.match(result.error?.message ?? '', /Insufficient credits/);
  }
});
