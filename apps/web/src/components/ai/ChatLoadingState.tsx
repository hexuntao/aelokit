'use client';

import { Bot, Loader2 } from 'lucide-react';

export function ChatLoadingState() {
  return (
    <div className="flex w-full gap-4 px-4 py-6 max-w-4xl mx-auto">
      <div className="flex h-8 w-8 shrink-0 select-none items-center justify-center rounded-md border bg-background">
        <Bot className="h-4 w-4" />
      </div>
      <div className="flex flex-col gap-2">
        <div className="rounded-2xl px-4 py-3 text-sm bg-muted">
          <div className="flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            <span className="text-muted-foreground">Thinking...</span>
          </div>
        </div>
      </div>
    </div>
  );
}
