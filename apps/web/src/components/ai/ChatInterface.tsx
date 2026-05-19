'use client';

import { ChatProvider } from './ChatProvider';
import { ChatThread } from './ChatThread';
import { ChatComposer } from './ChatComposer';
import { ChatErrorState } from './ChatErrorState';
import { useChatContext } from './ChatProvider';

function ChatContent() {
  const { error, errorType, errorMetadata } = useChatContext();

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] md:h-[calc(100vh-6rem)]">
      <ChatThread />
      {error && (
        <ChatErrorState
          error={error}
          errorType={errorType}
          metadata={errorMetadata}
        />
      )}
      <ChatComposer />
    </div>
  );
}

export function ChatInterface() {
  return (
    <ChatProvider>
      <ChatContent />
    </ChatProvider>
  );
}
