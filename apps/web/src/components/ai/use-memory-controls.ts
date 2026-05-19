'use client';

import * as React from 'react';
import {
  getUserMemoryThreadsAction,
  createUserMemoryAction,
  confirmUserMemoryAction,
  disableUserMemoryAction,
  deleteUserMemoryAction,
  type MemoryThread,
  type MemoryActionResult,
} from '@/actions/memory';

export interface UseMemoryControlsReturn {
  readonly memories: readonly MemoryThread[];
  readonly isLoading: boolean;
  readonly error: string | null;
  readonly refreshMemories: () => Promise<void>;
  readonly createMemory: (content: string) => Promise<boolean>;
  readonly confirmMemory: (threadId: string) => Promise<boolean>;
  readonly disableMemory: (threadId: string) => Promise<boolean>;
  readonly deleteMemory: (threadId: string) => Promise<boolean>;
}

export function useMemoryControls(
  memoryEnabled: boolean
): UseMemoryControlsReturn {
  const [memories, setMemories] = React.useState<readonly MemoryThread[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const refreshMemories = React.useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await getUserMemoryThreadsAction();

      if (result.data?.success && result.data.data) {
        setMemories(result.data.data);
      } else if (result.data?.error) {
        setError(result.data.error.message);
      } else {
        setError('Failed to load memories');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load memories');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const createMemory = React.useCallback(
    async (content: string): Promise<boolean> => {
      setIsLoading(true);
      setError(null);

      try {
        const result = await createUserMemoryAction({ content });

        if (result.data?.success) {
          await refreshMemories();
          return true;
        }

        setError(result.data?.error?.message ?? 'Failed to create memory');
        return false;
      } catch (err) {
        setError(
          err instanceof Error ? err.message : 'Failed to create memory'
        );
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    [refreshMemories]
  );

  const confirmMemory = React.useCallback(
    async (threadId: string): Promise<boolean> => {
      setIsLoading(true);
      setError(null);

      try {
        const result = await confirmUserMemoryAction({ threadId });
        console.log('[useMemoryControls] confirmMemory result:', result);

        if (result.data?.success) {
          await refreshMemories();
          return true;
        }

        setError(result.data?.error?.message ?? 'Failed to confirm memory');
        return false;
      } catch (err) {
        console.error('[useMemoryControls] confirmMemory error:', err);
        setError(
          err instanceof Error ? err.message : 'Failed to confirm memory'
        );
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    [refreshMemories]
  );

  const disableMemory = React.useCallback(
    async (threadId: string): Promise<boolean> => {
      setIsLoading(true);
      setError(null);

      try {
        const result = await disableUserMemoryAction({ threadId });

        if (result.data?.success) {
          await refreshMemories();
          return true;
        }

        setError(result.data?.error?.message ?? 'Failed to disable memory');
        return false;
      } catch (err) {
        setError(
          err instanceof Error ? err.message : 'Failed to disable memory'
        );
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    [refreshMemories]
  );

  const deleteMemory = React.useCallback(
    async (threadId: string): Promise<boolean> => {
      setIsLoading(true);
      setError(null);

      try {
        const result = await deleteUserMemoryAction({ threadId });

        if (result.data?.success) {
          await refreshMemories();
          return true;
        }

        setError(result.data?.error?.message ?? 'Failed to delete memory');
        return false;
      } catch (err) {
        setError(
          err instanceof Error ? err.message : 'Failed to delete memory'
        );
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    [refreshMemories]
  );

  React.useEffect(() => {
    if (memoryEnabled) {
      refreshMemories();
    }
  }, [memoryEnabled, refreshMemories]);

  return {
    memories,
    isLoading,
    error,
    refreshMemories,
    createMemory,
    confirmMemory,
    disableMemory,
    deleteMemory,
  };
}
