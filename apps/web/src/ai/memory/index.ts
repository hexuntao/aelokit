import 'server-only';

import { Memory } from '@mastra/memory';
import type { PostgresStore } from '@mastra/pg';
import { getMastraStorage } from '../mastra/storage';

export interface MemoryContext {
  readonly threadId: string;
  readonly resourceId: string;
}

export interface MemoryConfig {
  readonly enabled: boolean;
  readonly lastMessages?: number;
}

export interface MemoryRecallResult {
  readonly success: boolean;
  readonly messages: readonly unknown[];
  readonly error?: string;
}

let cachedMemory: Memory | null = null;

function getOrCreateMemory(): Memory {
  if (cachedMemory) {
    return cachedMemory;
  }
  const storage = getMastraStorage();
  cachedMemory = new Memory({
    storage,
    options: {
      lastMessages: 20,
      generateTitle: false,
      semanticRecall: false,
    },
  });
  return cachedMemory;
}

export function resolveMemoryContext(
  userId: string,
  threadId: string
): MemoryContext {
  return {
    threadId,
    resourceId: userId,
  };
}

export async function recallMemoryMessages(
  context: MemoryContext,
  config: MemoryConfig
): Promise<MemoryRecallResult> {
  if (!config.enabled) {
    return {
      success: true,
      messages: [],
    };
  }

  try {
    const memory = getOrCreateMemory();

    const { messages } = await memory.recall({
      threadId: context.threadId,
      perPage: false,
    });

    return {
      success: true,
      messages,
    };
  } catch (error) {
    console.error('[Memory Recall Error]', error);
    return {
      success: false,
      messages: [],
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

export async function getMemoryContextForChat(
  userId: string,
  threadId: string,
  memoryEnabled: boolean
): Promise<MemoryRecallResult> {
  const context = resolveMemoryContext(userId, threadId);
  return recallMemoryMessages(context, {
    enabled: memoryEnabled,
    lastMessages: 20,
  });
}

export function isMemoryEnabledForRequest(
  requestMemoryEnabled?: boolean
): boolean {
  if (requestMemoryEnabled === undefined) {
    return false;
  }
  return requestMemoryEnabled === true;
}

export const MEMORY_WIRED = true;
