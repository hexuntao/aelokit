import 'server-only';

import type { AIEvalStatus } from '@repo/ai/evals';
import { getDb } from '@repo/db';
import { aiEvalResult } from '@repo/db/schema';
import { nanoid } from 'nanoid';

export const KNOWLEDGE_INDEX_HEALTH_SCORER_ID = 'knowledge.index-health.v1';

export interface KnowledgeIndexHealthInput {
  readonly sources: readonly {
    readonly status: string;
    readonly chunkCount: number;
    readonly vectorCount: number;
    readonly documents: readonly {
      readonly chunks: readonly unknown[];
    }[];
  }[];
}

export interface KnowledgeIndexHealthScore {
  readonly scorerId: typeof KNOWLEDGE_INDEX_HEALTH_SCORER_ID;
  readonly status: AIEvalStatus;
  readonly score: number;
  readonly metadata: Readonly<Record<string, unknown>>;
}

export function scoreKnowledgeIndexHealth(
  input: KnowledgeIndexHealthInput
): KnowledgeIndexHealthScore {
  if (input.sources.length === 0) {
    return {
      scorerId: KNOWLEDGE_INDEX_HEALTH_SCORER_ID,
      status: 'failed',
      score: 0,
      metadata: {
        reason: 'no-accessible-sources',
      },
    };
  }

  const sourceCount = input.sources.length;
  const readySourceCount = input.sources.filter(
    (source) => source.status === 'ready'
  ).length;
  const indexedSourceCount = input.sources.filter(
    (source) =>
      source.chunkCount > 0 &&
      source.vectorCount > 0 &&
      source.vectorCount >= source.chunkCount
  ).length;
  const observedChunkCount = input.sources.reduce(
    (total, source) =>
      total +
      source.documents.reduce(
        (documentTotal, document) => documentTotal + document.chunks.length,
        0
      ),
    0
  );
  const score = (readySourceCount + indexedSourceCount) / (sourceCount * 2);

  return {
    scorerId: KNOWLEDGE_INDEX_HEALTH_SCORER_ID,
    status: score >= 1 ? 'passed' : 'failed',
    score,
    metadata: {
      sourceCount,
      readySourceCount,
      indexedSourceCount,
      observedChunkCount,
    },
  };
}

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
