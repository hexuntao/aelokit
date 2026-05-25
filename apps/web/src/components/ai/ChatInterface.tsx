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
import { Badge } from '@/components/ui/badge';
import { BookOpen, RefreshCw } from 'lucide-react';
import type { AIWorkspaceStatus } from '@/ai/workspace-status-types';
import type {
  ChatAgentOption,
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

function formatNumber(value: number | null | undefined): string {
  return new Intl.NumberFormat('en-US').format(value ?? 0);
}

function formatMoney(value: string | null | undefined): string {
  const amount = Number(value ?? 0);
  if (!Number.isFinite(amount) || amount <= 0) {
    return '$0.00';
  }

  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 4,
  }).format(amount);
}

function ChatWorkspaceStatusBar() {
  const {
    selectedAgentId,
    availableAgents,
    selectedModelId,
    availableModels,
    memoryEnabled,
    knowledgeEnabled,
    workspaceStatus,
    isWorkspaceStatusLoading,
    refreshWorkspaceStatus,
  } = useChatContext();
  const selectedAgent = availableAgents.find(
    (agent) => agent.id === selectedAgentId
  );
  const selectedModel = availableModels.find(
    (model) => model.modelId === selectedModelId
  );

  return (
    <div className="flex flex-wrap items-center gap-2 border-b bg-muted/20 px-4 py-2 text-xs">
      <Badge variant="outline">
        Agent: {selectedAgent?.label || selectedAgentId || 'Default'}
      </Badge>
      <Badge variant="outline">
        Model: {selectedModel?.label || selectedModelId || 'System default'}
      </Badge>
      <Badge variant={memoryEnabled ? 'default' : 'outline'}>
        Memory {memoryEnabled ? 'On' : 'Off'}
      </Badge>
      <Badge variant={knowledgeEnabled ? 'default' : 'outline'}>
        Knowledge {knowledgeEnabled ? 'On' : 'Off'}
      </Badge>
      {workspaceStatus ? (
        <>
          <Badge variant="secondary">
            Credits: {formatNumber(workspaceStatus.credits.balance)}
          </Badge>
          <Badge variant="outline">
            Billing:{' '}
            {workspaceStatus.credits.billingMode === 'credits'
              ? 'Credits'
              : 'Audit-only'}
          </Badge>
          <Badge variant="outline">
            30d Usage: {formatNumber(workspaceStatus.usage.totalRequests)} req /{' '}
            {formatNumber(workspaceStatus.usage.totalTokens)} tokens /{' '}
            {formatMoney(workspaceStatus.usage.estimatedCostUsd)}
          </Badge>
          {workspaceStatus.credits.expiringSoon > 0 ? (
            <Badge variant="outline">
              Expiring soon:{' '}
              {formatNumber(workspaceStatus.credits.expiringSoon)}
            </Badge>
          ) : null}
        </>
      ) : (
        <Badge variant="outline">Usage status unavailable</Badge>
      )}
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => void refreshWorkspaceStatus()}
        disabled={isWorkspaceStatusLoading}
        className="ml-auto h-7 gap-1.5 px-2"
      >
        <RefreshCw
          className={`size-3.5 ${isWorkspaceStatusLoading ? 'animate-spin' : ''}`}
        />
        Refresh
      </Button>
    </div>
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
        <ChatWorkspaceStatusBar />
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
  readonly initialAgentOptions?: readonly ChatAgentOption[];
  readonly initialSelectedAgentId?: string;
  readonly initialModelOptions?: readonly ChatModelOption[];
  readonly initialUserDefaultModelId?: string;
  readonly initialSystemDefaultModelId?: string;
  readonly initialSelectedModelId?: string;
  readonly initialWorkspaceStatus?: AIWorkspaceStatus;
}

export function ChatInterface({
  initialThreads,
  initialThreadId,
  initialMessages,
  initialAgentOptions,
  initialSelectedAgentId,
  initialModelOptions,
  initialUserDefaultModelId,
  initialSystemDefaultModelId,
  initialSelectedModelId,
  initialWorkspaceStatus,
}: ChatInterfaceProps) {
  return (
    <ChatProvider
      initialThreads={initialThreads}
      initialThreadId={initialThreadId}
      initialMessages={initialMessages}
      initialAgentOptions={initialAgentOptions}
      initialSelectedAgentId={initialSelectedAgentId}
      initialModelOptions={initialModelOptions}
      initialUserDefaultModelId={initialUserDefaultModelId}
      initialSystemDefaultModelId={initialSystemDefaultModelId}
      initialSelectedModelId={initialSelectedModelId}
      initialWorkspaceStatus={initialWorkspaceStatus}
    >
      <div className="flex h-[calc(100vh-8rem)] min-h-[36rem] overflow-hidden rounded-lg border bg-background md:h-[calc(100vh-6rem)]">
        <ChatContent />
      </div>
    </ChatProvider>
  );
}
