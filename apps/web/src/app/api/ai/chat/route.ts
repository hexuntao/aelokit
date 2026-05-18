import 'server-only';

import {
  convertToModelMessages,
  streamText,
  type UIMessage,
  type LanguageModelUsage,
} from 'ai';
import { auth } from '@/lib/auth';
import { createRuntimeContext, validateRuntimeContext } from '@/ai/context';
import { resolveModel } from '@/ai/models';
import {
  createChatRuntimeRequest,
  validateChatRequest,
  getSystemPrompt,
} from '@/ai/runtime';
import { RuntimeErrors, isRuntimeError } from '@/ai/errors';
import { createUsageAuditEntry, recordUsageAudit } from '@/ai/usage';

export const maxDuration = 30;

export async function POST(req: Request) {
  const startTime = Date.now();

  try {
    // 1. Get auth session
    const sessionResult = await auth.api.getSession({ headers: req.headers });

    // 2. Create and validate runtime context
    const contextResult = createRuntimeContext(sessionResult);

    if (!contextResult.success) {
      const error = RuntimeErrors.unauthenticated();
      return new Response(JSON.stringify({ error }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const { context } = contextResult;
    const contextValidation = validateRuntimeContext(context);
    if (!contextValidation.valid) {
      const error = RuntimeErrors.invalidRequest(contextValidation.reason);
      return new Response(JSON.stringify({ error }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // 3. Parse request body
    const {
      messages,
      threadId,
      modelId,
    }: {
      messages: UIMessage[];
      threadId?: string;
      modelId?: string;
    } = await req.json();

    // 4. Resolve model (model resolution with defaults
    let selectedModel: { providerId: 'openai'; modelId: string } | undefined;
    if (modelId) {
      selectedModel = { providerId: 'openai' as const, modelId };
    }

    const modelResult = resolveModel(selectedModel);

    if (!modelResult.success) {
      const error = RuntimeErrors.modelNotFound(modelId ?? 'default', 'openai');
      return new Response(JSON.stringify({ error }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const { data: resolvedModel } = modelResult;

    // 5. Create and validate chat request
    const chatRequest = createChatRuntimeRequest(
      messages,
      {
        ...context,
        threadId,
      },
      resolvedModel
    );

    const chatValidation = validateChatRequest(chatRequest);
    if (!chatValidation.valid) {
      const error = RuntimeErrors.invalidRequest(chatValidation.reason);
      return new Response(JSON.stringify({ error }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // 6. Stream text from the model
    const result = streamText({
      model: resolvedModel.model,
      system: getSystemPrompt(),
      messages: await convertToModelMessages(messages),
      abortSignal: req.signal,
      onFinish: async ({ response, finishReason, usage }) => {
        // Usage audit (v0.2 only does audit, no credits charging
        const usageAny = usage as any;
        void recordUsageAudit(
          createUsageAuditEntry(context, resolvedModel.reference, {
            status: finishReason === 'stop' ? 'success' : 'error',
            tokens: usage
              ? {
                  inputTokens: usageAny?.promptTokens ?? usageAny?.inputTokens,
                  outputTokens:
                    usageAny?.completionTokens ?? usageAny?.outputTokens,
                  totalTokens: usageAny?.totalTokens,
                  cachedInputTokens: usageAny?.cachedPromptTokens,
                  reasoningTokens: usageAny?.reasoningTokens,
                }
              : undefined,
            startedAt: new Date(startTime),
            completedAt: new Date(),
            failureReason: finishReason === 'stop' ? undefined : finishReason,
            rawUsage: usage,
            providerMetadata: usageAny?.providerMetadata,
            providerModelId: resolvedModel.providerModelId,
            requestDurationMs: Date.now() - startTime,
          })
        );
      },
    });

    // 7. Return UI message stream response
    return result.toUIMessageStreamResponse({
      messageMetadata: ({ part }) => {
        if (part.type === 'start') {
          return {
            providerId: resolvedModel.reference.providerId,
            modelId: resolvedModel.reference.modelId,
          };
        }
        if (part.type === 'finish') {
          const totalUsage = part.totalUsage;
          return {
            totalTokens: totalUsage
              ? (totalUsage as any).totalTokens
              : undefined,
            inputTokens: totalUsage
              ? (totalUsage as any).promptTokens
              : undefined,
            outputTokens: totalUsage
              ? (totalUsage as any).completionTokens
              : undefined,
          };
        }
        return undefined;
      },
    });
  } catch (error) {
    // Handle unexpected errors
    console.error('[AI Chat Route Error:', error);

    const runtimeError = isRuntimeError(error)
      ? error
      : RuntimeErrors.streamFailed(
          error instanceof Error ? error.message : String(error)
        );

    return new Response(JSON.stringify({ error: runtimeError }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
