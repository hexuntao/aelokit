import { getChatModelPreferenceState } from '@/ai/models';
import { getDefaultAgent, getRuntimeSelectableAgentOptions } from '@/ai/agents';
import { getMessages, getThread, listThreads } from '@/ai/persistence';
import { getAIWorkspaceStatus } from '@/ai/workspace-status';
import type { AIWorkspaceStatus } from '@/ai/workspace-status-types';
import type {
  ChatAgentOption,
  ChatModelOption,
  ChatThreadSummary,
  ChatUIMessage,
} from '@/components/ai';
import { ChatInterface } from '@/components/ai';
import { getSession } from '@/lib/server';

export const metadata = {
  title: 'Chat - AeloKit',
};

function serializeThread(thread: {
  readonly id: string;
  readonly title?: string;
  readonly status: 'active' | 'archived' | 'deleted';
  readonly createdAt: Date;
  readonly updatedAt: Date;
  readonly agentId?: string;
  readonly agentName?: string;
  readonly providerId?: string;
  readonly providerName?: string;
  readonly modelId?: string;
  readonly modelName?: string;
}): ChatThreadSummary {
  return {
    id: thread.id,
    title: thread.title,
    status: thread.status,
    createdAt: thread.createdAt.toISOString(),
    updatedAt: thread.updatedAt.toISOString(),
    agentId: thread.agentId,
    agentName: thread.agentName,
    providerId: thread.providerId,
    providerName: thread.providerName,
    modelId: thread.modelId,
    modelName: thread.modelName,
  };
}

interface ChatPageProps {
  readonly searchParams?: Promise<{
    readonly thread?: string | string[];
  }>;
}

export default async function ChatPage({ searchParams }: ChatPageProps) {
  const session = await getSession();
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const requestedThreadId = Array.isArray(resolvedSearchParams?.thread)
    ? resolvedSearchParams?.thread[0]
    : resolvedSearchParams?.thread;

  let initialThreads: readonly ChatThreadSummary[] = [];
  let initialThreadId: string | undefined;
  let initialMessages: readonly ChatUIMessage[] = [];
  let initialAgentOptions: readonly ChatAgentOption[] = [];
  let initialSelectedAgentId: string | undefined;
  let initialModelOptions: readonly ChatModelOption[] = [];
  let initialUserDefaultModelId: string | undefined;
  let initialSystemDefaultModelId = 'gpt-5.5';
  let initialSelectedModelId: string | undefined;
  let initialWorkspaceStatus: AIWorkspaceStatus | undefined;

  if (session?.user?.id) {
    initialAgentOptions = await getRuntimeSelectableAgentOptions();
    initialSelectedAgentId = getDefaultAgent().id;
    const modelPreferences = await getChatModelPreferenceState(session.user.id);
    initialModelOptions = modelPreferences.availableModels;
    initialUserDefaultModelId = modelPreferences.userDefaultModelId;
    initialSystemDefaultModelId = modelPreferences.systemDefaultModelId;
    initialSelectedModelId = modelPreferences.initialSelectedModelId;
    initialWorkspaceStatus = await getAIWorkspaceStatus(session.user.id);

    const threadsResult = await listThreads(session.user.id, {
      status: 'active',
    });

    if (threadsResult.success) {
      initialThreads = (threadsResult.data ?? []).map(serializeThread);
    }

    if (requestedThreadId) {
      const threadResult = await getThread(requestedThreadId, session.user.id);

      if (threadResult.success && threadResult.data) {
        const messagesResult = await getMessages(requestedThreadId);

        if (messagesResult.success) {
          initialThreadId = requestedThreadId;
          initialMessages = messagesResult.data as readonly ChatUIMessage[];
          initialSelectedAgentId =
            threadResult.data.agentId ?? initialSelectedAgentId;
          initialSelectedModelId =
            threadResult.data.modelId ?? initialSelectedModelId;
        }
      }
    }
  }

  return (
    <div className="flex flex-1 flex-col">
      <div className="@container/main flex flex-1 flex-col gap-2">
        <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
          <ChatInterface
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
          />
        </div>
      </div>
    </div>
  );
}
