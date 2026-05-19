import 'server-only';

import type { PostgresStore } from '@mastra/pg';
import type { Memory } from '@mastra/memory';

export interface MastraRuntimeConfig {
  readonly storage: PostgresStore;
  readonly memory?: Memory;
}

export function resolveMastraRuntimeConfig(
  storage: PostgresStore,
  memory?: Memory
): MastraRuntimeConfig {
  return {
    storage,
    memory,
  };
}

export interface MastraMemoryRequestContext {
  readonly threadId: string;
  readonly resourceId: string;
}

export function resolveMastraMemoryContext(
  userId: string,
  threadId: string
): MastraMemoryRequestContext {
  return {
    threadId,
    resourceId: userId,
  };
}

export interface MastraMemoryOptions {
  readonly lastMessages?: number;
  readonly semanticRecall?: {
    readonly topK: number;
    readonly messageRange: number;
  };
}

export function resolveMastraMemoryOptions(): MastraMemoryOptions {
  return {
    lastMessages: 20,
    semanticRecall: {
      topK: 5,
      messageRange: 2,
    },
  };
}

export const PARTIAL_UNTIL_WIRED = true;
