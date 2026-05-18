'use client';

import { useChatContext } from './ChatProvider';
import { Send, StopCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

export function ChatComposer() {
  const { input, setInput, handleSubmit, isLoading, stop } = useChatContext();

  return (
    <div className="border-t border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="max-w-4xl mx-auto p-4">
        <form
          onSubmit={handleSubmit}
          className="flex flex-col gap-3 w-full max-w-4xl mx-auto"
        >
          <div className="relative">
            <Textarea
              placeholder="Type a message..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit();
                }
              }}
              className="min-h-[80px] resize-none border-2 focus:border-primary rounded-xl pr-12 py-4"
              disabled={isLoading}
            />
            <div className="absolute bottom-3 right-3">
              {isLoading ? (
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  onClick={stop}
                >
                  <StopCircle className="h-4 w-4" />
                </Button>
              ) : (
                <Button
                  type="submit"
                  size="icon"
                  disabled={!input.trim()}
                  className="bg-primary hover:bg-primary/90"
                >
                  <Send className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </form>
        <p className="text-xs text-muted-foreground text-center mt-2">
          AI responses are generated based on the information provided and may
          not always be accurate.
        </p>
      </div>
    </div>
  );
}
