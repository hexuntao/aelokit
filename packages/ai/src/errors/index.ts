export type AIErrorCode =
  | 'AI_PROVIDER_NOT_CONFIGURED'
  | 'AI_PROVIDER_DISABLED'
  | 'AI_MODEL_NOT_FOUND'
  | 'AI_MODEL_DISABLED'
  | 'AI_MODEL_CAPABILITY_UNSUPPORTED'
  | 'AI_PERMISSION_DENIED'
  | 'AI_USAGE_AUDIT_FAILED'
  | 'AI_COST_ESTIMATE_UNAVAILABLE'
  | 'AI_TOOL_CALL_FAILED'
  | 'AI_MCP_SERVER_UNAVAILABLE'
  | 'AI_RUNTIME_UNAVAILABLE'
  | 'AI_UNKNOWN_ERROR';

export type AIErrorSeverity = 'info' | 'warning' | 'error' | 'fatal';

export type AIErrorRetryability = 'retryable' | 'not-retryable' | 'unknown';

export interface AIErrorContext {
  readonly providerId?: string;
  readonly modelId?: string;
  readonly agentId?: string;
  readonly threadId?: string;
  readonly messageId?: string;
  readonly toolCallId?: string;
  readonly mcpServerId?: string;
}

export interface AIErrorMetadata {
  readonly severity: AIErrorSeverity;
  readonly retryability: AIErrorRetryability;
  readonly causeCode?: string;
  readonly context?: AIErrorContext;
}

export interface AIError {
  readonly code: AIErrorCode;
  readonly message: string;
  readonly metadata: AIErrorMetadata;
  // Structured errors are contracts for audit/runtime layers; they are not thrown here.
  readonly occurredAt?: string;
}
