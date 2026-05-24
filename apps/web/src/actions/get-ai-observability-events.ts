'use server';

import {
  canAccessAdminUsageAudit,
  sanitizeAuditMetadata,
} from '@/ai/admin-audit-safety';
import { getDb } from '@/db';
import { isDemoWebsite } from '@/lib/demo';
import type { SessionUser } from '@/lib/auth-types';
import { adminActionClient } from '@/lib/safe-action';
import { aiObservabilityEvent } from '@repo/db/schema';
import { and, desc, eq, inArray, or } from 'drizzle-orm';
import { z } from 'zod';

const getAIObservabilityEventsSchema = z.object({
  workflowRunIds: z.array(z.string().min(1)).optional(),
  usageIds: z.array(z.string().min(1)).optional(),
  threadId: z.string().optional(),
  messageId: z.string().optional(),
  severity: z.string().optional(),
  limit: z.number().int().min(1).max(50).default(20),
});

export const getAIObservabilityEventsAction = adminActionClient
  .inputSchema(getAIObservabilityEventsSchema)
  .action(async ({ parsedInput, ctx }) => {
    const user = (ctx as { user: SessionUser }).user;
    if (!canAccessAdminUsageAudit(user, isDemoWebsite())) {
      return {
        success: false,
        error: 'Unauthorized',
      };
    }

    const db = await getDb();
    const filters = [];
    if (parsedInput.severity) {
      filters.push(eq(aiObservabilityEvent.severity, parsedInput.severity));
    }
    if (parsedInput.threadId) {
      filters.push(eq(aiObservabilityEvent.threadId, parsedInput.threadId));
    }
    if (parsedInput.messageId) {
      filters.push(eq(aiObservabilityEvent.messageId, parsedInput.messageId));
    }
    if (parsedInput.workflowRunIds?.length || parsedInput.usageIds?.length) {
      filters.push(
        or(
          parsedInput.workflowRunIds?.length
            ? inArray(
                aiObservabilityEvent.workflowRunId,
                parsedInput.workflowRunIds
              )
            : undefined,
          parsedInput.usageIds?.length
            ? inArray(aiObservabilityEvent.usageId, parsedInput.usageIds)
            : undefined
        )
      );
    }

    const rows = await db
      .select()
      .from(aiObservabilityEvent)
      .where(filters.length > 0 ? and(...filters) : undefined)
      .orderBy(desc(aiObservabilityEvent.createdAt))
      .limit(parsedInput.limit);

    return {
      success: true,
      data: rows.map((row) => ({
        id: row.id,
        workflowRunId: row.workflowRunId,
        usageId: row.usageId,
        threadId: row.threadId,
        messageId: row.messageId,
        eventType: row.eventType,
        severity: row.severity,
        metadata: sanitizeAuditMetadata(row.metadata),
        createdAt: row.createdAt,
      })),
    };
  });
