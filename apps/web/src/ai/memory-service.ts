import 'server-only';

import { Memory } from '@mastra/memory';
import type { PostgresStore } from '@mastra/pg';
import { getMastraStorage } from './mastra/storage';

export interface UserMemoryEntry {
  readonly id: string;
  readonly content: string;
  readonly createdAt: Date;
  readonly threadId?: string;
  readonly resourceId: string;
  readonly confirmed: boolean;
  readonly disabled: boolean;
}

export interface CreateMemoryInput {
  readonly resourceId: string;
  readonly content: string;
  readonly threadId?: string;
}

export interface MemoryServiceResult<T> {
  readonly success: boolean;
  readonly data?: T;
  readonly error?: {
    readonly code: string;
    readonly message: string;
  };
}

let cachedStorage: PostgresStore | null = null;
let cachedMemory: Memory | null = null;
let storageInitialized = false;

function getStorage(): PostgresStore {
  if (!cachedStorage) {
    cachedStorage = getMastraStorage();
  }
  return cachedStorage;
}

async function ensureStorageInitialized(): Promise<void> {
  if (storageInitialized) return;

  const storage = getStorage();
  try {
    await storage.init();
    storageInitialized = true;
  } catch (error) {
    console.error('[Memory Service] Storage init error:', error);
    throw error;
  }
}

function getOrCreateMemory(): Memory {
  if (!cachedMemory) {
    const storage = getStorage();
    cachedMemory = new Memory({
      storage,
      options: {
        lastMessages: 20,
        generateTitle: false,
        semanticRecall: false,
      },
    });
  }
  return cachedMemory;
}

export async function listUserMemoryThreads(resourceId: string): Promise<
  MemoryServiceResult<
    readonly {
      id: string;
      title?: string;
      createdAt: Date;
      confirmed: boolean;
      disabled: boolean;
    }[]
  >
> {
  try {
    await ensureStorageInitialized();
    const memory = getOrCreateMemory();
    const result = await memory.listThreads({
      filter: { resourceId },
      perPage: false,
    });

    const threads = result?.threads ?? [];

    return {
      success: true,
      data: threads.map((thread) => {
        const metadata = thread.metadata as Record<string, unknown> | undefined;
        return {
          id: thread.id,
          title: thread.title,
          createdAt: thread.createdAt,
          confirmed: (metadata?.confirmed as boolean) ?? false,
          disabled: (metadata?.disabled as boolean) ?? false,
        };
      }),
    };
  } catch (error) {
    console.error('[Memory Service] listUserMemoryThreads error:', error);
    return {
      success: false,
      error: {
        code: 'list-threads-failed',
        message:
          error instanceof Error
            ? error.message
            : 'Failed to list memory threads',
      },
    };
  }
}

export async function createMemoryThread(
  input: CreateMemoryInput
): Promise<MemoryServiceResult<{ threadId: string; messageId: string }>> {
  try {
    await ensureStorageInitialized();
    const memory = getOrCreateMemory();

    const thread = await memory.createThread({
      resourceId: input.resourceId,
      title: `User Memory: ${input.content.slice(0, 50)}...`,
      metadata: {
        type: 'user-confirmed-memory',
        confirmed: false,
        disabled: false,
        createdAt: new Date().toISOString(),
      },
    });

    return {
      success: true,
      data: {
        threadId: thread.id,
        messageId: `memory-${thread.id}`,
      },
    };
  } catch (error) {
    console.error('[Memory Service] createMemoryThread error:', error);
    return {
      success: false,
      error: {
        code: 'create-memory-failed',
        message:
          error instanceof Error ? error.message : 'Failed to create memory',
      },
    };
  }
}

export async function confirmMemoryThread(
  threadId: string,
  resourceId: string
): Promise<MemoryServiceResult<{ threadId: string }>> {
  try {
    await ensureStorageInitialized();
    const storage = getStorage();
    const memory = getOrCreateMemory();

    const existingThread = await memory.getThreadById({ threadId });

    if (!existingThread) {
      return {
        success: false,
        error: {
          code: 'thread-not-found',
          message: 'Memory thread not found',
        },
      };
    }

    if (existingThread.resourceId !== resourceId) {
      return {
        success: false,
        error: {
          code: 'unauthorized',
          message: 'You do not have permission to confirm this memory',
        },
      };
    }

    const existingMetadata =
      (existingThread.metadata as Record<string, unknown>) ?? {};

    const newMetadata = {
      ...existingMetadata,
      confirmed: true,
      confirmedAt: new Date().toISOString(),
    };

    console.log('[Memory Service] confirmMemoryThread - updating metadata:', {
      threadId,
      newMetadata,
    });

    await storage.db.none(
      `UPDATE mastra.mastra_threads 
       SET metadata = $1, "updatedAt" = NOW()
       WHERE id = $2`,
      [JSON.stringify(newMetadata), threadId]
    );

    console.log('[Memory Service] confirmMemoryThread - update successful');

    return {
      success: true,
      data: { threadId },
    };
  } catch (error) {
    console.error('[Memory Service] confirmMemoryThread error:', error);
    return {
      success: false,
      error: {
        code: 'confirm-memory-failed',
        message:
          error instanceof Error ? error.message : 'Failed to confirm memory',
      },
    };
  }
}

export async function disableMemoryThread(
  threadId: string,
  resourceId: string
): Promise<MemoryServiceResult<{ threadId: string }>> {
  try {
    await ensureStorageInitialized();
    const storage = getStorage();
    const memory = getOrCreateMemory();

    const existingThread = await memory.getThreadById({ threadId });

    if (!existingThread) {
      return {
        success: false,
        error: {
          code: 'thread-not-found',
          message: 'Memory thread not found',
        },
      };
    }

    if (existingThread.resourceId !== resourceId) {
      return {
        success: false,
        error: {
          code: 'unauthorized',
          message: 'You do not have permission to disable this memory',
        },
      };
    }

    const existingMetadata =
      (existingThread.metadata as Record<string, unknown>) ?? {};

    const newDisabled = !(existingMetadata.disabled as boolean);

    await storage.db.none(
      `UPDATE mastra.mastra_threads 
       SET metadata = $1, "updatedAt" = NOW()
       WHERE id = $2`,
      [
        JSON.stringify({
          ...existingMetadata,
          disabled: newDisabled,
          disabledAt: newDisabled ? new Date().toISOString() : undefined,
        }),
        threadId,
      ]
    );

    return {
      success: true,
      data: { threadId },
    };
  } catch (error) {
    console.error('[Memory Service] disableMemoryThread error:', error);
    return {
      success: false,
      error: {
        code: 'disable-memory-failed',
        message:
          error instanceof Error ? error.message : 'Failed to disable memory',
      },
    };
  }
}

export async function deleteMemoryThread(
  threadId: string,
  resourceId: string
): Promise<MemoryServiceResult<{ threadId: string }>> {
  try {
    await ensureStorageInitialized();
    const storage = getStorage();
    const memory = getOrCreateMemory();

    const existingThread = await memory.getThreadById({ threadId });

    if (!existingThread) {
      return {
        success: false,
        error: {
          code: 'thread-not-found',
          message: 'Memory thread not found',
        },
      };
    }

    if (existingThread.resourceId !== resourceId) {
      return {
        success: false,
        error: {
          code: 'unauthorized',
          message: 'You do not have permission to delete this memory',
        },
      };
    }

    await storage.db.none(
      `DELETE FROM mastra.mastra_messages WHERE "thread_id" = $1`,
      [threadId]
    );

    await storage.db.none(`DELETE FROM mastra.mastra_threads WHERE id = $1`, [
      threadId,
    ]);

    return {
      success: true,
      data: { threadId },
    };
  } catch (error) {
    console.error('[Memory Service] deleteMemoryThread error:', error);
    return {
      success: false,
      error: {
        code: 'delete-memory-failed',
        message:
          error instanceof Error ? error.message : 'Failed to delete memory',
      },
    };
  }
}

export async function getMemoryThreadContent(
  threadId: string,
  resourceId: string
): Promise<
  MemoryServiceResult<{
    content: string;
    confirmed: boolean;
    disabled: boolean;
  }>
> {
  try {
    await ensureStorageInitialized();
    const memory = getOrCreateMemory();

    const thread = await memory.getThreadById({ threadId });

    if (!thread) {
      return {
        success: false,
        error: {
          code: 'thread-not-found',
          message: 'Memory thread not found',
        },
      };
    }

    if (thread.resourceId !== resourceId) {
      return {
        success: false,
        error: {
          code: 'unauthorized',
          message: 'You do not have permission to access this memory',
        },
      };
    }

    const { messages } = await memory.recall({ threadId, perPage: false });

    const content = messages
      .map((msg) => {
        const msgContent = msg.content;
        if (typeof msgContent === 'string') {
          return msgContent;
        }
        if (
          msgContent &&
          typeof msgContent === 'object' &&
          'text' in msgContent
        ) {
          return String((msgContent as { text: unknown }).text);
        }
        return '';
      })
      .filter(Boolean)
      .join('\n');

    const metadata = thread.metadata as Record<string, unknown> | undefined;

    return {
      success: true,
      data: {
        content,
        confirmed: (metadata?.confirmed as boolean) ?? false,
        disabled: (metadata?.disabled as boolean) ?? false,
      },
    };
  } catch (error) {
    console.error('[Memory Service] getMemoryThreadContent error:', error);
    return {
      success: false,
      error: {
        code: 'get-memory-failed',
        message:
          error instanceof Error
            ? error.message
            : 'Failed to get memory content',
      },
    };
  }
}

export const MEMORY_SERVICE_WIRED = true;
