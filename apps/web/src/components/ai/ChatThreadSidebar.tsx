'use client';

import { useMemo } from 'react';
import { useThread } from '@assistant-ui/react';
import { Plus, RefreshCw, MessageSquareText } from 'lucide-react';
import { formatThreadModelLabel } from '@/ai/models/catalog';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useChatContext } from './ChatProvider';

function formatThreadTimestamp(timestamp: string): string {
  return new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(timestamp));
}

export function ChatThreadSidebar() {
  const {
    threadId,
    threads,
    isThreadListLoading,
    isThreadLoading,
    startNewThread,
    openThread,
    refreshThreads,
  } = useChatContext();
  const isRunning = useThread((thread) => thread.isRunning);

  const orderedThreads = useMemo(
    () =>
      [...threads].sort(
        (left, right) =>
          new Date(right.updatedAt).getTime() -
          new Date(left.updatedAt).getTime()
      ),
    [threads]
  );

  return (
    <aside className="flex h-full w-full flex-col md:w-72 md:min-w-72">
      <div className="border-b px-4 py-3">
        <div className="flex items-center gap-2">
          <Button
            className="flex-1 gap-2"
            onClick={startNewThread}
            disabled={isRunning}
          >
            <Plus className="size-4" />
            New Thread
          </Button>
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={() => void refreshThreads()}
            disabled={isThreadListLoading || isRunning}
          >
            <RefreshCw
              className={cn('size-4', isThreadListLoading && 'animate-spin')}
            />
          </Button>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-2 py-2">
        {orderedThreads.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center px-4 py-8 text-center text-sm text-muted-foreground">
            <MessageSquareText className="mb-3 size-5" />
            <p>No saved threads yet.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-1">
            {orderedThreads.map((thread) => {
              const isActive = thread.id === threadId;
              const modelLabel = formatThreadModelLabel(thread);

              return (
                <button
                  key={thread.id}
                  type="button"
                  onClick={() => void openThread(thread.id)}
                  disabled={isRunning || (isThreadLoading && !isActive)}
                  className={cn(
                    'flex w-full flex-col items-start gap-1 rounded-md px-3 py-2 text-left transition-colors',
                    isActive
                      ? 'bg-accent text-accent-foreground'
                      : 'hover:bg-muted'
                  )}
                >
                  <span className="line-clamp-2 text-sm font-medium">
                    {thread.title?.trim() || 'Untitled thread'}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {formatThreadTimestamp(thread.updatedAt)}
                  </span>
                  {modelLabel && (
                    <span className="text-xs text-muted-foreground">
                      {modelLabel}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </aside>
  );
}
