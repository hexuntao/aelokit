'use client';

import * as React from 'react';
import { Brain, Plus, Trash2, Power, Check, X, Loader2 } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

export interface MemoryItem {
  readonly id: string;
  readonly title?: string;
  readonly createdAt: Date;
  readonly confirmed?: boolean;
  readonly disabled?: boolean;
}

export interface MemoryControlsProps {
  readonly memoryEnabled: boolean;
  readonly onMemoryEnabledChange: (enabled: boolean) => void;
  readonly memories: readonly MemoryItem[];
  readonly onCreateMemory: (content: string) => Promise<boolean>;
  readonly onConfirmMemory: (threadId: string) => Promise<boolean>;
  readonly onDisableMemory: (threadId: string) => Promise<boolean>;
  readonly onDeleteMemory: (threadId: string) => Promise<boolean>;
  readonly isLoading?: boolean;
  readonly className?: string;
}

export function MemoryControlsPanel({
  memoryEnabled,
  onMemoryEnabledChange,
  memories,
  onCreateMemory,
  onConfirmMemory,
  onDisableMemory,
  onDeleteMemory,
  isLoading = false,
  className,
}: MemoryControlsProps) {
  const [showCreateDialog, setShowCreateDialog] = React.useState(false);
  const [newMemoryContent, setNewMemoryContent] = React.useState('');
  const [actionInProgress, setActionInProgress] = React.useState<string | null>(
    null
  );

  const handleCreateMemory = async () => {
    if (!newMemoryContent.trim()) return;

    setActionInProgress('create');
    const success = await onCreateMemory(newMemoryContent.trim());
    setActionInProgress(null);

    if (success) {
      setNewMemoryContent('');
      setShowCreateDialog(false);
    }
  };

  const handleConfirmMemory = async (threadId: string) => {
    setActionInProgress(`confirm-${threadId}`);
    await onConfirmMemory(threadId);
    setActionInProgress(null);
  };

  const handleDisableMemory = async (threadId: string) => {
    setActionInProgress(`disable-${threadId}`);
    await onDisableMemory(threadId);
    setActionInProgress(null);
  };

  const handleDeleteMemory = async (threadId: string) => {
    setActionInProgress(`delete-${threadId}`);
    await onDeleteMemory(threadId);
    setActionInProgress(null);
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  return (
    <div className={cn('flex flex-col gap-4', className)}>
      <div className="flex items-center justify-between rounded-lg border bg-muted/30 p-3">
        <div className="flex items-center gap-2">
          <Brain className="size-4 text-muted-foreground" />
          <Label
            htmlFor="memory-toggle"
            className="text-sm font-medium cursor-pointer"
          >
            Memory
          </Label>
        </div>
        <Switch
          id="memory-toggle"
          checked={memoryEnabled}
          onCheckedChange={onMemoryEnabledChange}
          disabled={isLoading}
          size="sm"
        />
      </div>

      {memoryEnabled && (
        <>
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">
              {memories.length} memory draft{memories.length !== 1 ? 's' : ''}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowCreateDialog(true)}
              disabled={isLoading}
              className="h-7 text-xs"
            >
              <Plus className="size-3 mr-1" />
              Add Memory
            </Button>
          </div>

          <ScrollArea className="flex-1 max-h-[300px]">
            {memories.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-6 text-center">
                <Brain className="size-8 text-muted-foreground/50 mb-2" />
                <p className="text-sm text-muted-foreground">No memories yet</p>
                <p className="text-xs text-muted-foreground/70 mt-1">
                  Create a pending draft, then confirm it to make it active
                </p>
              </div>
            ) : (
              <div className="flex flex-col gap-2 pr-2">
                {memories.map((memory) => (
                  <div
                    key={memory.id}
                    className={cn(
                      'rounded-lg border p-2 transition-colors',
                      memory.disabled ? 'bg-muted/20 opacity-60' : 'bg-card'
                    )}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {memory.title || 'Untitled Memory'}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatDate(memory.createdAt)}
                        </p>
                      </div>
                      <div className="flex items-center gap-1">
                        {memory.confirmed && (
                          <span className="flex items-center gap-0.5 text-xs text-green-600">
                            <Check className="size-3" />
                            Confirmed
                          </span>
                        )}
                        {!memory.confirmed && (
                          <span className="flex items-center gap-0.5 text-xs text-muted-foreground">
                            <Loader2 className="size-3" />
                            Pending
                          </span>
                        )}
                        {memory.disabled && (
                          <span className="flex items-center gap-0.5 text-xs text-orange-600">
                            <Power className="size-3" />
                            Disabled
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1 mt-2">
                      {!memory.confirmed && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleConfirmMemory(memory.id)}
                          disabled={actionInProgress !== null}
                          className="h-6 text-xs text-green-600 hover:text-green-700 hover:bg-green-50"
                        >
                          {actionInProgress === `confirm-${memory.id}` ? (
                            <Loader2 className="size-3 animate-spin" />
                          ) : (
                            <Check className="size-3" />
                          )}
                          Confirm
                        </Button>
                      )}
                      {memory.confirmed &&
                        (memory.disabled ? (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDisableMemory(memory.id)}
                            disabled={actionInProgress !== null}
                            className="h-6 text-xs"
                          >
                            {actionInProgress === `disable-${memory.id}` ? (
                              <Loader2 className="size-3 animate-spin" />
                            ) : (
                              <Power className="size-3" />
                            )}
                            Enable
                          </Button>
                        ) : (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDisableMemory(memory.id)}
                            disabled={actionInProgress !== null}
                            className="h-6 text-xs text-orange-600 hover:text-orange-700 hover:bg-orange-50"
                          >
                            {actionInProgress === `disable-${memory.id}` ? (
                              <Loader2 className="size-3 animate-spin" />
                            ) : (
                              <X className="size-3" />
                            )}
                            Disable
                          </Button>
                        ))}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteMemory(memory.id)}
                        disabled={actionInProgress !== null}
                        className="h-6 text-xs text-destructive hover:text-destructive hover:bg-destructive/10"
                      >
                        {actionInProgress === `delete-${memory.id}` ? (
                          <Loader2 className="size-3 animate-spin" />
                        ) : (
                          <Trash2 className="size-3" />
                        )}
                        Delete
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </>
      )}

      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Brain className="size-5" />
              Create New Memory
            </DialogTitle>
            <DialogDescription>
              Create a pending draft. It is not written to durable AI memory
              until you confirm it.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-4">
            <Textarea
              placeholder="e.g., My name is Alex and I prefer TypeScript over JavaScript..."
              value={newMemoryContent}
              onChange={(e) => setNewMemoryContent(e.target.value)}
              rows={4}
              className="resize-none"
            />
            <p className="text-xs text-muted-foreground">
              Pending drafts are only visible to you and are ignored by chat
              recall until confirmed.
            </p>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowCreateDialog(false)}
              disabled={actionInProgress !== null}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateMemory}
              disabled={!newMemoryContent.trim() || actionInProgress !== null}
            >
              {actionInProgress === 'create' ? (
                <>
                  <Loader2 className="size-4 animate-spin mr-2" />
                  Creating Draft...
                </>
              ) : (
                <>
                  <Plus className="size-4 mr-2" />
                  Create Draft
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
