import 'server-only';

import type { Session } from '@/lib/auth-types';
import type { AIModelReference } from '@repo/ai/models';
import type { AIAgentReference } from '@repo/ai/agents';

export interface AIRuntimeContext {
  readonly session: Session;
  readonly userId: string;
  readonly threadId?: string;
  readonly messageId?: string;
  readonly selectedModel?: AIModelReference;
  readonly selectedAgent?: AIAgentReference;
  readonly locale?: string;
  readonly requestedAt: Date;
}

export interface AIRuntimeContextError {
  readonly code: 'unauthenticated' | 'forbidden' | 'invalid-session';
  readonly message: string;
}

export type AIRuntimeContextResult =
  | { readonly success: true; readonly context: AIRuntimeContext }
  | { readonly success: false; readonly error: AIRuntimeContextError };

export function createRuntimeContext(
  session: Session | null,
  options?: {
    readonly threadId?: string;
    readonly messageId?: string;
    readonly selectedModel?: AIModelReference;
    readonly selectedAgent?: AIAgentReference;
    readonly locale?: string;
  }
): AIRuntimeContextResult {
  if (!session?.user) {
    return {
      success: false,
      error: {
        code: 'unauthenticated',
        message: 'User must be authenticated to access AI runtime.',
      },
    };
  }

  return {
    success: true,
    context: {
      session,
      userId: session.user.id,
      threadId: options?.threadId,
      messageId: options?.messageId,
      selectedModel: options?.selectedModel,
      selectedAgent: options?.selectedAgent,
      locale: options?.locale,
      requestedAt: new Date(),
    },
  };
}

export function validateRuntimeContext(
  context: AIRuntimeContext
):
  | { readonly valid: true }
  | { readonly valid: false; readonly reason: string } {
  if (!context.userId) {
    return { valid: false, reason: 'User ID is required.' };
  }

  if (!context.session.user) {
    return { valid: false, reason: 'Session user is required.' };
  }

  return { valid: true };
}

export function getContextMetadata(
  context: AIRuntimeContext
): Readonly<Record<string, string | undefined>> {
  return {
    userId: context.userId,
    threadId: context.threadId,
    messageId: context.messageId,
    locale: context.locale,
    requestedAt: context.requestedAt.toISOString(),
  };
}
