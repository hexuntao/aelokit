import 'server-only';

import { Memory } from '@mastra/memory';
import type { MastraDBMessage } from '@mastra/core/agent';
import type { PostgresStore } from '@mastra/pg';
import { nanoid } from 'nanoid';
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

export interface ConfirmedMemoryMessagesResult {
  readonly messages: readonly MastraDBMessage[];
  readonly threadIds: readonly string[];
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

function getMemoryMetadataBoolean(
  metadata: Record<string, unknown> | undefined,
  key: string
): boolean {
  return metadata?.[key] === true;
}

function isUserMemoryThread(metadata: Record<string, unknown> | undefined) {
  return metadata?.type === 'user-confirmed-memory';
}

export function extractMemoryMessageText(message: unknown): string {
  const content = (message as { content?: unknown })?.content;

  if (typeof content === 'string') {
    return content;
  }

  if (!content || typeof content !== 'object') {
    return '';
  }

  if ('text' in content) {
    return String((content as { text: unknown }).text);
  }

  const parts = (content as { parts?: unknown }).parts;
  if (!Array.isArray(parts)) {
    return '';
  }

  return parts
    .map((part) => {
      if (!part || typeof part !== 'object') {
        return '';
      }
      if ((part as { type?: unknown }).type !== 'text') {
        return '';
      }
      return String((part as { text?: unknown }).text ?? '');
    })
    .filter(Boolean)
    .join('\n');
}

function createManualMemoryMessage(input: {
  readonly threadId: string;
  readonly resourceId: string;
  readonly content: string;
  readonly now: Date;
}): MastraDBMessage {
  return {
    id: `memory-message-${nanoid()}`,
    role: 'user',
    type: 'text',
    threadId: input.threadId,
    resourceId: input.resourceId,
    createdAt: input.now,
    content: {
      format: 2,
      parts: [{ type: 'text', text: input.content }],
      content: input.content,
      metadata: {
        source: 'manual-memory',
      },
    },
  };
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
      filter: {
        resourceId,
        metadata: { type: 'user-confirmed-memory' },
      },
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
    const now = new Date();

    const thread = await memory.createThread({
      resourceId: input.resourceId,
      title: `User Memory: ${input.content.slice(0, 50)}...`,
      metadata: {
        type: 'user-confirmed-memory',
        confirmed: false,
        disabled: false,
        createdAt: now.toISOString(),
      },
    });

    const memoryMessage = createManualMemoryMessage({
      threadId: thread.id,
      resourceId: input.resourceId,
      content: input.content,
      now,
    });

    await memory.saveMessages({
      messages: [memoryMessage],
    });

    return {
      success: true,
      data: {
        threadId: thread.id,
        messageId: memoryMessage.id,
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

    await memory.updateThread({
      id: threadId,
      title: existingThread.title ?? 'User Memory',
      metadata: newMetadata,
    });

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

    await memory.updateThread({
      id: threadId,
      title: existingThread.title ?? 'User Memory',
      metadata: {
        ...existingMetadata,
        disabled: newDisabled,
        disabledAt: newDisabled ? new Date().toISOString() : undefined,
      },
    });

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

    await memory.deleteThread(threadId);

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
      .map((msg) => extractMemoryMessageText(msg))
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

export async function getConfirmedUserMemoryMessages(
  resourceId: string,
  options: { readonly lastMessages?: number } = {}
): Promise<MemoryServiceResult<ConfirmedMemoryMessagesResult>> {
  try {
    await ensureStorageInitialized();
    const memory = getOrCreateMemory();
    const result = await memory.listThreads({
      filter: {
        resourceId,
        metadata: { type: 'user-confirmed-memory' },
      },
      perPage: false,
    });

    const activeThreads = (result?.threads ?? []).filter((thread) => {
      const metadata = thread.metadata as Record<string, unknown> | undefined;
      return (
        isUserMemoryThread(metadata) &&
        getMemoryMetadataBoolean(metadata, 'confirmed') &&
        !getMemoryMetadataBoolean(metadata, 'disabled')
      );
    });

    const messagesByThread = await Promise.all(
      activeThreads.map(async (thread) => {
        const recallResult = await memory.recall({
          threadId: thread.id,
          resourceId,
          perPage: false,
        });
        return recallResult.messages;
      })
    );

    const messages = messagesByThread
      .flat()
      .filter((message) => extractMemoryMessageText(message).trim().length > 0)
      .sort(
        (left, right) => left.createdAt.getTime() - right.createdAt.getTime()
      );

    const lastMessages = options.lastMessages ?? 20;

    return {
      success: true,
      data: {
        messages: messages.slice(-lastMessages),
        threadIds: activeThreads.map((thread) => thread.id),
      },
    };
  } catch (error) {
    console.error(
      '[Memory Service] getConfirmedUserMemoryMessages error:',
      error
    );
    return {
      success: false,
      error: {
        code: 'confirmed-memory-recall-failed',
        message:
          error instanceof Error
            ? error.message
            : 'Failed to recall confirmed memories',
      },
    };
  }
}

export const MEMORY_SERVICE_WIRED = true;
