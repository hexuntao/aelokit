import 'server-only';

import { getUserCredits } from '@repo/credits';
import { getDb } from '@repo/db';
import { aiUsage, creditTransaction } from '@repo/db/schema';
import { serverEnv } from '@repo/env/server';
import { CREDITS_EXPIRATION_DAYS } from '@/lib/constants';
import { addDays } from 'date-fns';
import {
  and,
  count,
  desc,
  eq,
  gt,
  gte,
  isNotNull,
  lte,
  sql,
  sum,
} from 'drizzle-orm';
import type { AIWorkspaceStatus } from './workspace-status-types';

const USAGE_WINDOW_DAYS = 30;

function toNumber(value: unknown): number {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : 0;
  }

  if (typeof value === 'string') {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  return 0;
}

export async function getAIWorkspaceStatus(
  userId: string
): Promise<AIWorkspaceStatus> {
  const db = await getDb();
  const now = new Date();
  const usageWindowStart = addDays(now, -USAGE_WINDOW_DAYS);
  const expiringBefore = addDays(now, CREDITS_EXPIRATION_DAYS);

  const [creditsBalance, expiringCreditsRows, usageRows, latestUsageRows] =
    await Promise.all([
      getUserCredits(userId),
      db
        .select({
          totalAmount: sum(creditTransaction.remainingAmount),
        })
        .from(creditTransaction)
        .where(
          and(
            eq(creditTransaction.userId, userId),
            isNotNull(creditTransaction.expirationDate),
            isNotNull(creditTransaction.remainingAmount),
            gt(creditTransaction.remainingAmount, 0),
            gte(creditTransaction.expirationDate, now),
            lte(creditTransaction.expirationDate, expiringBefore)
          )
        ),
      db
        .select({
          totalRequests: count(),
          successfulRequests: sql<number>`count(*) filter (where ${aiUsage.status} = 'success')`,
          failedRequests: sql<number>`count(*) filter (where ${aiUsage.status} <> 'success')`,
          totalTokens: sum(aiUsage.totalTokens),
          estimatedCostUsd: sum(aiUsage.estimatedCostUsd),
          lastUsageAt: sql<Date | null>`max(${aiUsage.createdAt})`,
        })
        .from(aiUsage)
        .where(
          and(
            eq(aiUsage.userId, userId),
            gte(aiUsage.createdAt, usageWindowStart)
          )
        ),
      db
        .select({
          id: aiUsage.id,
          providerId: aiUsage.providerId,
          modelId: aiUsage.modelId,
          status: aiUsage.status,
          billingStatus: aiUsage.billingStatus,
          totalTokens: aiUsage.totalTokens,
          createdAt: aiUsage.createdAt,
        })
        .from(aiUsage)
        .where(eq(aiUsage.userId, userId))
        .orderBy(desc(aiUsage.createdAt))
        .limit(5),
    ]);

  const usage = usageRows[0];
  const expiringSoon = toNumber(expiringCreditsRows[0]?.totalAmount);

  return {
    credits: {
      balance: creditsBalance,
      expiringSoon,
      expirationWindowDays: CREDITS_EXPIRATION_DAYS,
      billingMode: serverEnv.AI_CREDITS_BILLING_ENABLED
        ? 'credits'
        : 'audit_only',
    },
    usage: {
      windowDays: USAGE_WINDOW_DAYS,
      totalRequests: toNumber(usage?.totalRequests),
      successfulRequests: toNumber(usage?.successfulRequests),
      failedRequests: toNumber(usage?.failedRequests),
      totalTokens: toNumber(usage?.totalTokens),
      estimatedCostUsd: usage?.estimatedCostUsd ?? null,
      lastUsageAt: usage?.lastUsageAt?.toISOString(),
    },
    latestUsage: latestUsageRows.map((row) => ({
      id: row.id,
      providerId: row.providerId,
      modelId: row.modelId,
      status: row.status,
      billingStatus: row.billingStatus,
      totalTokens: row.totalTokens,
      createdAt: row.createdAt.toISOString(),
    })),
  };
}
