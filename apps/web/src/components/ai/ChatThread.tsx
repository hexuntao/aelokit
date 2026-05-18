'use client';

import { useChatContext } from './ChatProvider';
import { ChatMessage } from './ChatMessage';
import { ChatEmptyState } from './ChatEmptyState';
import { ChatLoadingState } from './ChatLoadingState';
import { useEffect, useRef } from 'react';

export function ChatThread() {
  const { messages, isLoading } = useChatContext();
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  return (
    <div ref={scrollRef} className="flex-1 overflow-y-auto">
      {messages.length === 0 ? (
        <ChatEmptyState />
      ) : (
        <div className="py-4">
          {messages.map((message) => (
            <ChatMessage key={message.id} message={message} />
          ))}
          {isLoading && <ChatLoadingState />}
        </div>
      )}
    </div>
  );
}
