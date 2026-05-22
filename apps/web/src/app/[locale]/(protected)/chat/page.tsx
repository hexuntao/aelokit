import { getMessages, getThread, listThreads } from '@/ai/persistence';
import type { ChatThreadSummary, ChatUIMessage } from '@/components/ai';
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
}): ChatThreadSummary {
  return {
    id: thread.id,
    title: thread.title,
    status: thread.status,
    createdAt: thread.createdAt.toISOString(),
    updatedAt: thread.updatedAt.toISOString(),
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

  if (session?.user?.id) {
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
          />
        </div>
      </div>
    </div>
  );
}
