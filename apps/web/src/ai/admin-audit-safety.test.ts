import assert from 'node:assert/strict';
import test from 'node:test';
import {
  canAccessAdminUsageAudit,
  isRawMessageContentKey,
  sanitizeAuditMetadata,
} from './admin-audit-safety';

test('admin usage audit permission allows admins and demo mode only', () => {
  assert.equal(canAccessAdminUsageAudit({ role: 'admin' }, false), true);
  assert.equal(canAccessAdminUsageAudit({ role: 'user' }, true), true);
  assert.equal(canAccessAdminUsageAudit({ role: 'user' }, false), false);
  assert.equal(canAccessAdminUsageAudit(undefined, false), false);
});

test('admin audit metadata sanitizer redacts sensitive fields', () => {
  const sanitized = sanitizeAuditMetadata({
    provider: 'openai',
    apiKey: 'secret-key',
    nested: {
      authorization: 'Bearer token',
      visible: 'kept',
    },
  }) as Record<string, unknown>;

  assert.equal(sanitized.provider, 'openai');
  assert.equal(sanitized.apiKey, '[Redacted]');
  assert.deepEqual(sanitized.nested, {
    authorization: '[Redacted]',
    visible: 'kept',
  });
});

test('admin audit raw content keys are detectable and omitted by default query shape', () => {
  assert.equal(isRawMessageContentKey('content'), true);
  assert.equal(isRawMessageContentKey('messageText'), true);
  assert.equal(isRawMessageContentKey('providerMetadata'), false);
});
