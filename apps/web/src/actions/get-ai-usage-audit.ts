'use server';

import {
  canAccessAdminUsageAudit,
  sanitizeAuditMetadata,
} from '@/ai/admin-audit-safety';
import { getDb } from '@/db';
import { aiCostEvent, aiCreditReservation, aiUsage } from '@repo/db/schema';
import { isDemoWebsite } from '@/lib/demo';
import { adminActionClient } from '@/lib/safe-action';
import type { SessionUser } from '@/lib/auth-types';
import {
  and,
  count as countFn,
  desc,
  eq,
  gte,
  ilike,
  lte,
  or,
} from 'drizzle-orm';
import { z } from 'zod';

const getAIUsageAuditSchema = z.object({
  pageIndex: z.number().min(0).default(0),
  pageSize: z.number().min(1).max(100).default(10),
  userId: z.string().optional().default(''),
  providerId: z.string().optional().default(''),
  modelId: z.string().optional().default(''),
  status: z.string().optional().default(''),
  dateFrom: z.string().optional().default(''),
  dateTo: z.string().optional().default(''),
});

export interface AIUsageAuditItem {
  readonly id: string;
  readonly userId: string;
  readonly threadId: string | null;
  readonly messageId: string | null;
  readonly providerId: string;
  readonly modelId: string;
  readonly inputTokens: number | null;
  readonly outputTokens: number | null;
  readonly totalTokens: number | null;
  readonly estimatedCostUsd: string | null;
  readonly estimatedCredits: number | null;
  readonly billingMode: string;
  readonly billingStatus: string;
  readonly reservationStatus: string | null;
  readonly settlementStatus: string | null;
  readonly refundStatus: string | null;
  readonly failureReason: string | null;
  readonly createdAt: Date;
  readonly metadata: unknown;
  readonly costEvent: {
    readonly id: string;
    readonly source: string;
    readonly status: string;
    readonly estimatedCostUsd: string | null;
    readonly estimatedCredits: number | null;
    readonly metadata: unknown;
    readonly createdAt: Date;
  } | null;
}

function parseDate(value: string): Date | null {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

export const getAIUsageAuditAction = adminActionClient
  .inputSchema(getAIUsageAuditSchema)
  .action(async ({ parsedInput, ctx }) => {
    const user = (ctx as { user: SessionUser }).user;
    if (!canAccessAdminUsageAudit(user, isDemoWebsite())) {
      return {
        success: false,
        error: 'Unauthorized',
      };
    }

    try {
      const {
        pageIndex,
        pageSize,
        userId,
        providerId,
        modelId,
        status,
        dateFrom,
        dateTo,
      } = parsedInput;
      const offset = pageIndex * pageSize;

      const conditions = [];
      if (userId) {
        conditions.push(ilike(aiUsage.userId, `%${userId}%`));
      }
      if (providerId) {
        conditions.push(eq(aiUsage.providerId, providerId));
      }
      if (modelId) {
        conditions.push(eq(aiUsage.modelId, modelId));
      }
      if (status) {
        conditions.push(
          or(
            eq(aiUsage.status, status),
            eq(aiUsage.billingStatus, status),
            eq(aiCreditReservation.reservationStatus, status),
            eq(aiCreditReservation.settlementStatus, status),
            eq(aiCreditReservation.refundStatus, status)
          )
        );
      }

      const from = parseDate(dateFrom);
      if (from) {
        conditions.push(gte(aiUsage.createdAt, from));
      }

      const to = parseDate(dateTo);
      if (to) {
        if (/^\d{4}-\d{2}-\d{2}$/.test(dateTo)) {
          to.setHours(23, 59, 59, 999);
        }
        conditions.push(lte(aiUsage.createdAt, to));
      }

      const where = conditions.length > 0 ? and(...conditions) : undefined;
      const db = await getDb();

      const baseQuery = db
        .select({
          id: aiUsage.id,
          userId: aiUsage.userId,
          threadId: aiUsage.threadId,
          messageId: aiUsage.messageId,
          providerId: aiUsage.providerId,
          modelId: aiUsage.modelId,
          inputTokens: aiUsage.inputTokens,
          outputTokens: aiUsage.outputTokens,
          totalTokens: aiUsage.totalTokens,
          estimatedCostUsd: aiUsage.estimatedCostUsd,
          billingMode: aiUsage.billingMode,
          billingStatus: aiUsage.billingStatus,
          failureReason: aiUsage.failureReason,
          providerMetadata: aiUsage.providerMetadata,
          billingReference: aiUsage.billingReference,
          createdAt: aiUsage.createdAt,
          costEventId: aiCostEvent.id,
          costEventSource: aiCostEvent.source,
          costEventStatus: aiCostEvent.status,
          costEventEstimatedCostUsd: aiCostEvent.estimatedCostUsd,
          costEventEstimatedCredits: aiCostEvent.estimatedCredits,
          costEventMetadata: aiCostEvent.metadata,
          costEventCreatedAt: aiCostEvent.createdAt,
          reservationStatus: aiCreditReservation.reservationStatus,
          settlementStatus: aiCreditReservation.settlementStatus,
          refundStatus: aiCreditReservation.refundStatus,
          reservationFailureReason: aiCreditReservation.failureReason,
        })
        .from(aiUsage)
        .leftJoin(aiCostEvent, eq(aiCostEvent.usageId, aiUsage.id))
        .leftJoin(
          aiCreditReservation,
          eq(aiCreditReservation.usageId, aiUsage.id)
        )
        .where(where)
        .orderBy(desc(aiUsage.createdAt))
        .limit(pageSize)
        .offset(offset);

      const countQuery = db
        .select({ count: countFn() })
        .from(aiUsage)
        .leftJoin(
          aiCreditReservation,
          eq(aiCreditReservation.usageId, aiUsage.id)
        )
        .where(where);

      const [rows, [{ count }]] = await Promise.all([baseQuery, countQuery]);

      const items: AIUsageAuditItem[] = rows.map((row) => ({
        id: row.id,
        userId: row.userId,
        threadId: row.threadId,
        messageId: row.messageId,
        providerId: row.providerId,
        modelId: row.modelId,
        inputTokens: row.inputTokens,
        outputTokens: row.outputTokens,
        totalTokens: row.totalTokens,
        estimatedCostUsd:
          row.estimatedCostUsd ?? row.costEventEstimatedCostUsd ?? null,
        estimatedCredits: row.costEventEstimatedCredits,
        billingMode: row.billingMode,
        billingStatus: row.billingStatus,
        reservationStatus: row.reservationStatus,
        settlementStatus: row.settlementStatus,
        refundStatus: row.refundStatus,
        failureReason: row.failureReason ?? row.reservationFailureReason,
        createdAt: row.createdAt,
        metadata: sanitizeAuditMetadata({
          providerMetadata: row.providerMetadata,
          billingReference: row.billingReference,
        }),
        costEvent: row.costEventId
          ? {
              id: row.costEventId,
              source: row.costEventSource ?? 'unknown',
              status: row.costEventStatus ?? 'estimated',
              estimatedCostUsd: row.costEventEstimatedCostUsd,
              estimatedCredits: row.costEventEstimatedCredits,
              metadata: sanitizeAuditMetadata(row.costEventMetadata),
              createdAt: row.costEventCreatedAt ?? row.createdAt,
            }
          : null,
      }));

      return {
        success: true,
        data: {
          items,
          total: Number(count),
        },
      };
    } catch (error) {
      console.error('get AI usage audit error:', error);
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : 'Failed to fetch AI usage audit',
      };
    }
  });
