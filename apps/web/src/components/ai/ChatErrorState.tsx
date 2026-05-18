'use client';

import { AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useChatContext } from './ChatProvider';

interface ChatErrorStateProps {
  error?: Error;
}

export function ChatErrorState({ error }: ChatErrorStateProps) {
  const { messages, setInput } = useChatContext();

  return (
    <div className="border-t border-border">
      <div className="flex w-full gap-4 px-4 py-4 max-w-4xl mx-auto">
        <div className="flex h-8 w-8 shrink-0 select-none items-center justify-center rounded-md border bg-background">
          <AlertCircle className="h-4 w-4 text-destructive" />
        </div>
        <div className="flex flex-col gap-3 max-w-[80%]">
          <div className="rounded-2xl px-4 py-3 text-sm bg-destructive/10 text-destructive border border-destructive/20">
            <div className="font-medium mb-1">Sorry, something went wrong</div>
            <div className="text-sm opacity-80">
              {error?.message ||
                'An error occurred while processing your request. Please try again.'}
            </div>
          </div>
          {messages.length > 0 && (
            <div className="flex gap-2">
              <Button
                variant="secondary"
                size="sm"
                className="w-fit"
                onClick={() => {
                  const lastUserMessage = [...messages]
                    .reverse()
                    .find((m) => m.role === 'user');
                  if (lastUserMessage) {
                    setInput(lastUserMessage.content);
                  }
                }}
              >
                Try again
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
