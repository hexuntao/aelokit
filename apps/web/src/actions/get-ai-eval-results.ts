'use server';

import {
  canAccessAdminUsageAudit,
  sanitizeAuditMetadata,
} from '@/ai/admin-audit-safety';
import { getDb } from '@/db';
import { isDemoWebsite } from '@/lib/demo';
import type { SessionUser } from '@/lib/auth-types';
import { adminActionClient } from '@/lib/safe-action';
import { aiEvalResult } from '@repo/db/schema';
import { and, desc, eq, inArray } from 'drizzle-orm';
import { z } from 'zod';

const getAIEvalResultsSchema = z.object({
  workflowRunIds: z.array(z.string().min(1)).optional(),
  scorerId: z.string().optional(),
  limit: z.number().int().min(1).max(50).default(10),
});

export const getAIEvalResultsAction = adminActionClient
  .inputSchema(getAIEvalResultsSchema)
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
      filters.push(
        inArray(aiEvalResult.workflowRunId, parsedInput.workflowRunIds)
      );
    }
    if (parsedInput.scorerId) {
      filters.push(eq(aiEvalResult.scorerId, parsedInput.scorerId));
    }

    const rows = await db
      .select()
      .from(aiEvalResult)
      .where(filters.length > 0 ? and(...filters) : undefined)
      .orderBy(desc(aiEvalResult.createdAt))
      .limit(parsedInput.limit);

    return {
      success: true,
      data: rows.map((row) => ({
        id: row.id,
        workflowRunId: row.workflowRunId,
        scorerId: row.scorerId,
        status: row.status,
        score: row.score,
        metadata: sanitizeAuditMetadata(row.metadata),
        createdAt: row.createdAt,
      })),
    };
  });
