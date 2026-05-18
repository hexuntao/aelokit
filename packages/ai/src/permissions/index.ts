export type AIPermissionDecisionId = string;

export type AIPermissionSubjectType = 'user' | 'agent' | 'system';

export type AIPermissionResourceType =
  | 'agent'
  | 'tool'
  | 'skill'
  | 'mcp-server'
  | 'mcp-tool'
  | 'model'
  | 'knowledge'
  | 'memory';

export type AIPermissionAction =
  | 'read'
  | 'use'
  | 'execute'
  | 'write'
  | 'manage';

export type AIPermissionDecisionOutcome = 'allow' | 'deny';

export type AIPermissionReasonCode =
  | 'allowed-by-policy'
  | 'requires-user-consent'
  | 'requires-admin-approval'
  | 'missing-permission'
  | 'resource-disabled'
  | 'resource-forbidden'
  | 'policy-not-configured'
  | 'unknown';

export interface AIPermissionSubjectReference {
  readonly type: AIPermissionSubjectType;
  readonly id: string;
}

export interface AIPermissionResourceReference {
  readonly type: AIPermissionResourceType;
  readonly id: string;
  readonly parentId?: string;
}

export interface AIPermissionRequest {
  readonly subject: AIPermissionSubjectReference;
  readonly resource: AIPermissionResourceReference;
  readonly action: AIPermissionAction;
  readonly policyId?: string;
}

export interface AIPermissionReason {
  readonly code: AIPermissionReasonCode;
  readonly message?: string;
  readonly policyId?: string;
}

export interface AIPermissionDecision {
  readonly id?: AIPermissionDecisionId;
  readonly outcome: AIPermissionDecisionOutcome;
  readonly request: AIPermissionRequest;
  // Reasons must be audit-safe and must not include provider secrets or raw credentials.
  readonly reason: AIPermissionReason;
  readonly decidedAt?: string;
}

export type AIPermissionAllowedDecision = AIPermissionDecision & {
  readonly outcome: 'allow';
};

export type AIPermissionDeniedDecision = AIPermissionDecision & {
  readonly outcome: 'deny';
};
