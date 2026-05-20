import 'server-only';

import { Memory } from '@mastra/memory';
import type { MastraDBMessage } from '@mastra/core/agent';
import type { PostgresStore } from '@mastra/pg';
import { and, desc, eq, isNotNull, ne } from 'drizzle-orm';
import { nanoid } from 'nanoid';
import { getDb } from '@repo/db';
import { aiMemoryDraft } from '@repo/db/ai-schema';
import { getMastraStorage } from './mastra/storage';

export interface UserMemoryEntry {
  readonly id: string;
  readonly content: string;
  readonly createdAt: Date;
  readonly threadId?: string | null;
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

type MemoryDraftRow = typeof aiMemoryDraft.$inferSelect;

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

function createMemoryTitle(content: string): string {
  const trimmed = content.replace(/\s+/g, ' ').trim();
  if (trimmed.length <= 50) {
    return trimmed || 'User Memory';
  }
  return `${trimmed.slice(0, 50)}...`;
}

function toMemoryThreadSummary(row: MemoryDraftRow): {
  id: string;
  title?: string;
  createdAt: Date;
  confirmed: boolean;
  disabled: boolean;
} {
  return {
    id: row.id,
    title: row.title ?? createMemoryTitle(row.content),
    createdAt: row.createdAt,
    confirmed: row.status === 'confirmed',
    disabled: row.disabled,
  };
}

async function getMemoryDraftById(
  id: string,
  resourceId: string
): Promise<MemoryDraftRow | undefined> {
  const db = await getDb();
  const [draft] = await db
    .select()
    .from(aiMemoryDraft)
    .where(and(eq(aiMemoryDraft.id, id), eq(aiMemoryDraft.userId, resourceId)))
    .limit(1);

  return draft;
}

async function listActiveMemoryDrafts(
  resourceId: string
): Promise<MemoryDraftRow[]> {
  const db = await getDb();
  return db
    .select()
    .from(aiMemoryDraft)
    .where(
      and(
        eq(aiMemoryDraft.userId, resourceId),
        ne(aiMemoryDraft.status, 'deleted')
      )
    )
    .orderBy(desc(aiMemoryDraft.createdAt));
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
    const draftRows = await listActiveMemoryDrafts(resourceId);
    const draftThreadIds = new Set(
      draftRows
        .map((row) => row.mastraThreadId)
        .filter((threadId): threadId is string => Boolean(threadId))
    );

    let legacyThreads: {
      id: string;
      title?: string;
      createdAt: Date;
      confirmed: boolean;
      disabled: boolean;
    }[] = [];

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

      legacyThreads = (result?.threads ?? [])
        .filter((thread) => {
          const metadata = thread.metadata as
            | Record<string, unknown>
            | undefined;
          return (
            isUserMemoryThread(metadata) &&
            getMemoryMetadataBoolean(metadata, 'confirmed') &&
            !draftThreadIds.has(thread.id)
          );
        })
        .map((thread) => {
          const metadata = thread.metadata as
            | Record<string, unknown>
            | undefined;
          return {
            id: thread.id,
            title: thread.title,
            createdAt: thread.createdAt,
            confirmed: true,
            disabled: getMemoryMetadataBoolean(metadata, 'disabled'),
          };
        });
    } catch (error) {
      console.error(
        '[Memory Service] list legacy memory threads error:',
        error
      );
    }

    return {
      success: true,
      data: [...draftRows.map(toMemoryThreadSummary), ...legacyThreads],
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
): Promise<MemoryServiceResult<{ threadId: string; messageId?: string }>> {
  try {
    const now = new Date();
    const db = await getDb();
    const draftId = `memory-draft-${nanoid()}`;
    const title = createMemoryTitle(input.content);

    await db.insert(aiMemoryDraft).values({
      id: draftId,
      userId: input.resourceId,
      title,
      content: input.content,
      status: 'pending',
      disabled: false,
      metadata: {
        source: 'manual-memory',
      },
      createdAt: now,
      updatedAt: now,
    });

    return {
      success: true,
      data: {
        threadId: draftId,
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
    const draft = await getMemoryDraftById(threadId, resourceId);

    if (draft) {
      if (draft.status === 'deleted') {
        return {
          success: false,
          error: {
            code: 'memory-deleted',
            message: 'Deleted memory cannot be confirmed',
          },
        };
      }

      if (draft.status === 'confirmed') {
        return {
          success: true,
          data: { threadId: draft.id },
        };
      }

      await ensureStorageInitialized();
      const memory = getOrCreateMemory();
      const now = new Date();
      const title = draft.title ?? createMemoryTitle(draft.content);

      const thread = await memory.createThread({
        resourceId,
        title,
        metadata: {
          type: 'user-confirmed-memory',
          aelokitMemoryId: draft.id,
          confirmed: true,
          disabled: false,
          createdAt: draft.createdAt.toISOString(),
          confirmedAt: now.toISOString(),
        },
      });

      const memoryMessage = createManualMemoryMessage({
        threadId: thread.id,
        resourceId,
        content: draft.content,
        now,
      });

      await memory.saveMessages({
        messages: [memoryMessage],
      });

      const db = await getDb();
      await db
        .update(aiMemoryDraft)
        .set({
          status: 'confirmed',
          disabled: false,
          mastraThreadId: thread.id,
          mastraMessageId: memoryMessage.id,
          confirmedAt: now,
          updatedAt: now,
        })
        .where(
          and(
            eq(aiMemoryDraft.id, draft.id),
            eq(aiMemoryDraft.userId, resourceId)
          )
        );

      return {
        success: true,
        data: { threadId: draft.id },
      };
    }

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

    if (!isUserMemoryThread(existingMetadata)) {
      return {
        success: false,
        error: {
          code: 'invalid-memory-thread',
          message: 'Memory thread is not a user memory',
        },
      };
    }

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
    const draft = await getMemoryDraftById(threadId, resourceId);

    if (draft) {
      if (draft.status !== 'confirmed') {
        return {
          success: false,
          error: {
            code: 'memory-not-confirmed',
            message: 'Confirm the memory before disabling it',
          },
        };
      }

      const newDisabled = !draft.disabled;
      const now = new Date();

      if (draft.mastraThreadId) {
        await ensureStorageInitialized();
        const memory = getOrCreateMemory();
        const existingThread = await memory.getThreadById({
          threadId: draft.mastraThreadId,
        });

        if (existingThread) {
          const existingMetadata =
            (existingThread.metadata as Record<string, unknown>) ?? {};

          if (existingThread.resourceId !== resourceId) {
            return {
              success: false,
              error: {
                code: 'unauthorized',
                message: 'You do not have permission to disable this memory',
              },
            };
          }

          await memory.updateThread({
            id: draft.mastraThreadId,
            title: existingThread.title ?? draft.title ?? 'User Memory',
            metadata: {
              ...existingMetadata,
              disabled: newDisabled,
              disabledAt: newDisabled ? now.toISOString() : undefined,
            },
          });
        }
      }

      const db = await getDb();
      await db
        .update(aiMemoryDraft)
        .set({
          disabled: newDisabled,
          updatedAt: now,
          metadata: {
            ...(draft.metadata as Record<string, unknown>),
            disabledAt: newDisabled ? now.toISOString() : undefined,
          },
        })
        .where(
          and(
            eq(aiMemoryDraft.id, draft.id),
            eq(aiMemoryDraft.userId, resourceId)
          )
        );

      return {
        success: true,
        data: { threadId: draft.id },
      };
    }

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

    if (!isUserMemoryThread(existingMetadata)) {
      return {
        success: false,
        error: {
          code: 'invalid-memory-thread',
          message: 'Memory thread is not a user memory',
        },
      };
    }

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
    const draft = await getMemoryDraftById(threadId, resourceId);

    if (draft) {
      const now = new Date();

      if (draft.mastraThreadId && draft.status === 'confirmed') {
        await ensureStorageInitialized();
        const memory = getOrCreateMemory();
        const existingThread = await memory.getThreadById({
          threadId: draft.mastraThreadId,
        });

        if (existingThread && existingThread.resourceId !== resourceId) {
          return {
            success: false,
            error: {
              code: 'unauthorized',
              message: 'You do not have permission to delete this memory',
            },
          };
        }

        if (existingThread) {
          await memory.deleteThread(draft.mastraThreadId);
        }
      }

      const db = await getDb();
      await db
        .update(aiMemoryDraft)
        .set({
          status: 'deleted',
          disabled: true,
          deletedAt: now,
          updatedAt: now,
        })
        .where(
          and(
            eq(aiMemoryDraft.id, draft.id),
            eq(aiMemoryDraft.userId, resourceId)
          )
        );

      return {
        success: true,
        data: { threadId: draft.id },
      };
    }

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

    const existingMetadata =
      (existingThread.metadata as Record<string, unknown>) ?? {};

    if (!isUserMemoryThread(existingMetadata)) {
      return {
        success: false,
        error: {
          code: 'invalid-memory-thread',
          message: 'Memory thread is not a user memory',
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
    const draft = await getMemoryDraftById(threadId, resourceId);

    if (draft) {
      if (draft.status !== 'confirmed' || !draft.mastraThreadId) {
        return {
          success: true,
          data: {
            content: draft.status === 'deleted' ? '' : draft.content,
            confirmed: false,
            disabled: draft.disabled,
          },
        };
      }

      await ensureStorageInitialized();
      const memory = getOrCreateMemory();
      const thread = await memory.getThreadById({
        threadId: draft.mastraThreadId,
      });

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

      const { messages } = await memory.recall({
        threadId: draft.mastraThreadId,
        resourceId,
        perPage: false,
      });

      const content = messages
        .map((msg) => extractMemoryMessageText(msg))
        .filter(Boolean)
        .join('\n');

      return {
        success: true,
        data: {
          content,
          confirmed: true,
          disabled: draft.disabled,
        },
      };
    }

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

    if (!isUserMemoryThread(metadata)) {
      return {
        success: false,
        error: {
          code: 'invalid-memory-thread',
          message: 'Memory thread is not a user memory',
        },
      };
    }

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
    const db = await getDb();
    const confirmedDrafts = await db
      .select()
      .from(aiMemoryDraft)
      .where(
        and(
          eq(aiMemoryDraft.userId, resourceId),
          eq(aiMemoryDraft.status, 'confirmed'),
          eq(aiMemoryDraft.disabled, false),
          isNotNull(aiMemoryDraft.mastraThreadId)
        )
      );

    await ensureStorageInitialized();
    const memory = getOrCreateMemory();
    const draftThreadIds = confirmedDrafts
      .map((draft) => draft.mastraThreadId)
      .filter((threadId): threadId is string => Boolean(threadId));

    const draftMessagesByThread = await Promise.all(
      draftThreadIds.map(async (threadId) => {
        const recallResult = await memory.recall({
          threadId,
          resourceId,
          perPage: false,
        });
        return recallResult.messages;
      })
    );

    const result = await memory.listThreads({
      filter: {
        resourceId,
        metadata: { type: 'user-confirmed-memory' },
      },
      perPage: false,
    });

    const draftThreadIdSet = new Set(draftThreadIds);
    const activeLegacyThreads = (result?.threads ?? []).filter((thread) => {
      const metadata = thread.metadata as Record<string, unknown> | undefined;
      return (
        isUserMemoryThread(metadata) &&
        getMemoryMetadataBoolean(metadata, 'confirmed') &&
        !getMemoryMetadataBoolean(metadata, 'disabled') &&
        !draftThreadIdSet.has(thread.id)
      );
    });

    const legacyMessagesByThread = await Promise.all(
      activeLegacyThreads.map(async (thread) => {
        const recallResult = await memory.recall({
          threadId: thread.id,
          resourceId,
          perPage: false,
        });
        return recallResult.messages;
      })
    );

    const messages = [...draftMessagesByThread, ...legacyMessagesByThread]
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
        threadIds: [
          ...draftThreadIds,
          ...activeLegacyThreads.map((thread) => thread.id),
        ],
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
