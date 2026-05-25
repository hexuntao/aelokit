import 'server-only';

import type { AIEvalStatus } from '@repo/ai/evals';
import { getDb } from '@repo/db';
import { aiEvalResult } from '@repo/db/schema';
import { nanoid } from 'nanoid';
export {
  KNOWLEDGE_INDEX_HEALTH_SCORER_ID,
  scoreKnowledgeIndexHealth,
  type KnowledgeIndexHealthInput,
  type KnowledgeIndexHealthScore,
} from './knowledge-index-health';

export async function recordAIEvalResult(input: {
  readonly workflowRunId?: string;
  readonly scorerId: string;
  readonly status: AIEvalStatus;
  readonly score?: number;
  readonly metadata?: Readonly<Record<string, unknown>>;
}): Promise<{ readonly id: string }> {
  const db = await getDb();
  const id = `eval-${nanoid()}`;

  await db.insert(aiEvalResult).values({
    id,
    workflowRunId: input.workflowRunId ?? null,
    scorerId: input.scorerId,
    status: input.status,
    score: input.score === undefined ? null : String(input.score),
    metadata: input.metadata ?? {},
    createdAt: new Date(),
  });

  return { id };
}
