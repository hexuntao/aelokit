'use client';

import {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
} from 'react';
import { nanoid } from 'nanoid';
import type { Message } from './types';
import type { ChatErrorType } from './ChatErrorState';
import { parseErrorType, getErrorMetadata } from './ChatErrorState';

const API_URL = '/api/ai/chat';

const AVAILABLE_MODELS = [
  { id: 'gpt-4.1-mini', name: 'GPT-4.1 Mini' },
  { id: 'gpt-4.1', name: 'GPT-4.1' },
  { id: 'gpt-4o-mini', name: 'GPT-4o Mini' },
  { id: 'gpt-4o', name: 'GPT-4o' },
];

// Extended error type that can hold structured error information
interface ChatError extends Error {
  code?: string;
  metadata?: Record<string, unknown>;
}

interface ChatContextType {
  messages: Message[];
  input: string;
  isLoading: boolean;
  error: Error | null;
  errorType: ChatErrorType;
  errorMetadata: Record<string, unknown>;
  selectedModelId: string;
  setInput: (value: string) => void;
  setSelectedModelId: (modelId: string) => void;
  handleSubmit: (e?: React.FormEvent) => void;
  stop: () => void;
  clearError: () => void;
}

const ChatContext = createContext<ChatContextType | null>(null);

export function useChatContext() {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChatContext must be used within a ChatProvider');
  }
  return context;
}

// Helper to create a chat error from response data
function createChatErrorFromResponse(
  errorData: {
    code?: string;
    message: string;
    metadata?: Record<string, unknown>;
  },
  status?: number
): ChatError {
  const error = new Error(errorData.message) as ChatError;
  error.code = errorData.code;
  error.metadata = errorData.metadata;

  // If we have a status code, include it in metadata
  if (status) {
    error.metadata = {
      ...error.metadata,
      status,
    };
  }

  return error;
}

export function ChatProvider({ children }: { children: React.ReactNode }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [errorType, setErrorType] = useState<ChatErrorType>('unknown');
  const [errorMetadata, setErrorMetadata] = useState<Record<string, unknown>>(
    {}
  );
  const [selectedModelId, setSelectedModelId] =
    useState<string>('gpt-4.1-mini');
  const abortControllerRef = useRef<AbortController | null>(null);

  const clearError = useCallback(() => {
    setError(null);
    setErrorType('unknown');
    setErrorMetadata({});
  }, []);

  const stop = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
  }, []);

  const handleSubmit = useCallback(
    async (e?: React.FormEvent) => {
      if (e) {
        e.preventDefault();
      }

      if (!input.trim() || isLoading) {
        return;
      }

      const userMessage: Message = {
        id: nanoid(),
        role: 'user',
        content: input.trim(),
        createdAt: new Date(),
      };

      setMessages((prev) => [...prev, userMessage]);
      setInput('');
      setIsLoading(true);
      clearError();

      const controller = new AbortController();
      abortControllerRef.current = controller;

      try {
        const response = await fetch(API_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            messages: [...messages, userMessage],
            modelId: selectedModelId,
          }),
          signal: controller.signal,
        });

        if (!response.ok) {
          // Try to parse structured error from response
          let parsedError: ChatError;
          try {
            const errorData = await response.json();
            if (errorData.error) {
              parsedError = createChatErrorFromResponse(
                errorData.error,
                response.status
              );
            } else {
              throw new Error('No error field in response');
            }
          } catch {
            // If parsing fails, create a generic error
            parsedError = new Error(
              `Request failed with status ${response.status}`
            ) as ChatError;
            parsedError.metadata = { status: response.status };
          }

          // Set error state
          setError(parsedError);
          setErrorType(parseErrorType(parsedError));
          setErrorMetadata(getErrorMetadata(parsedError));
          return;
        }

        const reader = response.body?.getReader();
        if (!reader) {
          const noBodyError = new Error('No response body') as ChatError;
          setError(noBodyError);
          setErrorType('stream-failed');
          return;
        }

        const decoder = new TextDecoder();
        const assistantMessageId = nanoid();
        let assistantContent = '';

        setMessages((prev) => [
          ...prev,
          {
            id: assistantMessageId,
            role: 'assistant',
            content: '',
            createdAt: new Date(),
          },
        ]);

        while (true) {
          const { done, value } = await reader.read();
          if (done) {
            break;
          }

          const chunk = decoder.decode(value);
          const lines = chunk.split('\n');

          for (const line of lines) {
            if (line.startsWith('0:')) {
              // AI SDK v6 UI message stream format
              try {
                const data = JSON.parse(line.slice(2));
                if (data[1]?.content) {
                  assistantContent += data[1].content;
                  setMessages((prev) =>
                    prev.map((m) =>
                      m.id === assistantMessageId
                        ? { ...m, content: assistantContent }
                        : m
                    )
                  );
                }
              } catch {
                // Ignore parse errors for individual chunks
              }
            }
          }
        }
      } catch (err) {
        if (err instanceof Error && err.name !== 'AbortError') {
          const chatError = err as ChatError;
          setError(chatError);
          setErrorType(parseErrorType(chatError));
          setErrorMetadata(getErrorMetadata(chatError));
          console.error('Chat error:', err);
        }
      } finally {
        setIsLoading(false);
        if (abortControllerRef.current === controller) {
          abortControllerRef.current = null;
        }
      }
    },
    [input, isLoading, messages, selectedModelId, clearError]
  );

  return (
    <ChatContext.Provider
      value={{
        messages,
        input,
        isLoading,
        error,
        errorType,
        errorMetadata,
        selectedModelId,
        setInput,
        setSelectedModelId,
        handleSubmit,
        stop,
        clearError,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
}

export { AVAILABLE_MODELS };
