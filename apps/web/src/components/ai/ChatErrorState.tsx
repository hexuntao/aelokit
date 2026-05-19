'use client';

import { AlertCircle, Lock, Server, Clock, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useChatContext } from './ChatProvider';

export type ChatErrorType =
  | 'unauthenticated'
  | 'forbidden'
  | 'provider-unavailable'
  | 'model-not-found'
  | 'no-default-model'
  | 'stream-failed'
  | 'persistence-failed'
  | 'usage-audit-failed'
  | 'invalid-request'
  | 'rate-limited'
  | 'unknown';

interface ChatErrorStateProps {
  error?: Error;
  errorType?: ChatErrorType;
  errorCode?: string;
  metadata?: Record<string, unknown>;
}

interface ErrorConfig {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  message: string;
  showRetry: boolean;
  showLoginPrompt?: boolean;
  retryAfter?: number;
}

function getErrorConfig(
  errorType: ChatErrorType,
  errorMessage: string,
  metadata?: Record<string, unknown>
): ErrorConfig {
  switch (errorType) {
    case 'unauthenticated':
      return {
        icon: Lock,
        title: 'Authentication Required',
        message:
          'Please sign in to continue chatting. Your session may have expired.',
        showRetry: false,
        showLoginPrompt: true,
      };
    case 'forbidden':
      return {
        icon: Lock,
        title: 'Access Denied',
        message:
          errorMessage || 'You do not have permission to perform this action.',
        showRetry: false,
      };
    case 'provider-unavailable':
      return {
        icon: Server,
        title: 'Provider Unavailable',
        message:
          errorMessage ||
          'The AI provider is currently unavailable. Please try again later.',
        showRetry: true,
      };
    case 'model-not-found':
      return {
        icon: Server,
        title: 'Model Not Found',
        message: errorMessage || 'The selected model is not available.',
        showRetry: true,
      };
    case 'no-default-model':
      return {
        icon: Server,
        title: 'No Default Model',
        message:
          errorMessage ||
          'No default model is configured. Please select a model.',
        showRetry: false,
      };
    case 'rate-limited': {
      const retryAfter = metadata?.retryAfter as number | undefined;
      return {
        icon: Clock,
        title: 'Rate Limited',
        message: retryAfter
          ? `You've exceeded the rate limit. Please try again in ${retryAfter} seconds.`
          : "You've exceeded the rate limit. Please try again later.",
        showRetry: false,
        retryAfter,
      };
    }
    default:
      return {
        icon: AlertCircle,
        title: 'Something Went Wrong',
        message:
          errorMessage ||
          'An error occurred while processing your request. Please try again.',
        showRetry: true,
      };
  }
}

export function ChatErrorState({
  error,
  errorType: propErrorType,
  errorCode: propErrorCode,
  metadata,
}: ChatErrorStateProps) {
  const { messages, setInput } = useChatContext();

  // Determine error type from props or error code
  let errorType: ChatErrorType = 'unknown';
  let errorMessage = '';

  if (propErrorType) {
    errorType = propErrorType;
  } else if (propErrorCode) {
    errorType = propErrorCode as ChatErrorType;
  }

  if (error) {
    errorMessage = error.message;
  }

  const config = getErrorConfig(errorType, errorMessage, metadata);
  const Icon = config.icon;

  return (
    <div className="border-t border-border">
      <div className="flex w-full gap-4 px-4 py-4 max-w-4xl mx-auto">
        <div className="flex h-8 w-8 shrink-0 select-none items-center justify-center rounded-md border bg-background">
          <Icon className="h-4 w-4 text-destructive" />
        </div>
        <div className="flex flex-col gap-3 max-w-[80%]">
          <div className="rounded-2xl px-4 py-3 text-sm bg-destructive/10 text-destructive border border-destructive/20">
            <div className="font-medium mb-1">{config.title}</div>
            <div className="text-sm opacity-90">{config.message}</div>
          </div>
          <div className="flex flex-wrap gap-2">
            {config.showRetry && messages.length > 0 && (
              <Button
                variant="secondary"
                size="sm"
                className="w-fit"
                onClick={() => {
                  const lastUserMessage = [...messages]
                    .reverse()
                    .find((m) => m.role === 'user');
                  if (lastUserMessage) {
                    setInput(lastUserMessage.content);
                  }
                }}
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Try again
              </Button>
            )}
            {config.showLoginPrompt && (
              <Button variant="default" size="sm" className="w-fit" asChild>
                <a href="/login">Sign In</a>
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Helper to parse error type from error object or response
export function parseErrorType(error: unknown): ChatErrorType {
  if (typeof error === 'object' && error !== null && 'code' in error) {
    const code = (error as { code: string }).code;
    switch (code) {
      case 'unauthenticated':
      case 'forbidden':
      case 'provider-unavailable':
      case 'model-not-found':
      case 'no-default-model':
      case 'stream-failed':
      case 'persistence-failed':
      case 'usage-audit-failed':
      case 'invalid-request':
      case 'rate-limited':
        return code as ChatErrorType;
    }
  }
  return 'unknown';
}

export function getErrorMetadata(error: unknown): Record<string, unknown> {
  if (typeof error === 'object' && error !== null && 'metadata' in error) {
    return (error as { metadata: Record<string, unknown> }).metadata || {};
  }
  return {};
}
