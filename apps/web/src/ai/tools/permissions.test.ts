import assert from 'node:assert/strict';
import test from 'node:test';
import {
  decideToolPermission,
  toSafePermissionDecisionMetadata,
} from './permissions';

test('denies tools when plan or agent policy disables tools', () => {
  const decision = decideToolPermission({
    userId: 'user-1',
    toolId: 'knowledge.inspect',
    toolsAllowed: false,
    agentAllowedToolIds: ['knowledge.inspect'],
    requiredScope: 'knowledge:read',
    action: 'read',
    resourceType: 'knowledge',
  });

  assert.equal(decision.outcome, 'deny');
  assert.equal(decision.reason.code, 'resource-disabled');
});

test('denies tools missing from the selected agent allow-list', () => {
  const decision = decideToolPermission({
    userId: 'user-1',
    toolId: 'knowledge.inspect',
    toolsAllowed: true,
    agentAllowedToolIds: [],
    requiredScope: 'knowledge:read',
    action: 'read',
    resourceType: 'knowledge',
  });

  assert.equal(decision.outcome, 'deny');
  assert.equal(decision.reason.code, 'missing-permission');
});

test('allows tools when plan and agent policy allow the tool', () => {
  const decision = decideToolPermission({
    userId: 'user-1',
    toolId: 'knowledge.inspect',
    toolsAllowed: true,
    agentAllowedToolIds: ['knowledge.inspect'],
    requiredScope: 'knowledge:read',
    action: 'read',
    resourceType: 'knowledge',
  });

  assert.equal(decision.outcome, 'allow');
  assert.equal(decision.reason.code, 'allowed-by-policy');
});

test('serializes permission decisions without raw inputs or credentials', () => {
  const decision = decideToolPermission({
    userId: 'user-1',
    toolId: 'knowledge.inspect',
    toolsAllowed: true,
    agentAllowedToolIds: ['knowledge.inspect'],
    requiredScope: 'knowledge:read',
    action: 'read',
    resourceType: 'knowledge',
  });
  const metadata = toSafePermissionDecisionMetadata(decision);

  assert.deepEqual(Object.keys(metadata ?? {}).sort(), [
    'action',
    'decidedAt',
    'id',
    'outcome',
    'reasonCode',
    'reasonMessage',
    'resourceId',
    'resourceType',
    'subjectType',
  ]);
});
