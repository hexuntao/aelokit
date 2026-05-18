import type { AIErrorCode, AIErrorMetadata } from '@repo/ai/errors';

export interface AIRuntimeError {
  readonly code: AIErrorCode | string;
  readonly message: string;
  readonly cause?: Error;
  readonly metadata?: Readonly<Record<string, unknown>>;
}

export function createRuntimeError(
  code: string,
  message: string,
  options?: {
    readonly cause?: Error;
    readonly metadata?: Readonly<Record<string, unknown>>;
  }
): AIRuntimeError {
  return {
    code,
    message,
    cause: options?.cause,
    metadata: options?.metadata,
  };
}

export const RuntimeErrors = {
  unauthenticated: () =>
    createRuntimeError('unauthenticated', 'User must be authenticated.'),

  forbidden: (reason?: string) =>
    createRuntimeError('forbidden', reason ?? 'Access denied.'),

  providerUnavailable: (providerId: string) =>
    createRuntimeError(
      'provider-unavailable',
      `Provider "${providerId}" is not available.`
    ),

  modelNotFound: (modelId: string, providerId: string) =>
    createRuntimeError(
      'model-not-found',
      `Model "${modelId}" not found for provider "${providerId}".`
    ),

  noDefaultModel: () =>
    createRuntimeError('no-default-model', 'No default model available.'),

  streamFailed: (reason?: string) =>
    createRuntimeError('stream-failed', reason ?? 'Stream operation failed.'),

  persistenceFailed: (reason?: string) =>
    createRuntimeError(
      'persistence-failed',
      reason ?? 'Persistence operation failed.'
    ),

  usageAuditFailed: (reason?: string) =>
    createRuntimeError(
      'usage-audit-failed',
      reason ?? 'Usage audit operation failed.'
    ),

  invalidRequest: (reason: string) =>
    createRuntimeError('invalid-request', reason),

  rateLimited: (retryAfter?: number) =>
    createRuntimeError(
      'rate-limited',
      retryAfter
        ? `Rate limited. Retry after ${retryAfter} seconds.`
        : 'Rate limited.'
    ),
} as const;

export function isRuntimeError(error: unknown): error is AIRuntimeError {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    'message' in error
  );
}
