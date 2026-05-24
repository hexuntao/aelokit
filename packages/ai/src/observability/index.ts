export type AIObservabilityEventId = string;

export type AIObservabilitySeverity = 'debug' | 'info' | 'warn' | 'error';

export interface AIObservabilityEventReference {
  readonly id: AIObservabilityEventId;
  readonly eventType: string;
  readonly severity: AIObservabilitySeverity;
  readonly userId?: string;
  readonly workflowRunId?: string;
  readonly usageId?: string;
  readonly threadId?: string;
  readonly messageId?: string;
  readonly createdAt: string;
}
