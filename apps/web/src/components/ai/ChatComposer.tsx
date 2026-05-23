'use client';

import { toast } from 'sonner';
import {
  useComposer,
  useComposerRuntime,
  useThread,
  useThreadRuntime,
} from '@assistant-ui/react';
import { useChatContext } from './ChatProvider';
import { Send, StopCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export function ChatComposer() {
  const {
    availableModels,
    selectedModelId,
    setSelectedModelId,
    userDefaultModelId,
    isSavingUserDefaultModel,
    saveUserDefaultModel,
    clearError,
  } = useChatContext();
  const composerRuntime = useComposerRuntime();
  const threadRuntime = useThreadRuntime();
  const input = useComposer((composer) => composer.text);
  const canSend = useComposer((composer) => composer.canSend);
  const isLoading = useThread((thread) => thread.isRunning);
  const selectedModel = availableModels.find(
    (model) => model.modelId === selectedModelId
  );
  const userDefaultModel = availableModels.find(
    (model) => model.modelId === userDefaultModelId
  );

  const handleSubmit = (event?: React.FormEvent) => {
    event?.preventDefault();
    if (!canSend || isLoading) {
      return;
    }
    clearError();
    composerRuntime.send();
  };

  const handleSaveDefaultModel = async () => {
    const result = await saveUserDefaultModel();

    if (!result.success) {
      toast.error(result.error);
      return;
    }

    toast.success('Default model saved.');
  };

  return (
    <div className="border-t border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="max-w-4xl mx-auto p-4">
        <form
          onSubmit={handleSubmit}
          className="flex flex-col gap-3 w-full max-w-4xl mx-auto"
        >
          <div className="flex items-center gap-2">
            <Select
              value={selectedModelId}
              onValueChange={setSelectedModelId}
              disabled={isLoading}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select a model" />
              </SelectTrigger>
              <SelectContent>
                {availableModels.map((model) => (
                  <SelectItem key={model.modelId} value={model.modelId}>
                    {model.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => void handleSaveDefaultModel()}
              disabled={
                isLoading ||
                isSavingUserDefaultModel ||
                !selectedModelId ||
                selectedModelId === userDefaultModelId
              }
            >
              {selectedModelId === userDefaultModelId
                ? 'Default Model'
                : isSavingUserDefaultModel
                  ? 'Saving...'
                  : 'Save as Default'}
            </Button>
            {userDefaultModel && (
              <span className="text-xs text-muted-foreground">
                Default: {userDefaultModel.label}
              </span>
            )}
            {!userDefaultModel && selectedModel && (
              <span className="text-xs text-muted-foreground">
                Current: {selectedModel.label}
              </span>
            )}
          </div>
          <div className="relative">
            <Textarea
              placeholder="Type a message..."
              value={input}
              onChange={(e) => composerRuntime.setText(e.target.value)}
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
                  onClick={() => threadRuntime.cancelRun()}
                >
                  <StopCircle className="h-4 w-4" />
                </Button>
              ) : (
                <Button
                  type="submit"
                  size="icon"
                  disabled={!canSend}
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
