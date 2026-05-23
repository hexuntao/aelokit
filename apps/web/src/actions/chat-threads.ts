'use server';

import { getMessages, getThread, listThreads } from '@/ai/persistence';
import type {
  ChatThreadState,
  ChatThreadSummary,
  ChatUIMessage,
} from '@/components/ai/types';
import type { SessionUser } from '@/lib/auth-types';
import { userActionClient } from '@/lib/safe-action';
import { z } from 'zod';

type ChatThreadActionResult<T> =
  | {
      readonly success: true;
      readonly data: T;
    }
  | {
      readonly success: false;
      readonly error: {
        readonly message: string;
      };
    };

const threadIdSchema = z.object({
  threadId: z.string().min(1),
});

function toThreadSummary(thread: {
  readonly id: string;
  readonly title?: string;
  readonly status: 'active' | 'archived' | 'deleted';
  readonly createdAt: Date;
  readonly updatedAt: Date;
  readonly providerId?: string;
  readonly providerName?: string;
  readonly modelId?: string;
  readonly modelName?: string;
}): ChatThreadSummary {
  return {
    id: thread.id,
    title: thread.title,
    status: thread.status,
    createdAt: thread.createdAt.toISOString(),
    updatedAt: thread.updatedAt.toISOString(),
    providerId: thread.providerId,
    providerName: thread.providerName,
    modelId: thread.modelId,
    modelName: thread.modelName,
  };
}

function actionError(message: string): ChatThreadActionResult<never> {
  return {
    success: false,
    error: {
      message,
    },
  };
}

export const getUserChatThreadsAction = userActionClient.action(
  async ({
    ctx,
  }): Promise<ChatThreadActionResult<readonly ChatThreadSummary[]>> => {
    const user = (ctx as { user: SessionUser }).user;
    const threadsResult = await listThreads(user.id, {
      status: 'active',
    });

    if (!threadsResult.success) {
      return actionError(
        threadsResult.error?.message ?? 'Failed to load chat threads.'
      );
    }

    return {
      success: true,
      data: (threadsResult.data ?? []).map(toThreadSummary),
    };
  }
);

export const getUserChatThreadStateAction = userActionClient
  .inputSchema(threadIdSchema)
  .action(
    async ({
      parsedInput,
      ctx,
    }): Promise<ChatThreadActionResult<ChatThreadState>> => {
      const user = (ctx as { user: SessionUser }).user;
      const threadResult = await getThread(parsedInput.threadId, user.id);

      if (!threadResult.success) {
        return actionError(
          threadResult.error?.message ?? 'Failed to load chat thread.'
        );
      }

      if (!threadResult.data) {
        return actionError('Chat thread not found.');
      }

      const messagesResult = await getMessages(parsedInput.threadId);

      if (!messagesResult.success) {
        return actionError(
          messagesResult.error?.message ?? 'Failed to load chat messages.'
        );
      }

      return {
        success: true,
        data: {
          thread: toThreadSummary(threadResult.data),
          messages: messagesResult.data as readonly ChatUIMessage[],
        },
      };
    }
  );
