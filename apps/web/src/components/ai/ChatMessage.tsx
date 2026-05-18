'use client';

import type { Message } from './types';
import { User, Bot } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ChatMessageProps {
  message: Message;
}

export function ChatMessage({ message }: ChatMessageProps) {
  return (
    <div
      className={cn(
        'flex w-full gap-4 px-4 py-6 max-w-4xl mx-auto',
        message.role === 'user' ? 'justify-end' : 'justify-start'
      )}
    >
      {message.role === 'assistant' && (
        <div className="flex h-8 w-8 shrink-0 select-none items-center justify-center rounded-md border bg-background">
          <Bot className="h-4 w-4" />
        </div>
      )}
      <div
        className={cn(
          'flex flex-col gap-2 max-w-[80%]',
          message.role === 'user' && 'items-end'
        )}
      >
        <div
          className={cn(
            'rounded-2xl px-4 py-3 text-sm',
            message.role === 'user'
              ? 'bg-primary text-primary-foreground'
              : 'bg-muted'
          )}
        >
          <div className="whitespace-pre-wrap">{message.content}</div>
        </div>
      </div>
      {message.role === 'user' && (
        <div className="flex h-8 w-8 shrink-0 select-none items-center justify-center rounded-md border bg-background">
          <User className="h-4 w-4" />
        </div>
      )}
    </div>
  );
}
