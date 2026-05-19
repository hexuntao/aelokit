'use client';

import { ChatProvider } from './ChatProvider';
import { ChatThread } from './ChatThread';
import { ChatComposer } from './ChatComposer';
import { ChatErrorState } from './ChatErrorState';
import { useChatContext } from './ChatProvider';
import { MemorySidebar, MemoryToggleButton } from './MemorySidebar';

function ChatContent() {
  const { error, errorType, errorMetadata, memoryEnabled } = useChatContext();

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] md:h-[calc(100vh-6rem)]">
      <div className="flex items-center justify-between px-4 py-2 border-b">
        <div className="flex items-center gap-2">
          <MemoryToggleButton />
        </div>
        <MemorySidebar />
      </div>
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
