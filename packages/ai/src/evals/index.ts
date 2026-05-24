export type AIEvalResultId = string;

export type AIEvalStatus = 'passed' | 'failed' | 'skipped' | 'error';

export interface AIEvalResultReference {
  readonly id: AIEvalResultId;
  readonly scorerId: string;
  readonly status: AIEvalStatus;
  readonly workflowRunId?: string;
  readonly score?: number;
  readonly createdAt: string;
}
