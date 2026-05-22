import type { AIModelId } from '../models';
import type { AIProviderId } from '../providers';

export type AIUsageRecordId = string;

export type AIUsageUserId = string;

export type AIUsageThreadId = string;

export type AIUsageMessageId = string;

export type AICostEventId = string;

export type AICreditReservationId = string;

export type AIUsageStatus = 'success' | 'error' | 'timeout' | 'rate_limited';

export type AIUsageBillingMode = 'audit_only' | 'credits';

export type AIUsageBillingStatus =
  | 'audit_only'
  | 'preflight_passed'
  | 'preflight_failed'
  | 'reserved'
  | 'reservation_failed'
  | 'settled'
  | 'settlement_failed'
  | 'refunded'
  | 'refund_failed'
  | 'no_charge'
  | 'cancelled'
  | 'timeout'
  | 'rate_limited';

export type AICreditReservationStatus =
  | 'preflight_passed'
  | 'preflight_failed'
  | 'reserved'
  | 'reservation_failed'
  | 'cancelled'
  | 'timeout'
  | 'rate_limited';

export type AICreditSettlementStatus =
  | 'pending'
  | 'settled'
  | 'settlement_failed'
  | 'no_charge'
  | 'cancelled'
  | 'timeout'
  | 'rate_limited';

export type AICreditRefundStatus =
  | 'not_required'
  | 'refunded'
  | 'refund_failed'
  | 'no_charge'
  | 'cancelled';

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

export type AICostEventStatus = 'estimated' | 'final' | 'failed' | 'no_charge';

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

export interface AICreditBillingReference {
  readonly mode: AIUsageBillingMode;
  readonly status: AIUsageBillingStatus;
  readonly usageId?: AIUsageRecordId;
  readonly costEventId?: AICostEventId;
  readonly reservationId?: AICreditReservationId;
  readonly creditTransactionId?: string;
}

export interface AICostEvent {
  readonly id: AICostEventId;
  readonly usageId: AIUsageRecordId;
  readonly subject: AIUsageSubjectReference;
  readonly model: AIUsageModelReference;
  readonly tokens: AIUsageTokenUsage;
  readonly estimatedCostUsd?: number;
  readonly estimatedCredits?: number;
  readonly currencyCode?: string;
  readonly source: AICostEstimateSource;
  readonly status: AICostEventStatus;
  readonly billing?: AICreditBillingReference;
  readonly metadata?: Readonly<Record<string, unknown>>;
  readonly createdAt: string;
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
  readonly billingMode: AIUsageBillingMode;
  readonly billingStatus: AIUsageBillingStatus;
  readonly billing?: AICreditBillingReference;
}
