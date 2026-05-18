import 'server-only';

import type { AIUsageRecord, AIUsageTokenUsage } from '@repo/ai/usage';
import type { AIModelReference } from '@repo/ai/models';
import type { AIRuntimeContext } from '../context';

export interface UsageAuditEntry {
  readonly userId: string;
  readonly threadId?: string;
  readonly messageId?: string;
  readonly providerId: string;
  readonly modelId: string;
  readonly providerModelId?: string;
  readonly tokens?: AIUsageTokenUsage;
  readonly estimatedCostUsd?: number;
  readonly status: 'success' | 'error' | 'timeout' | 'rate_limited';
  readonly failureReason?: string;
  readonly errorCode?: string;
  readonly errorMessage?: string;
  readonly requestDurationMs?: number;
  readonly requestedAt: Date;
  readonly startedAt?: Date;
  readonly completedAt?: Date;
}

export interface UsageAuditResult {
  readonly recorded: boolean;
  readonly entryId?: string;
  readonly error?: Error;
}

export function createUsageAuditEntry(
  context: AIRuntimeContext,
  model: AIModelReference,
  options?: {
    readonly tokens?: AIUsageTokenUsage;
    readonly estimatedCostUsd?: number;
    readonly status: UsageAuditEntry['status'];
    readonly failureReason?: string;
    readonly errorCode?: string;
    readonly errorMessage?: string;
    readonly requestDurationMs?: number;
    readonly startedAt?: Date;
    readonly completedAt?: Date;
  }
): UsageAuditEntry {
  return {
    userId: context.userId,
    threadId: context.threadId,
    messageId: context.messageId,
    providerId: model.providerId,
    modelId: model.modelId,
    tokens: options?.tokens,
    estimatedCostUsd: options?.estimatedCostUsd,
    status: options?.status ?? 'success',
    failureReason: options?.failureReason,
    errorCode: options?.errorCode,
    errorMessage: options?.errorMessage,
    requestDurationMs: options?.requestDurationMs,
    requestedAt: context.requestedAt,
    startedAt: options?.startedAt,
    completedAt: options?.completedAt,
  };
}

export async function recordUsageAudit(
  entry: UsageAuditEntry
): Promise<UsageAuditResult> {
  try {
    console.log('[AI Usage Audit]', {
      userId: entry.userId,
      threadId: entry.threadId,
      messageId: entry.messageId,
      providerId: entry.providerId,
      modelId: entry.modelId,
      status: entry.status,
      tokens: entry.tokens,
      requestedAt: entry.requestedAt.toISOString(),
    });

    return {
      recorded: true,
      entryId: `audit-${Date.now()}`,
    };
  } catch (error) {
    return {
      recorded: false,
      error: error instanceof Error ? error : new Error(String(error)),
    };
  }
}

export function estimateCost(
  tokens: AIUsageTokenUsage,
  costPerMillionInput: number,
  costPerMillionOutput: number
): number {
  const inputCost = (tokens.inputTokens / 1_000_000) * costPerMillionInput;
  const outputCost = (tokens.outputTokens / 1_000_000) * costPerMillionOutput;
  return inputCost + outputCost;
}
