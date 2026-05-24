import 'server-only';

import type { AIWorkflowRunStatus } from '@repo/ai/workflows';
import { getDb } from '@repo/db';
import { aiWorkflowRun } from '@repo/db/schema';
import { eq } from 'drizzle-orm';
import { nanoid } from 'nanoid';
import { inspectKnowledgeMetadata } from '../tools/knowledge-inspection';
import { recordAIEvalResult, scoreKnowledgeIndexHealth } from '../evals';
import { recordAIObservabilityEvent } from '../observability';

export const KNOWLEDGE_REINDEX_AUDIT_WORKFLOW_ID = 'knowledge.reindex-audit.v1';
export const KNOWLEDGE_REINDEX_AUDIT_WORKFLOW_NAME = 'Knowledge re-index audit';

export interface RunKnowledgeReindexAuditWorkflowInput {
  readonly userId: string;
  readonly sourceId?: string;
  readonly threadId?: string;
  readonly messageId?: string;
}

export interface KnowledgeReindexAuditWorkflowResult {
  readonly workflowRunId: string;
  readonly status: AIWorkflowRunStatus;
  readonly evalStatus?: string;
  readonly score?: number;
}

async function updateWorkflowRun(
  workflowRunId: string,
  updates: {
    readonly status: AIWorkflowRunStatus;
    readonly outputMetadata?: Readonly<Record<string, unknown>>;
    readonly failureReason?: string;
    readonly completedAt?: Date;
  }
) {
  const db = await getDb();
  await db
    .update(aiWorkflowRun)
    .set({
      status: updates.status,
      outputMetadata: updates.outputMetadata ?? {},
      failureReason: updates.failureReason ?? null,
      completedAt: updates.completedAt ?? null,
      updatedAt: new Date(),
    })
    .where(eq(aiWorkflowRun.id, workflowRunId));
}

export async function runKnowledgeReindexAuditWorkflow(
  input: RunKnowledgeReindexAuditWorkflowInput
): Promise<KnowledgeReindexAuditWorkflowResult> {
  const db = await getDb();
  const workflowRunId = `wf-${nanoid()}`;
  const startedAt = new Date();

  await db.insert(aiWorkflowRun).values({
    id: workflowRunId,
    workflowId: KNOWLEDGE_REINDEX_AUDIT_WORKFLOW_ID,
    workflowName: KNOWLEDGE_REINDEX_AUDIT_WORKFLOW_NAME,
    userId: input.userId,
    threadId: input.threadId ?? null,
    messageId: input.messageId ?? null,
    status: 'running',
    inputMetadata: {
      sourceId: input.sourceId,
      rawContentIncluded: false,
    },
    outputMetadata: {},
    retryCount: 0,
    startedAt,
    createdAt: startedAt,
    updatedAt: startedAt,
  });

  await recordAIObservabilityEvent({
    eventType: 'workflow.started',
    severity: 'info',
    userId: input.userId,
    workflowRunId,
    threadId: input.threadId,
    messageId: input.messageId,
    metadata: {
      workflowId: KNOWLEDGE_REINDEX_AUDIT_WORKFLOW_ID,
      sourceId: input.sourceId,
    },
  });

  try {
    const inspection = await inspectKnowledgeMetadata({
      userId: input.userId,
      input: {
        sourceId: input.sourceId,
        includeChunks: true,
        limit: input.sourceId ? 1 : 25,
      },
    });
    const evalResult = scoreKnowledgeIndexHealth({
      sources: inspection.sources,
    });
    const recordedEval = await recordAIEvalResult({
      workflowRunId,
      scorerId: evalResult.scorerId,
      status: evalResult.status,
      score: evalResult.score,
      metadata: evalResult.metadata,
    });
    const outputMetadata = {
      matched: inspection.matched,
      sourceCount: inspection.sources.length,
      evalId: recordedEval.id,
      evalStatus: evalResult.status,
      score: evalResult.score,
      rawContentIncluded: false,
    };

    await updateWorkflowRun(workflowRunId, {
      status: 'succeeded',
      outputMetadata,
      completedAt: new Date(),
    });
    await recordAIObservabilityEvent({
      eventType: 'workflow.completed',
      severity: evalResult.status === 'passed' ? 'info' : 'warn',
      userId: input.userId,
      workflowRunId,
      threadId: input.threadId,
      messageId: input.messageId,
      metadata: outputMetadata,
    });

    return {
      workflowRunId,
      status: 'succeeded',
      evalStatus: evalResult.status,
      score: evalResult.score,
    };
  } catch (error) {
    const failureReason =
      error instanceof Error ? error.message : String(error ?? 'unknown');

    await updateWorkflowRun(workflowRunId, {
      status: 'failed',
      failureReason,
      outputMetadata: {
        rawContentIncluded: false,
      },
      completedAt: new Date(),
    });
    await recordAIObservabilityEvent({
      eventType: 'workflow.failed',
      severity: 'error',
      userId: input.userId,
      workflowRunId,
      threadId: input.threadId,
      messageId: input.messageId,
      metadata: {
        failureReason,
        rawContentIncluded: false,
      },
    });

    return {
      workflowRunId,
      status: 'failed',
    };
  }
}
