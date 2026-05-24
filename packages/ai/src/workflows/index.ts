export type AIWorkflowRunId = string;

export type AIWorkflowId = string;

export type AIWorkflowRunStatus =
  | 'queued'
  | 'running'
  | 'succeeded'
  | 'failed'
  | 'retrying'
  | 'cancelled';

export interface AIWorkflowReference {
  readonly id: AIWorkflowId;
  readonly name: string;
  readonly description?: string;
}

export interface AIWorkflowRunReference {
  readonly id: AIWorkflowRunId;
  readonly workflowId: AIWorkflowId;
  readonly workflowName: string;
  readonly status: AIWorkflowRunStatus;
  readonly userId?: string;
  readonly threadId?: string;
  readonly messageId?: string;
  readonly startedAt?: string;
  readonly completedAt?: string;
  readonly failureReason?: string;
}
