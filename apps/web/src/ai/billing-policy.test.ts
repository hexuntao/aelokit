import assert from 'node:assert/strict';
import test from 'node:test';
import {
  getAIUsageBillingMode,
  getInitialAIUsageBillingStatus,
  shouldRunAICreditsBilling,
} from './billing-policy';

test('feature flag off keeps AI usage audit-only', () => {
  assert.equal(getAIUsageBillingMode(false), 'audit_only');
  assert.equal(getInitialAIUsageBillingStatus(false), 'audit_only');
  assert.equal(shouldRunAICreditsBilling(false), false);
});

test('feature flag on enables credits billing mode', () => {
  assert.equal(getAIUsageBillingMode(true), 'credits');
  assert.equal(getInitialAIUsageBillingStatus(true), 'preflight_passed');
  assert.equal(shouldRunAICreditsBilling(true), true);
});
