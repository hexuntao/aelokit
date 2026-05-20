import 'server-only';

import { Memory } from '@mastra/memory';
import type { PostgresStore } from '@mastra/pg';
import { getMastraStorage } from '../mastra/storage';
import {
  extractMemoryMessageText,
  getConfirmedUserMemoryMessages,
} from '../memory-service';

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
  readonly threadIds?: readonly string[];
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
  _chatThreadId: string,
  memoryEnabled: boolean
): Promise<MemoryRecallResult> {
  if (!memoryEnabled) {
    return {
      success: true,
      messages: [],
      threadIds: [],
    };
  }

  const result = await getConfirmedUserMemoryMessages(userId, {
    lastMessages: 20,
  });

  if (!result.success || !result.data) {
    return {
      success: false,
      messages: [],
      threadIds: [],
      error: result.error?.message ?? 'Failed to recall confirmed memories.',
    };
  }

  return {
    success: true,
    messages: result.data.messages,
    threadIds: result.data.threadIds,
  };
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

export { extractMemoryMessageText };
