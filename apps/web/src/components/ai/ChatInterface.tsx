'use client';

import { ChatProvider } from './ChatProvider';
import { ChatThread } from './ChatThread';
import { ChatThreadSidebar } from './ChatThreadSidebar';
import { ChatComposer } from './ChatComposer';
import { ChatErrorState } from './ChatErrorState';
import { useChatContext } from './ChatProvider';
import { MemorySidebar, MemoryToggleButton } from './MemorySidebar';
import { CitationList, CitationSummary } from './CitationList';
import { Button } from '@/components/ui/button';
import { BookOpen } from 'lucide-react';
import type {
  ChatModelOption,
  ChatThreadSummary,
  ChatUIMessage,
} from './types';

function KnowledgeToggleButton() {
  const { knowledgeEnabled, setKnowledgeEnabled } = useChatContext();

  return (
    <Button
      variant={knowledgeEnabled ? 'default' : 'outline'}
      size="sm"
      onClick={() => setKnowledgeEnabled(!knowledgeEnabled)}
      className="gap-1.5"
    >
      <BookOpen className="size-4" />
      {knowledgeEnabled ? 'Knowledge On' : 'Knowledge Off'}
    </Button>
  );
}

function ChatContent() {
  const {
    error,
    errorType,
    errorMetadata,
    lastCitations,
    lastKnowledgeActive,
    isThreadLoading,
  } = useChatContext();

  return (
    <div className="flex min-h-0 flex-1 flex-col md:flex-row">
      <div className="shrink-0 border-b md:border-r md:border-b-0">
        <ChatThreadSidebar />
      </div>

      <div className="flex min-h-0 flex-1 flex-col">
        <div className="flex items-center justify-between border-b px-4 py-2">
          <div className="flex items-center gap-2">
            <MemoryToggleButton />
            <KnowledgeToggleButton />
          </div>
          <div className="flex items-center gap-3">
            {isThreadLoading && (
              <span className="text-xs text-muted-foreground">Loading...</span>
            )}
            {lastCitations.length > 0 && (
              <CitationSummary citations={lastCitations} />
            )}
            <MemorySidebar />
          </div>
        </div>
        <ChatThread />
        {lastKnowledgeActive && lastCitations.length > 0 && (
          <div className="border-t bg-muted/30 px-4 py-3">
            <CitationList citations={lastCitations} />
          </div>
        )}
        {error && (
          <ChatErrorState
            error={error}
            errorType={errorType}
            metadata={errorMetadata}
          />
        )}
        <ChatComposer />
      </div>
    </div>
  );
}

interface ChatInterfaceProps {
  readonly initialThreads?: readonly ChatThreadSummary[];
  readonly initialThreadId?: string;
  readonly initialMessages?: readonly ChatUIMessage[];
  readonly initialModelOptions?: readonly ChatModelOption[];
  readonly initialUserDefaultModelId?: string;
  readonly initialSystemDefaultModelId?: string;
  readonly initialSelectedModelId?: string;
}

export function ChatInterface({
  initialThreads,
  initialThreadId,
  initialMessages,
  initialModelOptions,
  initialUserDefaultModelId,
  initialSystemDefaultModelId,
  initialSelectedModelId,
}: ChatInterfaceProps) {
  return (
    <ChatProvider
      initialThreads={initialThreads}
      initialThreadId={initialThreadId}
      initialMessages={initialMessages}
      initialModelOptions={initialModelOptions}
      initialUserDefaultModelId={initialUserDefaultModelId}
      initialSystemDefaultModelId={initialSystemDefaultModelId}
      initialSelectedModelId={initialSelectedModelId}
    >
      <div className="flex h-[calc(100vh-8rem)] min-h-[36rem] overflow-hidden rounded-lg border bg-background md:h-[calc(100vh-6rem)]">
        <ChatContent />
      </div>
    </ChatProvider>
  );
}
