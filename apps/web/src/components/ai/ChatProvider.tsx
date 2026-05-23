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
import { saveUserDefaultModelAction } from '@/actions/chat-models';
import {
  getUserChatThreadStateAction,
  getUserChatThreadsAction,
} from '@/actions/chat-threads';
import { resolveSelectedModelId } from '@/ai/models/selection';
import type { ChatErrorType } from './ChatErrorState';
import { parseErrorType, getErrorMetadata } from './ChatErrorState';
import { getThreadInsights } from './thread-insights';
import type {
  ChatModelOption,
  ChatThreadSummary,
  ChatUIMessage,
  CitationMetadata,
} from './types';

const API_URL = '/api/ai/chat';

interface ChatError extends Error {
  code?: string;
  metadata?: Record<string, unknown>;
}

interface ChatProviderProps {
  readonly children: React.ReactNode;
  readonly initialThreads?: readonly ChatThreadSummary[];
  readonly initialThreadId?: string;
  readonly initialMessages?: readonly ChatUIMessage[];
  readonly initialModelOptions?: readonly ChatModelOption[];
  readonly initialUserDefaultModelId?: string;
  readonly initialSystemDefaultModelId?: string;
  readonly initialSelectedModelId?: string;
}

interface ChatContextType {
  error: Error | null;
  errorType: ChatErrorType;
  errorMetadata: Record<string, unknown>;
  availableModels: readonly ChatModelOption[];
  selectedModelId: string;
  setSelectedModelId: (modelId: string) => void;
  userDefaultModelId?: string;
  isSavingUserDefaultModel: boolean;
  saveUserDefaultModel: () => Promise<
    | { readonly success: true }
    | { readonly success: false; readonly error: string }
  >;
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
  initialModelOptions = [],
  initialUserDefaultModelId,
  initialSystemDefaultModelId = 'gpt-5.5',
  initialSelectedModelId,
}: ChatProviderProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [error, setError] = useState<Error | null>(null);
  const [errorType, setErrorType] = useState<ChatErrorType>('unknown');
  const [errorMetadata, setErrorMetadata] = useState<Record<string, unknown>>(
    {}
  );
  const [availableModels] =
    useState<readonly ChatModelOption[]>(initialModelOptions);
  const [userDefaultModelId, setUserDefaultModelId] = useState<
    string | undefined
  >(initialUserDefaultModelId);
  const [isSavingUserDefaultModel, setIsSavingUserDefaultModel] =
    useState(false);
  const [selectedModelId, setSelectedModelId] = useState<string>(
    resolveSelectedModelId({
      requestedModelId: initialSelectedModelId,
      userDefaultModelId: initialUserDefaultModelId,
      systemDefaultModelId: initialSystemDefaultModelId,
      selectableModelIds: initialModelOptions.map((model) => model.modelId),
    }) ?? initialSystemDefaultModelId
  );
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

  const getPreferredModelId = useCallback(
    (requestedModelId?: string) =>
      resolveSelectedModelId({
        requestedModelId,
        userDefaultModelId,
        systemDefaultModelId: initialSystemDefaultModelId,
        selectableModelIds: availableModels.map((model) => model.modelId),
      }) ?? initialSystemDefaultModelId,
    [availableModels, initialSystemDefaultModelId, userDefaultModelId]
  );

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
    setSelectedModelId(getPreferredModelId());
    runtime.thread.reset();
    void runtime.thread.composer.reset();
    setLastCitations([]);
    setLastKnowledgeActive(false);
    syncThreadUrl(undefined);
  }, [clearError, getPreferredModelId, runtime, syncThreadUrl]);

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
        setSelectedModelId(getPreferredModelId(threadState.thread.modelId));

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
    [clearError, getPreferredModelId, runtime, syncThreadUrl]
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
      const initialThread = initialThreads.find(
        (thread) => thread.id === initialThreadId
      );
      setSelectedModelId(getPreferredModelId(initialThread?.modelId));
      return;
    }

    setSelectedModelId(getPreferredModelId(initialSelectedModelId));
    runtime.thread.reset();
    void runtime.thread.composer.reset();
  }, [
    getPreferredModelId,
    initialMessages,
    initialSelectedModelId,
    initialThreadId,
    initialThreads,
    runtime,
  ]);

  const saveUserDefaultModel = useCallback(async () => {
    setIsSavingUserDefaultModel(true);

    try {
      const result = await saveUserDefaultModelAction({
        modelId: selectedModelIdRef.current,
      });

      if (!result.data?.success) {
        return {
          success: false as const,
          error: result.data?.error?.message ?? 'Failed to save default model.',
        };
      }

      setUserDefaultModelId(result.data.data.userDefaultModelId);
      return { success: true as const };
    } catch (saveError) {
      return {
        success: false as const,
        error:
          saveError instanceof Error
            ? saveError.message
            : 'Failed to save default model.',
      };
    } finally {
      setIsSavingUserDefaultModel(false);
    }
  }, []);

  return (
    <AssistantRuntimeProvider runtime={runtime}>
      <ChatContext.Provider
        value={{
          error,
          errorType,
          errorMetadata,
          availableModels,
          selectedModelId,
          setSelectedModelId,
          userDefaultModelId,
          isSavingUserDefaultModel,
          saveUserDefaultModel,
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
