'use server';

import {
  canAccessAdminUsageAudit,
  sanitizeAuditMetadata,
} from '@/ai/admin-audit-safety';
import { getDb } from '@/db';
import {
  aiCostEvent,
  aiCreditReservation,
  aiMessage,
  aiThread,
  aiToolCall,
  aiUsage,
  aiWorkflowRun,
} from '@repo/db/schema';
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
  inArray,
  lte,
  or,
  sql,
} from 'drizzle-orm';
import { z } from 'zod';

const getAIUsageAuditSchema = z.object({
  pageIndex: z.number().min(0).default(0),
  pageSize: z.number().min(1).max(100).default(10),
  userId: z.string().optional().default(''),
  providerId: z.string().optional().default(''),
  modelId: z.string().optional().default(''),
  agentId: z.string().optional().default(''),
  toolName: z.string().optional().default(''),
  workflowStatus: z.string().optional().default(''),
  knowledge: z.string().optional().default(''),
  minTokens: z.string().optional().default(''),
  maxTokens: z.string().optional().default(''),
  minCost: z.string().optional().default(''),
  maxCost: z.string().optional().default(''),
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
  readonly agentId: string | null;
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
  readonly toolCallCount: number;
  readonly toolNames: readonly string[];
  readonly knowledgeEnabled: boolean;
  readonly knowledgeChunkCount: number;
  readonly citationCount: number;
  readonly workflowRuns: readonly {
    readonly id: string;
    readonly workflowId: string;
    readonly status: string;
    readonly createdAt: Date;
  }[];
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

function parseNonNegativeNumber(value: string): number | null {
  if (!value) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : null;
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function getNumberMetadata(
  metadata: Record<string, unknown>,
  key: string
): number {
  const value = metadata[key];
  return typeof value === 'number' ? value : 0;
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
        agentId,
        toolName,
        workflowStatus,
        knowledge,
        minTokens,
        maxTokens,
        minCost,
        maxCost,
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
      if (agentId) {
        conditions.push(ilike(aiThread.agentId, `%${agentId}%`));
      }
      if (toolName) {
        conditions.push(sql`exists (
          select 1 from ${aiToolCall}
          where ${aiToolCall.messageId} = ${aiUsage.messageId}
          and ${aiToolCall.toolName} ilike ${`%${toolName}%`}
        )`);
      }
      if (workflowStatus) {
        conditions.push(sql`exists (
          select 1 from ${aiWorkflowRun}
          where (
            ${aiWorkflowRun.messageId} = ${aiUsage.messageId}
            or ${aiWorkflowRun.threadId} = ${aiUsage.threadId}
          )
          and ${aiWorkflowRun.status} = ${workflowStatus}
        )`);
      }
      if (knowledge === 'enabled') {
        conditions.push(
          sql`${aiMessage.metadata}->>'knowledgeEnabled' = 'true'`
        );
      }
      if (knowledge === 'citations') {
        conditions.push(
          sql`jsonb_array_length(coalesce(${aiMessage.metadata}->'citations', '[]'::jsonb)) > 0`
        );
      }
      const minTokensValue = parseNonNegativeNumber(minTokens);
      if (minTokensValue !== null) {
        conditions.push(gte(aiUsage.totalTokens, minTokensValue));
      }
      const maxTokensValue = parseNonNegativeNumber(maxTokens);
      if (maxTokensValue !== null) {
        conditions.push(lte(aiUsage.totalTokens, maxTokensValue));
      }
      const minCostValue = parseNonNegativeNumber(minCost);
      if (minCostValue !== null) {
        conditions.push(
          sql`coalesce(${aiUsage.estimatedCostUsd}, ${aiCostEvent.estimatedCostUsd}) >= ${String(minCostValue)}`
        );
      }
      const maxCostValue = parseNonNegativeNumber(maxCost);
      if (maxCostValue !== null) {
        conditions.push(
          sql`coalesce(${aiUsage.estimatedCostUsd}, ${aiCostEvent.estimatedCostUsd}) <= ${String(maxCostValue)}`
        );
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
          agentId: aiThread.agentId,
          inputTokens: aiUsage.inputTokens,
          outputTokens: aiUsage.outputTokens,
          totalTokens: aiUsage.totalTokens,
          estimatedCostUsd: aiUsage.estimatedCostUsd,
          billingMode: aiUsage.billingMode,
          billingStatus: aiUsage.billingStatus,
          failureReason: aiUsage.failureReason,
          providerMetadata: aiUsage.providerMetadata,
          messageMetadata: aiMessage.metadata,
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
        .leftJoin(aiThread, eq(aiThread.id, aiUsage.threadId))
        .leftJoin(aiMessage, eq(aiMessage.id, aiUsage.messageId))
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
        .leftJoin(aiThread, eq(aiThread.id, aiUsage.threadId))
        .leftJoin(aiMessage, eq(aiMessage.id, aiUsage.messageId))
        .leftJoin(
          aiCreditReservation,
          eq(aiCreditReservation.usageId, aiUsage.id)
        )
        .where(where);

      const [rows, [{ count }]] = await Promise.all([baseQuery, countQuery]);
      const messageIds = rows
        .map((row) => row.messageId)
        .filter((messageId): messageId is string => Boolean(messageId));
      const threadIds = rows
        .map((row) => row.threadId)
        .filter((threadId): threadId is string => Boolean(threadId));
      const [toolRows, workflowRows] = await Promise.all([
        messageIds.length > 0
          ? db
              .select({
                messageId: aiToolCall.messageId,
                toolName: aiToolCall.toolName,
                status: aiToolCall.status,
              })
              .from(aiToolCall)
              .where(inArray(aiToolCall.messageId, messageIds))
          : [],
        messageIds.length > 0 || threadIds.length > 0
          ? db
              .select({
                id: aiWorkflowRun.id,
                workflowId: aiWorkflowRun.workflowId,
                status: aiWorkflowRun.status,
                messageId: aiWorkflowRun.messageId,
                threadId: aiWorkflowRun.threadId,
                createdAt: aiWorkflowRun.createdAt,
              })
              .from(aiWorkflowRun)
              .where(
                or(
                  messageIds.length > 0
                    ? inArray(aiWorkflowRun.messageId, messageIds)
                    : undefined,
                  threadIds.length > 0
                    ? inArray(aiWorkflowRun.threadId, threadIds)
                    : undefined
                )
              )
          : [],
      ]);
      const toolsByMessageId = new Map<string, typeof toolRows>();
      const workflowsByMessageOrThreadId = new Map<
        string,
        typeof workflowRows
      >();

      for (const tool of toolRows) {
        const existing = toolsByMessageId.get(tool.messageId) ?? [];
        existing.push(tool);
        toolsByMessageId.set(tool.messageId, existing);
      }

      for (const workflow of workflowRows) {
        if (workflow.messageId) {
          const existing =
            workflowsByMessageOrThreadId.get(workflow.messageId) ?? [];
          existing.push(workflow);
          workflowsByMessageOrThreadId.set(workflow.messageId, existing);
        }
        if (workflow.threadId) {
          const existing =
            workflowsByMessageOrThreadId.get(workflow.threadId) ?? [];
          existing.push(workflow);
          workflowsByMessageOrThreadId.set(workflow.threadId, existing);
        }
      }

      const items: AIUsageAuditItem[] = rows.map((row) => {
        const messageMetadata = asRecord(row.messageMetadata);
        const toolRowsForMessage = row.messageId
          ? (toolsByMessageId.get(row.messageId) ?? [])
          : [];
        const workflowRowsForUsage = [
          ...(row.messageId
            ? (workflowsByMessageOrThreadId.get(row.messageId) ?? [])
            : []),
          ...(row.threadId
            ? (workflowsByMessageOrThreadId.get(row.threadId) ?? [])
            : []),
        ];
        const workflowRuns = Array.from(
          new Map(
            workflowRowsForUsage.map((workflow) => [workflow.id, workflow])
          ).values()
        );
        const citations = Array.isArray(messageMetadata.citations)
          ? messageMetadata.citations
          : [];

        return {
          id: row.id,
          userId: row.userId,
          threadId: row.threadId,
          messageId: row.messageId,
          providerId: row.providerId,
          modelId: row.modelId,
          agentId: row.agentId,
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
          toolCallCount: toolRowsForMessage.length,
          toolNames: Array.from(
            new Set(toolRowsForMessage.map((tool) => tool.toolName))
          ),
          knowledgeEnabled:
            messageMetadata.knowledgeEnabled === true || citations.length > 0,
          knowledgeChunkCount: getNumberMetadata(
            messageMetadata,
            'knowledgeChunkCount'
          ),
          citationCount: citations.length,
          workflowRuns: workflowRuns.map((workflow) => ({
            id: workflow.id,
            workflowId: workflow.workflowId,
            status: workflow.status,
            createdAt: workflow.createdAt,
          })),
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
        };
      });

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
