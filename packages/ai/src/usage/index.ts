import type { AIModelId } from '../models';
import type { AIProviderId } from '../providers';

export type AIUsageRecordId = string;

export type AIUsageUserId = string;

export type AIUsageThreadId = string;

export type AIUsageMessageId = string;

export type AIUsageStatus = 'success' | 'error' | 'timeout' | 'rate_limited';

export type AIUsageStatusMapping = {
  readonly contractToDb: {
    readonly success: 'success';
    readonly error: 'error';
    readonly timeout: 'timeout';
    readonly rate_limited: 'rate_limited';
  };
  readonly dbToContract: {
    readonly success: 'success';
    readonly error: 'error';
    readonly timeout: 'timeout';
    readonly rate_limited: 'rate_limited';
  };
};

export const AI_USAGE_STATUS_MAPPING: AIUsageStatusMapping = {
  contractToDb: {
    success: 'success',
    error: 'error',
    timeout: 'timeout',
    rate_limited: 'rate_limited',
  },
  dbToContract: {
    success: 'success',
    error: 'error',
    timeout: 'timeout',
    rate_limited: 'rate_limited',
  },
};

export type AIUsageFailureReason =
  | 'provider-error'
  | 'model-error'
  | 'permission-denied'
  | 'timeout'
  | 'cancelled'
  | 'unknown';

export type AICostEstimateSource =
  | 'model-metadata'
  | 'provider-reported'
  | 'manual-estimate'
  | 'unknown';

export interface AIUsageSubjectReference {
  readonly userId: AIUsageUserId;
  readonly threadId?: AIUsageThreadId;
  readonly messageId?: AIUsageMessageId;
}

export interface AIUsageModelReference {
  readonly providerId: AIProviderId;
  readonly modelId: AIModelId;
  readonly providerModelId?: string;
}

export interface AIUsageTokenUsage {
  readonly inputTokens: number;
  readonly outputTokens: number;
  readonly cachedInputTokens?: number;
  readonly reasoningTokens?: number;
  readonly totalTokens?: number;
}

export interface AICostEstimate {
  readonly amount: number;
  readonly currencyCode: string;
  readonly source: AICostEstimateSource;
  readonly estimatedAt?: string;
  // This is an audit estimate only; final billing and credits settlement live outside packages/ai.
  readonly isFinalBillingAmount: false;
}

export interface AIUsageFailure {
  readonly reason: AIUsageFailureReason;
  readonly message?: string;
  readonly errorCode?: string;
}

export interface AIUsageTiming {
  readonly requestedAt: string;
  readonly startedAt?: string;
  readonly completedAt?: string;
}

export interface AIUsageRecord {
  readonly id: AIUsageRecordId;
  readonly subject: AIUsageSubjectReference;
  readonly model: AIUsageModelReference;
  readonly tokens: AIUsageTokenUsage;
  readonly estimatedCost?: AICostEstimate;
  readonly status: AIUsageStatus;
  readonly failure?: AIUsageFailure;
  readonly timing: AIUsageTiming;
  // v0.1 records audit facts only; charge/reservation/settlement are v0.5 credits concerns.
  readonly billingMode: 'audit-only';
}
