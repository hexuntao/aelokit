'use client';

import * as React from 'react';
import { Brain } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { MemoryControlsPanel } from './MemoryControlsPanel';
import { useMemoryControls } from './use-memory-controls';
import { useChatContext } from './ChatProvider';
import { cn } from '@/lib/utils';

export interface MemorySidebarProps {
  readonly className?: string;
}

export function MemorySidebar({ className }: MemorySidebarProps) {
  const { memoryEnabled, setMemoryEnabled } = useChatContext();
  const {
    memories,
    isLoading,
    error,
    createMemory,
    confirmMemory,
    disableMemory,
    deleteMemory,
  } = useMemoryControls(memoryEnabled);

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className={cn('gap-1.5', memoryEnabled && 'text-primary', className)}
        >
          <Brain className="size-4" />
          <span className="hidden sm:inline">Memory</span>
          {memoryEnabled && (
            <span className="ml-1 rounded-full bg-primary/10 px-1.5 py-0.5 text-[10px] font-medium text-primary">
              {memories.length}
            </span>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent className="w-[400px] sm:w-[540px]">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Brain className="size-5" />
            Memory Controls
          </SheetTitle>
        </SheetHeader>
        <div className="mt-6 flex flex-col gap-4">
          {error && (
            <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-3">
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}
          <MemoryControlsPanel
            memoryEnabled={memoryEnabled}
            onMemoryEnabledChange={setMemoryEnabled}
            memories={memories.map((m) => ({
              id: m.id,
              title: m.title,
              createdAt: m.createdAt,
              confirmed: m.confirmed,
              disabled: m.disabled,
            }))}
            onCreateMemory={createMemory}
            onConfirmMemory={confirmMemory}
            onDisableMemory={disableMemory}
            onDeleteMemory={deleteMemory}
            isLoading={isLoading}
          />
          <div className="rounded-lg border border-dashed bg-muted/30 p-4">
            <h4 className="text-sm font-medium mb-2">How Memory Works</h4>
            <ul className="text-xs text-muted-foreground space-y-1.5">
              <li className="flex items-start gap-2">
                <span className="text-primary">•</span>
                <span>Toggle memory on/off for this chat session</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary">•</span>
                <span>Create pending memory drafts before durable save</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary">•</span>
                <span>Confirm drafts before chat can recall them</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary">•</span>
                <span>Disable or delete memories you no longer need</span>
              </li>
            </ul>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

export function MemoryToggleButton({ className }: { className?: string }) {
  const { memoryEnabled, setMemoryEnabled } = useChatContext();
  const { memories } = useMemoryControls(memoryEnabled);

  return (
    <Button
      variant={memoryEnabled ? 'default' : 'outline'}
      size="sm"
      onClick={() => setMemoryEnabled(!memoryEnabled)}
      className={cn('gap-1.5', className)}
    >
      <Brain className="size-4" />
      {memoryEnabled ? 'Memory On' : 'Memory Off'}
      {memoryEnabled && memories.length > 0 && (
        <span className="ml-1 rounded-full bg-background/20 px-1.5 py-0.5 text-[10px] font-medium">
          {memories.length}
        </span>
      )}
    </Button>
  );
}
