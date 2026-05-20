'use client';

import { AssistantRuntimeProvider } from '@assistant-ui/react';
import {
  AssistantChatTransport,
  useChatRuntime,
} from '@assistant-ui/react-ai-sdk';
import type { UIMessage } from 'ai';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import type { ChatErrorType } from './ChatErrorState';
import { parseErrorType, getErrorMetadata } from './ChatErrorState';
import type { CitationMetadata } from './CitationList';

const API_URL = '/api/ai/chat';

const AVAILABLE_MODELS = [
  { id: 'gpt-5.5', name: 'GPT-5.5' },
  { id: 'gpt-4.1-mini', name: 'GPT-4.1 Mini' },
  { id: 'gpt-4.1', name: 'GPT-4.1' },
  { id: 'gpt-4o-mini', name: 'GPT-4o Mini' },
  { id: 'gpt-4o', name: 'GPT-4o' },
];

type ChatMessageMetadata = {
  readonly threadId?: string;
  readonly messageId?: string;
  readonly providerId?: string;
  readonly modelId?: string;
  readonly totalTokens?: number;
  readonly inputTokens?: number;
  readonly outputTokens?: number;
  readonly citations?: readonly CitationMetadata[];
  readonly knowledgeEnabled?: boolean;
};

type AeloKitUIMessage = UIMessage<ChatMessageMetadata>;

interface ChatError extends Error {
  code?: string;
  metadata?: Record<string, unknown>;
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
}

const ChatContext = createContext<ChatContextType | null>(null);

const MEMORY_ENABLED_KEY = 'aelokit-memory-enabled';
const KNOWLEDGE_ENABLED_KEY = 'aelokit-knowledge-enabled';

export function useChatContext() {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChatContext must be used within a ChatProvider');
  }
  return context;
}

export function ChatProvider({ children }: { children: React.ReactNode }) {
  const [error, setError] = useState<Error | null>(null);
  const [errorType, setErrorType] = useState<ChatErrorType>('unknown');
  const [errorMetadata, setErrorMetadata] = useState<Record<string, unknown>>(
    {}
  );
  const [selectedModelId, setSelectedModelId] = useState<string>('gpt-5.5');
  const [threadId, setThreadId] = useState<string | undefined>();
  const [memoryEnabled, setMemoryEnabledState] = useState<boolean>(false);
  const [lastCitations, setLastCitations] = useState<
    readonly CitationMetadata[]
  >([]);
  const [knowledgeEnabled, setKnowledgeEnabled] = useState<boolean>(false);
  const [lastKnowledgeActive, setLastKnowledgeActive] =
    useState<boolean>(false);
  const threadIdRef = useRef<string | undefined>(undefined);
  const selectedModelIdRef = useRef(selectedModelId);
  const memoryEnabledRef = useRef(memoryEnabled);
  const knowledgeEnabledRef = useRef(knowledgeEnabled);

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
      new AssistantChatTransport<AeloKitUIMessage>({
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

  const runtime = useChatRuntime<AeloKitUIMessage>({
    transport,
    onFinish: ({ message }) => {
      const responseThreadId = message.metadata?.threadId;
      if (responseThreadId) {
        setThreadId(responseThreadId);
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
        }}
      >
        {children}
      </ChatContext.Provider>
    </AssistantRuntimeProvider>
  );
}

export { AVAILABLE_MODELS };
