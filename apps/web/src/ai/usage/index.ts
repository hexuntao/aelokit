import 'server-only';

import type {
  AICostEventStatus,
  AIUsageBillingMode,
  AIUsageBillingStatus,
  AIUsageTokenUsage,
} from '@repo/ai/usage';
import type { AIModelReference } from '@repo/ai/models';
import type { AIRuntimeContext } from '../context';
import { getDb } from '@/db';
import { aiCostEvent, aiUsage } from '@repo/db/schema';
import { nanoid } from 'nanoid';

const TOKENS_PER_CREDIT = 1_000;

export interface UsageAuditEntry {
  readonly id?: string;
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
  readonly rawUsage?: unknown;
  readonly providerMetadata?: unknown;
  readonly costCurrencyCode?: string;
  readonly costEstimateSource?:
    | 'model-metadata'
    | 'provider-reported'
    | 'manual-estimate'
    | 'unknown';
  readonly billingMode?: AIUsageBillingMode;
  readonly billingStatus?: AIUsageBillingStatus;
  readonly billingReference?: Readonly<Record<string, unknown>>;
}

export interface UsageAuditResult {
  readonly recorded: boolean;
  readonly entryId?: string;
  readonly error?: Error;
}

export interface CostEventAuditEntry {
  readonly usageId: string;
  readonly userId: string;
  readonly providerId: string;
  readonly modelId: string;
  readonly tokens?: AIUsageTokenUsage;
  readonly estimatedCostUsd?: number;
  readonly estimatedCredits?: number;
  readonly currencyCode?: string;
  readonly source:
    | 'model-metadata'
    | 'provider-reported'
    | 'manual-estimate'
    | 'unknown';
  readonly status: AICostEventStatus;
  readonly metadata?: Readonly<Record<string, unknown>>;
}

export interface CostEventAuditResult {
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
    readonly rawUsage?: unknown;
    readonly providerMetadata?: unknown;
    readonly providerModelId?: string;
    readonly costCurrencyCode?: string;
    readonly costEstimateSource?: UsageAuditEntry['costEstimateSource'];
    readonly billingMode?: AIUsageBillingMode;
    readonly billingStatus?: AIUsageBillingStatus;
    readonly billingReference?: Readonly<Record<string, unknown>>;
  }
): UsageAuditEntry {
  return {
    userId: context.userId,
    threadId: context.threadId,
    messageId: context.messageId,
    providerId: model.providerId,
    modelId: model.modelId,
    providerModelId: options?.providerModelId,
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
    rawUsage: options?.rawUsage,
    providerMetadata: options?.providerMetadata,
    costCurrencyCode: options?.costCurrencyCode,
    costEstimateSource: options?.costEstimateSource,
    billingMode: options?.billingMode ?? 'audit_only',
    billingStatus: options?.billingStatus ?? 'audit_only',
    billingReference: options?.billingReference,
  };
}

export async function recordUsageAudit(
  entry: UsageAuditEntry
): Promise<UsageAuditResult> {
  try {
    const db = await getDb();
    const id = entry.id ?? nanoid();

    await db.insert(aiUsage).values({
      id,
      userId: entry.userId,
      threadId: entry.threadId ?? null,
      messageId: entry.messageId ?? null,
      providerId: entry.providerId,
      modelId: entry.modelId,
      providerModelId: entry.providerModelId ?? null,
      inputTokens: entry.tokens?.inputTokens ?? null,
      outputTokens: entry.tokens?.outputTokens ?? null,
      totalTokens: entry.tokens?.totalTokens ?? null,
      cachedInputTokens: entry.tokens?.cachedInputTokens ?? null,
      reasoningTokens: entry.tokens?.reasoningTokens ?? null,
      estimatedCostUsd:
        entry.estimatedCostUsd !== undefined
          ? String(entry.estimatedCostUsd)
          : null,
      costCurrencyCode: entry.costCurrencyCode ?? null,
      costEstimateSource: entry.costEstimateSource ?? null,
      status: entry.status,
      failureReason: entry.failureReason ?? null,
      errorCode: entry.errorCode ?? null,
      errorMessage: entry.errorMessage ?? null,
      requestDurationMs: entry.requestDurationMs ?? null,
      rawUsage: entry.rawUsage ?? null,
      providerMetadata: entry.providerMetadata ?? null,
      billingMode: entry.billingMode ?? 'audit_only',
      billingStatus: entry.billingStatus ?? 'audit_only',
      billingReference: entry.billingReference ?? {},
      requestedAt: entry.requestedAt,
      startedAt: entry.startedAt ?? null,
      completedAt: entry.completedAt ?? null,
      createdAt: new Date(),
    });

    return {
      recorded: true,
      entryId: id,
    };
  } catch (error) {
    console.error('[AI Usage Audit Error] Failed to record usage', { error });
    return {
      recorded: false,
      error: error instanceof Error ? error : new Error(String(error)),
    };
  }
}

export async function recordCostEventAudit(
  entry: CostEventAuditEntry
): Promise<CostEventAuditResult> {
  try {
    const db = await getDb();
    const id = nanoid();

    await db.insert(aiCostEvent).values({
      id,
      usageId: entry.usageId,
      userId: entry.userId,
      providerId: entry.providerId,
      modelId: entry.modelId,
      inputTokens: entry.tokens?.inputTokens ?? null,
      outputTokens: entry.tokens?.outputTokens ?? null,
      totalTokens: entry.tokens?.totalTokens ?? null,
      estimatedCostUsd:
        entry.estimatedCostUsd !== undefined
          ? String(entry.estimatedCostUsd)
          : null,
      estimatedCredits: entry.estimatedCredits ?? null,
      currencyCode: entry.currencyCode ?? null,
      source: entry.source,
      status: entry.status,
      metadata: entry.metadata ?? {},
      createdAt: new Date(),
    });

    return {
      recorded: true,
      entryId: id,
    };
  } catch (error) {
    console.error('[AI Cost Event Error] Failed to record cost event', {
      error,
    });
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

export function estimateCreditsFromTokenUsage(
  tokens: AIUsageTokenUsage
): number {
  const totalTokens =
    tokens.totalTokens ?? tokens.inputTokens + tokens.outputTokens;
  return Math.max(1, Math.ceil(totalTokens / TOKENS_PER_CREDIT));
}
