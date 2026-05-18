import 'server-only';

import type { LanguageModel, UIMessage } from 'ai';
import type { AIRuntimeContext } from '../context';
import type { ResolvedModel } from '../models';

export interface ChatRuntimeRequest {
  readonly messages: UIMessage[];
  readonly context: AIRuntimeContext;
  readonly resolvedModel: ResolvedModel;
}

export interface ChatRuntimeResult {
  readonly request: ChatRuntimeRequest;
  readonly startedAt: Date;
}

export function createChatRuntimeRequest(
  messages: UIMessage[],
  context: AIRuntimeContext,
  resolvedModel: ResolvedModel
): ChatRuntimeRequest {
  return {
    messages,
    context,
    resolvedModel,
  };
}

export function validateChatRequest(
  request: ChatRuntimeRequest
):
  | { readonly valid: true }
  | { readonly valid: false; readonly reason: string } {
  if (!request.messages || request.messages.length === 0) {
    return { valid: false, reason: 'Messages array cannot be empty.' };
  }

  if (!request.context.userId) {
    return { valid: false, reason: 'User ID is required.' };
  }

  if (!request.resolvedModel.model) {
    return { valid: false, reason: 'Resolved model is required.' };
  }

  return { valid: true };
}

export function getSystemPrompt(): string {
  return 'You are a helpful AI assistant.';
}

export function buildChatConfig(request: ChatRuntimeRequest): {
  readonly model: LanguageModel;
  readonly system: string;
  readonly messages: UIMessage[];
} {
  return {
    model: request.resolvedModel.model,
    system: getSystemPrompt(),
    messages: request.messages,
  };
}
