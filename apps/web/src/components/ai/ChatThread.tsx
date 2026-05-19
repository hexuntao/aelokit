'use client';

import { ThreadPrimitive, useThread } from '@assistant-ui/react';
import { ChatMessage } from './ChatMessage';
import { ChatEmptyState } from './ChatEmptyState';
import { ChatLoadingState } from './ChatLoadingState';

export function ChatThread() {
  const isWaitingForAssistant = useThread((thread) => {
    const lastMessage = thread.messages.at(-1);
    return thread.isRunning && lastMessage?.role === 'user';
  });

  return (
    <ThreadPrimitive.Root className="flex min-h-0 flex-1 flex-col">
      <ThreadPrimitive.Viewport autoScroll className="flex-1 overflow-y-auto">
        <ThreadPrimitive.Empty>
          <ChatEmptyState />
        </ThreadPrimitive.Empty>
        <div className="py-4">
          <ThreadPrimitive.Messages>
            {({ message }) => (
              <ChatMessage key={message.id} message={message} />
            )}
          </ThreadPrimitive.Messages>
          {isWaitingForAssistant && <ChatLoadingState />}
        </div>
      </ThreadPrimitive.Viewport>
    </ThreadPrimitive.Root>
  );
}
