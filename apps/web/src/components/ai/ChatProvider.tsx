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
  useMemo,
  useRef,
  useState,
} from 'react';
import type { ChatErrorType } from './ChatErrorState';
import { parseErrorType, getErrorMetadata } from './ChatErrorState';

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
}

const ChatContext = createContext<ChatContextType | null>(null);

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
  const [memoryEnabled, setMemoryEnabled] = useState<boolean>(false);
  const threadIdRef = useRef<string | undefined>(undefined);
  const selectedModelIdRef = useRef(selectedModelId);
  const memoryEnabledRef = useRef(memoryEnabled);

  threadIdRef.current = threadId;
  selectedModelIdRef.current = selectedModelId;
  memoryEnabledRef.current = memoryEnabled;

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
        }}
      >
        {children}
      </ChatContext.Provider>
    </AssistantRuntimeProvider>
  );
}

export { AVAILABLE_MODELS };
