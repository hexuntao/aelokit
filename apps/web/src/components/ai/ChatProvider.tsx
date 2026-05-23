'use client';

import { AssistantRuntimeProvider } from '@assistant-ui/react';
import {
  AssistantChatTransport,
  useChatRuntime,
} from '@assistant-ui/react-ai-sdk';
import { usePathname, useRouter } from 'next/navigation';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  getUserChatThreadStateAction,
  getUserChatThreadsAction,
} from '@/actions/chat-threads';
import type { ChatErrorType } from './ChatErrorState';
import { parseErrorType, getErrorMetadata } from './ChatErrorState';
import { getThreadInsights } from './thread-insights';
import type {
  ChatThreadSummary,
  ChatUIMessage,
  CitationMetadata,
} from './types';

const API_URL = '/api/ai/chat';

const AVAILABLE_MODELS = [
  { id: 'gpt-5.5', name: 'GPT-5.5' },
  { id: 'gpt-4.1-mini', name: 'GPT-4.1 Mini' },
  { id: 'gpt-4.1', name: 'GPT-4.1' },
  { id: 'gpt-4o-mini', name: 'GPT-4o Mini' },
  { id: 'gpt-4o', name: 'GPT-4o' },
];

interface ChatError extends Error {
  code?: string;
  metadata?: Record<string, unknown>;
}

interface ChatProviderProps {
  readonly children: React.ReactNode;
  readonly initialThreads?: readonly ChatThreadSummary[];
  readonly initialThreadId?: string;
  readonly initialMessages?: readonly ChatUIMessage[];
}

interface ChatContextType {
  error: Error | null;
  errorType: ChatErrorType;
  errorMetadata: Record<string, unknown>;
  selectedModelId: string;
  setSelectedModelId: (modelId: string) => void;
  clearError: () => void;
  threadId?: string;
  memoryEnabled: boolean;
  setMemoryEnabled: (enabled: boolean) => void;
  lastCitations: readonly CitationMetadata[];
  knowledgeEnabled: boolean;
  setKnowledgeEnabled: (enabled: boolean) => void;
  lastKnowledgeActive: boolean;
  threads: readonly ChatThreadSummary[];
  isThreadListLoading: boolean;
  isThreadLoading: boolean;
  startNewThread: () => void;
  openThread: (threadId: string) => Promise<void>;
  refreshThreads: () => Promise<void>;
}

const ChatContext = createContext<ChatContextType | null>(null);

const MEMORY_ENABLED_KEY = 'aelokit-memory-enabled';
const KNOWLEDGE_ENABLED_KEY = 'aelokit-knowledge-enabled';

function upsertThreadSummary(
  threads: readonly ChatThreadSummary[],
  thread: ChatThreadSummary
): readonly ChatThreadSummary[] {
  const nextThreads = [
    thread,
    ...threads.filter((candidate) => candidate.id !== thread.id),
  ];

  return nextThreads.sort(
    (left, right) =>
      new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime()
  );
}

export function useChatContext() {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChatContext must be used within a ChatProvider');
  }
  return context;
}

export function ChatProvider({
  children,
  initialThreads = [],
  initialThreadId,
  initialMessages = [],
}: ChatProviderProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [error, setError] = useState<Error | null>(null);
  const [errorType, setErrorType] = useState<ChatErrorType>('unknown');
  const [errorMetadata, setErrorMetadata] = useState<Record<string, unknown>>(
    {}
  );
  const [selectedModelId, setSelectedModelId] = useState<string>('gpt-5.5');
  const [threadId, setThreadId] = useState<string | undefined>(initialThreadId);
  const [memoryEnabled, setMemoryEnabledState] = useState<boolean>(false);
  const [lastCitations, setLastCitations] = useState<
    readonly CitationMetadata[]
  >([]);
  const [knowledgeEnabled, setKnowledgeEnabled] = useState<boolean>(false);
  const [lastKnowledgeActive, setLastKnowledgeActive] =
    useState<boolean>(false);
  const [threads, setThreads] =
    useState<readonly ChatThreadSummary[]>(initialThreads);
  const [isThreadListLoading, setIsThreadListLoading] = useState(false);
  const [isThreadLoading, setIsThreadLoading] = useState(false);
  const threadIdRef = useRef<string | undefined>(initialThreadId);
  const selectedModelIdRef = useRef(selectedModelId);
  const memoryEnabledRef = useRef(memoryEnabled);
  const knowledgeEnabledRef = useRef(knowledgeEnabled);
  const hydratedInitialThreadRef = useRef(false);

  const syncThreadUrl = useCallback(
    (nextThreadId?: string) => {
      const params = new URLSearchParams(window.location.search);

      if (nextThreadId) {
        params.set('thread', nextThreadId);
      } else {
        params.delete('thread');
      }

      const query = params.toString();
      router.replace(query ? `${pathname}?${query}` : pathname, {
        scroll: false,
      });
    },
    [pathname, router]
  );

  useEffect(() => {
    try {
      const stored = localStorage.getItem(MEMORY_ENABLED_KEY);
      if (stored === 'true') {
        setMemoryEnabledState(true);
      }
      const storedKnowledge = localStorage.getItem(KNOWLEDGE_ENABLED_KEY);
      if (storedKnowledge === 'true') {
        setKnowledgeEnabled(true);
      }
    } catch {
      // Ignore localStorage errors
    }
  }, []);

  const setMemoryEnabled = useCallback((enabled: boolean) => {
    setMemoryEnabledState(enabled);
    try {
      localStorage.setItem(MEMORY_ENABLED_KEY, String(enabled));
    } catch {
      // Ignore localStorage errors
    }
  }, []);

  const setKnowledgeEnabledPreference = useCallback((enabled: boolean) => {
    setKnowledgeEnabled(enabled);
    if (!enabled) {
      setLastKnowledgeActive(false);
      setLastCitations([]);
    }
    try {
      localStorage.setItem(KNOWLEDGE_ENABLED_KEY, String(enabled));
    } catch {
      // Ignore localStorage errors
    }
  }, []);

  threadIdRef.current = threadId;
  selectedModelIdRef.current = selectedModelId;
  memoryEnabledRef.current = memoryEnabled;
  knowledgeEnabledRef.current = knowledgeEnabled;

  const clearError = useCallback(() => {
    setError(null);
    setErrorType('unknown');
    setErrorMetadata({});
  }, []);

  const transport = useMemo(
    () =>
      new AssistantChatTransport<ChatUIMessage>({
        api: API_URL,
        prepareSendMessagesRequest: ({ messages, body }) => ({
          body: {
            ...body,
            messages,
            threadId: threadIdRef.current,
            modelId: selectedModelIdRef.current || undefined,
            memoryEnabled: memoryEnabledRef.current,
            knowledgeEnabled: knowledgeEnabledRef.current,
          },
        }),
      }),
    []
  );

  const refreshThreads = useCallback(async () => {
    setIsThreadListLoading(true);

    try {
      const result = await getUserChatThreadsAction();

      if (result.data?.success) {
        setThreads(result.data.data);
        return;
      }

      const message =
        result.data?.error?.message ?? 'Failed to load chat threads.';
      setError(new Error(message));
      setErrorType('unknown');
      setErrorMetadata({});
    } catch (refreshError) {
      const message =
        refreshError instanceof Error
          ? refreshError.message
          : 'Failed to load chat threads.';
      setError(new Error(message));
      setErrorType('unknown');
      setErrorMetadata({});
    } finally {
      setIsThreadListLoading(false);
    }
  }, []);

  const runtime = useChatRuntime<ChatUIMessage>({
    transport,
    onFinish: ({ message }) => {
      const responseThreadId = message.metadata?.threadId;
      if (responseThreadId) {
        setThreadId(responseThreadId);
        threadIdRef.current = responseThreadId;
        syncThreadUrl(responseThreadId);
        void refreshThreads();
      }

      const citations = message.metadata?.citations;
      if (citations && Array.isArray(citations)) {
        setLastCitations(citations);
      } else {
        setLastCitations([]);
      }

      const knowledgeEnabledMeta = message.metadata?.knowledgeEnabled;
      setLastKnowledgeActive(knowledgeEnabledMeta === true);
    },
    onError: (runtimeError) => {
      const chatError = runtimeError as ChatError;
      setError(chatError);
      setErrorType(parseErrorType(chatError));
      setErrorMetadata(getErrorMetadata(chatError));
    },
  });

  const startNewThread = useCallback(() => {
    clearError();
    setThreadId(undefined);
    threadIdRef.current = undefined;
    runtime.thread.reset();
    void runtime.thread.composer.reset();
    setLastCitations([]);
    setLastKnowledgeActive(false);
    syncThreadUrl(undefined);
  }, [clearError, runtime, syncThreadUrl]);

  const openThread = useCallback(
    async (nextThreadId: string) => {
      if (!nextThreadId || nextThreadId === threadIdRef.current) {
        return;
      }

      setIsThreadLoading(true);
      clearError();

      try {
        const result = await getUserChatThreadStateAction({
          threadId: nextThreadId,
        });

        if (!result.data?.success) {
          throw new Error(
            result.data?.error?.message ?? 'Failed to load chat thread.'
          );
        }

        const threadState = result.data.data;
        setThreadId(threadState.thread.id);
        threadIdRef.current = threadState.thread.id;
        setThreads((currentThreads) =>
          upsertThreadSummary(currentThreads, threadState.thread)
        );
        runtime.thread.reset();
        void runtime.thread.composer.reset();
        runtime.thread.importExternalState(threadState.messages);

        const insights = getThreadInsights(threadState.messages);
        setLastCitations(insights.citations);
        setLastKnowledgeActive(insights.knowledgeActive);
        syncThreadUrl(threadState.thread.id);
      } catch (loadError) {
        const message =
          loadError instanceof Error
            ? loadError.message
            : 'Failed to load chat thread.';
        setError(new Error(message));
        setErrorType('unknown');
        setErrorMetadata({});
      } finally {
        setIsThreadLoading(false);
      }
    },
    [clearError, runtime, syncThreadUrl]
  );

  useEffect(() => {
    if (hydratedInitialThreadRef.current) {
      return;
    }

    hydratedInitialThreadRef.current = true;

    if (initialThreadId) {
      runtime.thread.reset();
      void runtime.thread.composer.reset();
      runtime.thread.importExternalState(initialMessages);
      const insights = getThreadInsights(initialMessages);
      setLastCitations(insights.citations);
      setLastKnowledgeActive(insights.knowledgeActive);
      return;
    }

    runtime.thread.reset();
    void runtime.thread.composer.reset();
  }, [initialMessages, initialThreadId, runtime]);

  return (
    <AssistantRuntimeProvider runtime={runtime}>
      <ChatContext.Provider
        value={{
          error,
          errorType,
          errorMetadata,
          selectedModelId,
          setSelectedModelId,
          clearError,
          threadId,
          memoryEnabled,
          setMemoryEnabled,
          lastCitations,
          knowledgeEnabled,
          setKnowledgeEnabled: setKnowledgeEnabledPreference,
          lastKnowledgeActive,
          threads,
          isThreadListLoading,
          isThreadLoading,
          startNewThread,
          openThread,
          refreshThreads,
        }}
      >
        {children}
      </ChatContext.Provider>
    </AssistantRuntimeProvider>
  );
}

export { AVAILABLE_MODELS };
