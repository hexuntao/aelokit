'use client';

import type {
  MessageState,
  ThreadAssistantMessagePart,
} from '@assistant-ui/react';
import { User, Bot, FileText, LinkIcon, Wrench, Brain } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ChatMessageProps {
  message: MessageState;
}

function formatUnknownValue(value: unknown): string {
  if (value === undefined || value === null) {
    return '';
  }

  if (typeof value === 'string') {
    return value;
  }

  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}

function getToolStatusLabel(
  part: Extract<ThreadAssistantMessagePart, { type: 'tool-call' }>
) {
  if (part.isError) {
    return 'error';
  }
  if (part.result !== undefined) {
    return 'complete';
  }
  return 'running';
}

function MessagePart({
  part,
  isAssistantRunning,
}: {
  part: MessageState['content'][number];
  isAssistantRunning: boolean;
}) {
  switch (part.type) {
    case 'text':
      return part.text ? (
        <div className="whitespace-pre-wrap leading-6">{part.text}</div>
      ) : null;
    case 'reasoning':
      return (
        <div className="rounded-md border bg-background/60 px-3 py-2 text-muted-foreground text-xs">
          <div className="mb-1 flex items-center gap-2 font-medium">
            <Brain className="size-3.5" />
            Reasoning
          </div>
          <div className="whitespace-pre-wrap">
            {part.text || 'Thinking...'}
          </div>
        </div>
      );
    case 'tool-call': {
      const status = getToolStatusLabel(part);
      const summary =
        part.result !== undefined
          ? formatUnknownValue(part.result)
          : part.argsText;

      return (
        <div className="rounded-md border bg-background/70 px-3 py-2 text-xs">
          <div className="mb-1 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 font-medium">
              <Wrench className="size-3.5" />
              {part.toolName}
            </div>
            <span className="text-muted-foreground">{status}</span>
          </div>
          {summary ? (
            <pre className="max-h-40 overflow-auto whitespace-pre-wrap rounded bg-muted/60 p-2 font-mono text-[11px]">
              {summary}
            </pre>
          ) : null}
        </div>
      );
    }
    case 'source':
      return (
        <div className="flex items-center gap-2 rounded-md border bg-background/70 px-3 py-2 text-xs">
          <LinkIcon className="size-3.5 text-muted-foreground" />
          {'url' in part && part.url ? (
            <a
              href={part.url}
              target="_blank"
              rel="noreferrer"
              className="truncate underline-offset-4 hover:underline"
            >
              {part.title ?? part.url}
            </a>
          ) : (
            <span className="truncate">{part.title}</span>
          )}
        </div>
      );
    case 'file':
    case 'image':
      return (
        <div className="flex items-center gap-2 rounded-md border bg-background/70 px-3 py-2 text-xs">
          <FileText className="size-3.5 text-muted-foreground" />
          <span className="truncate">
            {'filename' in part && part.filename ? part.filename : part.type}
          </span>
        </div>
      );
    case 'data':
      return (
        <pre className="max-h-40 overflow-auto whitespace-pre-wrap rounded-md border bg-background/70 px-3 py-2 font-mono text-[11px]">
          {formatUnknownValue(part.data)}
        </pre>
      );
    default:
      return isAssistantRunning ? (
        <span className="text-muted-foreground">Loading...</span>
      ) : null;
  }
}

export function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === 'user';
  const isAssistantRunning =
    message.role === 'assistant' && message.status?.type === 'running';
  const visibleParts = message.content;

  return (
    <div
      className={cn(
        'flex w-full gap-4 px-4 py-6 max-w-4xl mx-auto',
        isUser ? 'justify-end' : 'justify-start'
      )}
    >
      {!isUser && (
        <div className="flex h-8 w-8 shrink-0 select-none items-center justify-center rounded-md border bg-background">
          <Bot className="h-4 w-4" />
        </div>
      )}
      <div
        className={cn('flex flex-col gap-2 max-w-[80%]', isUser && 'items-end')}
      >
        <div
          className={cn(
            'rounded-2xl px-4 py-3 text-sm',
            isUser
              ? 'bg-primary text-primary-foreground'
              : 'bg-muted text-foreground'
          )}
        >
          <div className="flex flex-col gap-3">
            {visibleParts.length > 0 ? (
              visibleParts.map((part, index) => (
                <MessagePart
                  // Message part IDs are optional in assistant-ui state.
                  key={`${part.type}-${index}`}
                  part={part}
                  isAssistantRunning={isAssistantRunning}
                />
              ))
            ) : (
              <span className="text-muted-foreground">
                {isAssistantRunning ? 'Loading...' : ''}
              </span>
            )}
          </div>
        </div>
      </div>
      {isUser && (
        <div className="flex h-8 w-8 shrink-0 select-none items-center justify-center rounded-md border bg-background">
          <User className="h-4 w-4" />
        </div>
      )}
    </div>
  );
}
