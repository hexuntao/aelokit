'use server';

import { runKnowledgeReindexAuditWorkflow } from '@/ai/workflows';
import type { SessionUser } from '@/lib/auth-types';
import { userActionClient } from '@/lib/safe-action';
import { z } from 'zod';

export interface RunKnowledgeReindexAuditWorkflowActionResult {
  readonly success: boolean;
  readonly workflowRunId?: string;
  readonly status?: string;
  readonly evalStatus?: string;
  readonly score?: number;
  readonly error?: string;
}

const runKnowledgeReindexAuditWorkflowSchema = z.object({
  sourceId: z.string().min(1).optional(),
});

export const runKnowledgeReindexAuditWorkflowAction = userActionClient
  .inputSchema(runKnowledgeReindexAuditWorkflowSchema)
  .action(
    async ({
      parsedInput,
      ctx,
    }): Promise<RunKnowledgeReindexAuditWorkflowActionResult> => {
      const user = (ctx as { user: SessionUser }).user;

      try {
        const result = await runKnowledgeReindexAuditWorkflow({
          userId: user.id,
          sourceId: parsedInput.sourceId,
        });

        return {
          success: result.status === 'succeeded',
          workflowRunId: result.workflowRunId,
          status: result.status,
          evalStatus: result.evalStatus,
          score: result.score,
        };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : String(error),
        };
      }
    }
  );
