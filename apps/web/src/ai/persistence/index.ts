import 'server-only';

import { getDb } from '@repo/db';
import {
  aiThread,
  aiMessage,
  aiMessagePart,
  aiToolCall,
} from '@repo/db/ai-schema';
import { nanoid } from 'nanoid';
import { eq, and, desc, sql } from 'drizzle-orm';
import type { UIMessage } from 'ai';

export type MessageRole = 'system' | 'user' | 'assistant' | 'tool';
export type MessageStatus = 'streaming' | 'complete' | 'error' | 'aborted';
export type MessagePartType =
  | 'text'
  | 'reasoning'
  | 'tool-call'
  | 'tool-result'
  | 'file'
  | 'image'
  | 'source'
  | 'data';
export type ToolCallStatus =
  | 'pending'
  | 'running'
  | 'success'
  | 'error'
  | 'timeout';
export type ThreadStatus = 'active' | 'archived' | 'deleted';

export interface CreateThreadOptions {
  readonly userId: string;
  readonly title?: string;
  readonly agentId?: string;
  readonly providerId?: string;
  readonly modelId?: string;
  readonly metadata?: Record<string, unknown>;
}

export interface CreateMessageOptions {
  readonly threadId: string;
  readonly role: MessageRole;
  readonly content: unknown;
  readonly metadata?: Record<string, unknown>;
  readonly status?: MessageStatus;
  readonly parentMessageId?: string;
}

export interface ThreadData {
  readonly id: string;
  readonly userId: string;
  readonly title?: string;
  readonly status: ThreadStatus;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

export interface MessageData {
  readonly id: string;
  readonly threadId: string;
  readonly role: MessageRole;
  readonly status: MessageStatus;
  readonly createdAt: Date;
  readonly completedAt?: Date;
}

export interface PersistenceResult<T> {
  readonly success: boolean;
  readonly data?: T;
  readonly error?: Error;
}

function createThreadTitle(message?: UIMessage): string | undefined {
  const text = message?.parts
    .filter((part) => part.type === 'text')
    .map((part) => part.text)
    .join(' ')
    .trim();

  if (!text) {
    return undefined;
  }

  return text.length > 80 ? `${text.slice(0, 77)}...` : text;
}

export async function ensureThread(options: {
  readonly threadId?: string;
  readonly userId: string;
  readonly providerId?: string;
  readonly modelId?: string;
  readonly firstMessage?: UIMessage;
}): Promise<PersistenceResult<ThreadData>> {
  if (options.threadId) {
    const existingThread = await getThread(options.threadId, options.userId);
    if (!existingThread.success) {
      return {
        success: false,
        error: existingThread.error,
      };
    }

    if (!existingThread.data) {
      return {
        success: false,
        error: new Error('Thread not found.'),
      };
    }

    return {
      success: true,
      data: existingThread.data,
    };
  }

  return createThread({
    userId: options.userId,
    title: createThreadTitle(options.firstMessage),
    providerId: options.providerId,
    modelId: options.modelId,
    metadata: {
      runtimeFormat: 'aisdk-v6',
    },
  });
}

export async function createThread(
  options: CreateThreadOptions
): Promise<PersistenceResult<ThreadData>> {
  try {
    const db = await getDb();
    const id = `thread-${nanoid()}`;

    const [thread] = await db
      .insert(aiThread)
      .values({
        id,
        userId: options.userId,
        title: options.title,
        agentId: options.agentId,
        providerId: options.providerId,
        modelId: options.modelId,
        metadata: options.metadata ?? {},
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    return {
      success: true,
      data: {
        id: thread.id,
        userId: thread.userId,
        title: thread.title ?? undefined,
        status: thread.status as ThreadStatus,
        createdAt: thread.createdAt,
        updatedAt: thread.updatedAt,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error : new Error(String(error)),
    };
  }
}

export async function getThread(
  threadId: string,
  userId: string
): Promise<PersistenceResult<ThreadData | null>> {
  try {
    const db = await getDb();
    const threads = await db
      .select()
      .from(aiThread)
      .where(and(eq(aiThread.id, threadId), eq(aiThread.userId, userId)));

    if (threads.length === 0) {
      return { success: true, data: null };
    }

    const thread = threads[0];

    return {
      success: true,
      data: {
        id: thread.id,
        userId: thread.userId,
        title: thread.title ?? undefined,
        status: thread.status as ThreadStatus,
        createdAt: thread.createdAt,
        updatedAt: thread.updatedAt,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error : new Error(String(error)),
    };
  }
}

export async function listThreads(
  userId: string,
  options?: { limit?: number; status?: ThreadStatus }
): Promise<PersistenceResult<ThreadData[]>> {
  try {
    const db = await getDb();

    const query = db
      .select()
      .from(aiThread)
      .where(
        and(
          eq(aiThread.userId, userId),
          options?.status ? eq(aiThread.status, options.status) : undefined
        )
      )
      .orderBy(desc(aiThread.updatedAt));

    const threads = options?.limit
      ? await query.limit(options.limit)
      : await query;

    return {
      success: true,
      data: threads.map((thread) => ({
        id: thread.id,
        userId: thread.userId,
        title: thread.title ?? undefined,
        status: thread.status as ThreadStatus,
        createdAt: thread.createdAt,
        updatedAt: thread.updatedAt,
      })),
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error : new Error(String(error)),
    };
  }
}

export async function updateThread(
  threadId: string,
  userId: string,
  updates: Partial<{
    readonly title?: string;
    readonly status?: ThreadStatus;
    readonly metadata?: Record<string, unknown>;
  }>
): Promise<PersistenceResult<ThreadData>> {
  try {
    const db = await getDb();
    const [thread] = await db
      .update(aiThread)
      .set({
        ...(updates.title !== undefined ? { title: updates.title } : {}),
        ...(updates.status !== undefined ? { status: updates.status } : {}),
        ...(updates.metadata !== undefined
          ? { metadata: updates.metadata }
          : {}),
        updatedAt: new Date(),
      })
      .where(and(eq(aiThread.id, threadId), eq(aiThread.userId, userId)))
      .returning();

    return {
      success: true,
      data: {
        id: thread.id,
        userId: thread.userId,
        title: thread.title ?? undefined,
        status: thread.status as ThreadStatus,
        createdAt: thread.createdAt,
        updatedAt: thread.updatedAt,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error : new Error(String(error)),
    };
  }
}

export async function createMessage(
  options: CreateMessageOptions
): Promise<PersistenceResult<MessageData>> {
  try {
    const db = await getDb();

    const maxSortOrderResult = await db
      .select({ max: sql<number>`max(${aiMessage.sortOrder})` })
      .from(aiMessage)
      .where(eq(aiMessage.threadId, options.threadId));

    const nextSortOrder = (maxSortOrderResult[0]?.max ?? -1) + 1;

    const id = `msg-${nanoid()}`;
    const status = options.status ?? 'complete';
    const completedAt = status === 'complete' ? new Date() : undefined;

    const [message] = await db
      .insert(aiMessage)
      .values({
        id,
        threadId: options.threadId,
        role: options.role,
        status,
        sortOrder: nextSortOrder,
        metadata: options.metadata ?? {},
        createdAt: new Date(),
        completedAt,
        parentMessageId: options.parentMessageId,
      })
      .returning();

    await saveMessageParts(id, options.content, {
      threadId: options.threadId,
    });

    if (status === 'complete') {
      await db
        .update(aiThread)
        .set({ updatedAt: new Date() })
        .where(eq(aiThread.id, options.threadId));
    }

    return {
      success: true,
      data: {
        id: message.id,
        threadId: message.threadId,
        role: message.role as MessageRole,
        status: message.status as MessageStatus,
        createdAt: message.createdAt,
        completedAt: message.completedAt ?? undefined,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error : new Error(String(error)),
    };
  }
}

export async function saveMessageParts(
  messageId: string,
  content: unknown,
  options?: {
    readonly threadId?: string;
  }
): Promise<void> {
  const db = await getDb();

  if (!content) return;

  const parts: Array<UIMessage['parts'][number]> = Array.isArray(content)
    ? (content as Array<UIMessage['parts'][number]>)
    : [{ type: 'text', text: String(content) }];

  for (let i = 0; i < parts.length; i++) {
    const part = parts[i] as Record<string, unknown>;
    let partType: MessagePartType = 'text';
    const partTypeValue = part.type as string;
    const runtimePartType: string = partTypeValue;
    let toolCallId: string | null = null;

    switch (partTypeValue) {
      case 'text':
        partType = 'text';
        break;
      case 'reasoning':
        partType = 'reasoning';
        break;
      case 'tool-call':
        partType = 'tool-call';
        break;
      case 'tool-result':
        partType = 'tool-result';
        break;
      case 'file':
        partType = 'file';
        break;
      case 'image':
        partType = 'image';
        break;
      case 'source':
      case 'source-url':
      case 'source-document':
        partType = 'source';
        break;
      default:
        if (
          partTypeValue === 'dynamic-tool' ||
          partTypeValue.startsWith('tool-')
        ) {
          partType = 'tool-call';
        } else if (partTypeValue.startsWith('data-')) {
          partType = 'data';
        }
    }

    if (partType === 'tool-call' && options?.threadId) {
      toolCallId = await persistToolCallFromMessagePart({
        threadId: options.threadId,
        messageId,
        part,
        runtimePartType,
      });
    }

    await db.insert(aiMessagePart).values({
      id: `part-${nanoid()}`,
      messageId,
      partType,
      runtimePartType,
      content: part as Record<string, unknown>,
      toolCallId,
      sortOrder: i,
      createdAt: new Date(),
    });
  }
}

async function persistToolCallFromMessagePart(options: {
  readonly threadId: string;
  readonly messageId: string;
  readonly part: Record<string, unknown>;
  readonly runtimePartType: string;
}): Promise<string | null> {
  const toolCallId =
    typeof options.part.toolCallId === 'string'
      ? options.part.toolCallId
      : `tc-${nanoid()}`;
  const toolName =
    typeof options.part.toolName === 'string'
      ? options.part.toolName
      : options.runtimePartType.replace(/^tool-/, '');
  const state =
    typeof options.part.state === 'string' ? options.part.state : undefined;
  const status: ToolCallStatus =
    state === 'output-available'
      ? 'success'
      : state === 'output-error' || state === 'output-denied'
        ? 'error'
        : state === 'input-streaming'
          ? 'running'
          : 'pending';

  const result = await createToolCall({
    id: toolCallId,
    threadId: options.threadId,
    messageId: options.messageId,
    toolName,
    status,
    input:
      typeof options.part.input === 'object' && options.part.input !== null
        ? (options.part.input as Record<string, unknown>)
        : undefined,
    output:
      typeof options.part.output === 'object' && options.part.output !== null
        ? (options.part.output as Record<string, unknown>)
        : undefined,
    errorMessage:
      typeof options.part.errorText === 'string'
        ? options.part.errorText
        : undefined,
    providerExecuted: Boolean(options.part.providerExecuted),
  });

  return result.success ? (result.data?.id ?? null) : null;
}

export async function getMessages(
  threadId: string,
  options?: { limit?: number }
): Promise<PersistenceResult<unknown[]>> {
  try {
    const db = await getDb();

    const messages = await db
      .select()
      .from(aiMessage)
      .where(eq(aiMessage.threadId, threadId))
      .orderBy(aiMessage.sortOrder);

    if (options?.limit) {
      messages.length = Math.min(messages.length, options.limit);
    }

    const uiMessages = messages.map((msg) => ({
      id: msg.id,
      role: msg.role,
      content: [],
      metadata: msg.metadata,
    }));

    return { success: true, data: uiMessages };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error : new Error(String(error)),
    };
  }
}

export async function updateMessageStatus(
  messageId: string,
  status: MessageStatus,
  completedAt?: Date
): Promise<PersistenceResult<MessageData>> {
  try {
    const db = await getDb();
    const [message] = await db
      .update(aiMessage)
      .set({
        status,
        completedAt:
          completedAt ?? (status === 'complete' ? new Date() : undefined),
      })
      .where(eq(aiMessage.id, messageId))
      .returning();

    await db
      .update(aiThread)
      .set({ updatedAt: new Date() })
      .where(eq(aiThread.id, message.threadId));

    return {
      success: true,
      data: {
        id: message.id,
        threadId: message.threadId,
        role: message.role as MessageRole,
        status: message.status as MessageStatus,
        createdAt: message.createdAt,
        completedAt: message.completedAt ?? undefined,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error : new Error(String(error)),
    };
  }
}

export async function createToolCall(options: {
  readonly id?: string;
  readonly threadId: string;
  readonly messageId: string;
  readonly toolName: string;
  readonly toolId?: string;
  readonly status?: ToolCallStatus;
  readonly input?: Record<string, unknown>;
  readonly output?: Record<string, unknown>;
  readonly errorMessage?: string;
  readonly providerExecuted?: boolean;
}): Promise<PersistenceResult<{ id: string }>> {
  try {
    const db = await getDb();
    const id = options.id ?? `tc-${nanoid()}`;

    const [toolCall] = await db
      .insert(aiToolCall)
      .values({
        id,
        threadId: options.threadId,
        messageId: options.messageId,
        toolName: options.toolName,
        toolId: options.toolId,
        status: options.status ?? 'pending',
        input: options.input,
        output: options.output,
        providerExecuted: options.providerExecuted ?? false,
        errorMessage: options.errorMessage,
        startedAt:
          options.status === 'running' || options.status === 'success'
            ? new Date()
            : undefined,
        completedAt:
          options.status === 'success' || options.status === 'error'
            ? new Date()
            : undefined,
        createdAt: new Date(),
      })
      .onConflictDoUpdate({
        target: aiToolCall.id,
        set: {
          status: options.status ?? 'pending',
          input: options.input,
          output: options.output,
          providerExecuted: options.providerExecuted ?? false,
          errorMessage: options.errorMessage,
          completedAt:
            options.status === 'success' || options.status === 'error'
              ? new Date()
              : undefined,
        },
      })
      .returning();

    return { success: true, data: { id: toolCall.id } };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error : new Error(String(error)),
    };
  }
}

export async function updateToolCall(
  toolCallId: string,
  updates: Partial<{
    readonly status?: ToolCallStatus;
    readonly output?: Record<string, unknown>;
    readonly errorCode?: string;
    readonly errorMessage?: string;
    readonly startedAt?: Date;
    readonly completedAt?: Date;
  }>
): Promise<PersistenceResult<void>> {
  try {
    const db = await getDb();
    await db
      .update(aiToolCall)
      .set({
        ...(updates.status !== undefined ? { status: updates.status } : {}),
        ...(updates.output !== undefined ? { output: updates.output } : {}),
        ...(updates.errorCode !== undefined
          ? { errorCode: updates.errorCode }
          : {}),
        ...(updates.errorMessage !== undefined
          ? { errorMessage: updates.errorMessage }
          : {}),
        ...(updates.startedAt !== undefined
          ? { startedAt: updates.startedAt }
          : {}),
        ...(updates.completedAt !== undefined
          ? { completedAt: updates.completedAt }
          : {}),
      })
      .where(eq(aiToolCall.id, toolCallId));

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error : new Error(String(error)),
    };
  }
}
