import 'server-only';

import type { AIObservabilitySeverity } from '@repo/ai/observability';
import { getDb } from '@repo/db';
import { aiObservabilityEvent } from '@repo/db/schema';
import { nanoid } from 'nanoid';

export interface RecordAIObservabilityEventInput {
  readonly eventType: string;
  readonly severity?: AIObservabilitySeverity;
  readonly userId?: string;
  readonly workflowRunId?: string;
  readonly usageId?: string;
  readonly threadId?: string;
  readonly messageId?: string;
  readonly metadata?: Readonly<Record<string, unknown>>;
}

export async function recordAIObservabilityEvent(
  input: RecordAIObservabilityEventInput
): Promise<{ readonly id: string }> {
  const db = await getDb();
  const id = `obs-${nanoid()}`;

  await db.insert(aiObservabilityEvent).values({
    id,
    eventType: input.eventType,
    severity: input.severity ?? 'info',
    userId: input.userId ?? null,
    workflowRunId: input.workflowRunId ?? null,
    usageId: input.usageId ?? null,
    threadId: input.threadId ?? null,
    messageId: input.messageId ?? null,
    metadata: input.metadata ?? {},
    createdAt: new Date(),
  });

  return { id };
}
