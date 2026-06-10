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
    credential: 'credential-value',
    prompt: 'show raw prompt',
    message: 'raw message',
    nested: {
      authorization: 'Bearer token',
      content: 'raw content',
      secret: 'provider-secret',
      visible: 'kept',
    },
    counters: {
      totalTokens: 42,
    },
  }) as Record<string, unknown>;

  assert.equal(sanitized.provider, 'openai');
  assert.equal(sanitized.apiKey, '[Redacted]');
  assert.equal(sanitized.credential, '[Redacted]');
  assert.equal(sanitized.prompt, '[Redacted]');
  assert.equal(sanitized.message, '[Redacted]');
  assert.deepEqual(sanitized.nested, {
    authorization: '[Redacted]',
    content: '[Redacted]',
    secret: '[Redacted]',
    visible: 'kept',
  });
  assert.deepEqual(sanitized.counters, {
    totalTokens: 42,
  });
});

test('admin audit raw content keys are detectable and omitted by default query shape', () => {
  assert.equal(isRawMessageContentKey('content'), true);
  assert.equal(isRawMessageContentKey('messageText'), true);
  assert.equal(isRawMessageContentKey('providerMetadata'), false);
});

test('admin audit metadata sanitizer preserves audit-safe permission reasons', () => {
  const sanitized = sanitizeAuditMetadata({
    aelokit: {
      permissionDecisions: [
        {
          id: 'tool-permission:clientWriteTool:user-1',
          outcome: 'deny',
          subjectType: 'user',
          resourceType: 'tool',
          resourceId: 'clientWriteTool',
          action: 'execute',
          reasonCode: 'policy-not-configured',
          reasonMessage:
            'Client-provided tools are ignored unless registered in the app-local tool registry.',
          decidedAt: '2026-06-10T00:00:00.000Z',
        },
      ],
    },
  }) as {
    aelokit: {
      permissionDecisions: Array<Record<string, unknown>>;
    };
  };

  assert.equal(
    sanitized.aelokit.permissionDecisions[0].reasonCode,
    'policy-not-configured'
  );
  assert.equal(
    sanitized.aelokit.permissionDecisions[0].reasonMessage,
    'Client-provided tools are ignored unless registered in the app-local tool registry.'
  );
});

test('admin audit metadata sanitizer still redacts unsafe reasonMessage lookalikes', () => {
  const sanitized = sanitizeAuditMetadata({
    reasonCode: 'policy-not-configured',
    reasonMessage: 'raw user message',
    outcome: 'deny',
    action: 'execute',
    resourceId: 'clientWriteTool',
    apiKey: 'secret-key',
  }) as Record<string, unknown>;

  assert.equal(sanitized.reasonMessage, '[Redacted]');
  assert.equal(sanitized.apiKey, '[Redacted]');
});
