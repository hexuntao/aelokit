'use server';

import {
  canAccessAdminUsageAudit,
  sanitizeAuditMetadata,
} from '@/ai/admin-audit-safety';
import { getDb } from '@/db';
import { isDemoWebsite } from '@/lib/demo';
import type { SessionUser } from '@/lib/auth-types';
import { adminActionClient } from '@/lib/safe-action';
import { aiWorkflowRun } from '@repo/db/schema';
import { and, desc, eq, inArray } from 'drizzle-orm';
import { z } from 'zod';

const getAIWorkflowRunsSchema = z.object({
  workflowRunIds: z.array(z.string().min(1)).optional(),
  threadId: z.string().optional(),
  messageId: z.string().optional(),
  limit: z.number().int().min(1).max(50).default(10),
});

export const getAIWorkflowRunsAction = adminActionClient
  .inputSchema(getAIWorkflowRunsSchema)
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
    if (parsedInput.workflowRunIds?.length) {
      filters.push(inArray(aiWorkflowRun.id, parsedInput.workflowRunIds));
    }
    if (parsedInput.threadId) {
      filters.push(eq(aiWorkflowRun.threadId, parsedInput.threadId));
    }
    if (parsedInput.messageId) {
      filters.push(eq(aiWorkflowRun.messageId, parsedInput.messageId));
    }

    const rows = await db
      .select()
      .from(aiWorkflowRun)
      .where(filters.length > 0 ? and(...filters) : undefined)
      .orderBy(desc(aiWorkflowRun.createdAt))
      .limit(parsedInput.limit);

    return {
      success: true,
      data: rows.map((row) => ({
        id: row.id,
        workflowId: row.workflowId,
        workflowName: row.workflowName,
        status: row.status,
        failureReason: row.failureReason,
        inputMetadata: sanitizeAuditMetadata(row.inputMetadata),
        outputMetadata: sanitizeAuditMetadata(row.outputMetadata),
        createdAt: row.createdAt,
      })),
    };
  });
