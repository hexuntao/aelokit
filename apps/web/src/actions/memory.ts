'use server';

import {
  listUserMemoryThreads,
  createMemoryThread,
  confirmMemoryThread,
  disableMemoryThread,
  deleteMemoryThread,
  getMemoryThreadContent,
  type MemoryServiceResult,
} from '@/ai/memory-service';
import type { SessionUser } from '@/lib/auth-types';
import { userActionClient } from '@/lib/safe-action';
import { z } from 'zod';

export type MemoryThread = {
  id: string;
  title?: string;
  createdAt: Date;
};

export type MemoryActionResult<T> = MemoryServiceResult<T>;

const createMemorySchema = z.object({
  content: z.string().min(1, 'Memory content cannot be empty'),
});

const threadIdSchema = z.object({
  threadId: z.string().min(1),
});

export const getUserMemoryThreadsAction = userActionClient.action(
  async ({ ctx }): Promise<MemoryActionResult<readonly MemoryThread[]>> => {
    const user = (ctx as { user: SessionUser }).user;
    return listUserMemoryThreads(user.id);
  }
);

export const createUserMemoryAction = userActionClient
  .inputSchema(createMemorySchema)
  .action(
    async ({
      parsedInput,
      ctx,
    }): Promise<
      MemoryActionResult<{ threadId: string; messageId: string }>
    > => {
      const user = (ctx as { user: SessionUser }).user;

      return createMemoryThread({
        resourceId: user.id,
        content: parsedInput.content.trim(),
      });
    }
  );

export const confirmUserMemoryAction = userActionClient
  .inputSchema(threadIdSchema)
  .action(
    async ({
      parsedInput,
      ctx,
    }): Promise<MemoryActionResult<{ threadId: string }>> => {
      const user = (ctx as { user: SessionUser }).user;
      return confirmMemoryThread(parsedInput.threadId, user.id);
    }
  );

export const disableUserMemoryAction = userActionClient
  .inputSchema(threadIdSchema)
  .action(
    async ({
      parsedInput,
      ctx,
    }): Promise<MemoryActionResult<{ threadId: string }>> => {
      const user = (ctx as { user: SessionUser }).user;
      return disableMemoryThread(parsedInput.threadId, user.id);
    }
  );

export const deleteUserMemoryAction = userActionClient
  .inputSchema(threadIdSchema)
  .action(
    async ({
      parsedInput,
      ctx,
    }): Promise<MemoryActionResult<{ threadId: string }>> => {
      const user = (ctx as { user: SessionUser }).user;
      return deleteMemoryThread(parsedInput.threadId, user.id);
    }
  );

export const getUserMemoryContentAction = userActionClient
  .inputSchema(threadIdSchema)
  .action(
    async ({
      parsedInput,
      ctx,
    }): Promise<
      MemoryActionResult<{
        content: string;
        confirmed: boolean;
        disabled: boolean;
      }>
    > => {
      const user = (ctx as { user: SessionUser }).user;
      return getMemoryThreadContent(parsedInput.threadId, user.id);
    }
  );
