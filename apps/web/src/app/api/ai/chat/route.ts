import 'server-only';

import {
  consumeStream,
  convertToModelMessages,
  streamText,
  type UIMessage,
} from 'ai';
import { frontendTools } from '@assistant-ui/react-ai-sdk';
import { auth } from '@/lib/auth';
import { createRuntimeContext, validateRuntimeContext } from '@/ai/context';
import {
  ensureAIModelCatalog,
  getUserDefaultModelReference,
  resolveModel,
} from '@/ai/models';
import {
  createChatRuntimeRequest,
  validateChatRequest,
  getSystemPrompt,
} from '@/ai/runtime';
import { RuntimeErrors, isRuntimeError } from '@/ai/errors';
import { createUsageAuditEntry, recordUsageAudit } from '@/ai/usage';
import { enforceEntitlement } from '@/ai/entitlements';
import {
  createMessage,
  ensureThread,
  saveMessageParts,
  updateMessageStatus,
} from '@/ai/persistence';
import {
  extractMemoryMessageText,
  getMemoryContextForChat,
  isMemoryEnabledForRequest,
} from '@/ai/memory';
import {
  retrieveKnowledgeContext,
  formatRetrievalContextForPrompt,
  isKnowledgeRetrievalEnabled,
} from '@/ai/knowledge';

export const maxDuration = 30;

type ChatRequestBody = {
  readonly messages?: UIMessage[];
  readonly threadId?: string;
  readonly modelId?: string;
  readonly tools?: Record<string, unknown>;
  readonly memoryEnabled?: boolean;
  readonly knowledgeEnabled?: boolean;
};

function jsonError(error: unknown, status: number): Response {
  return new Response(JSON.stringify({ error }), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

function getLastUserMessage(messages: UIMessage[]): UIMessage | undefined {
  return [...messages].reverse().find((message) => message.role === 'user');
}

export async function POST(req: Request) {
  const startTime = Date.now();
  let pendingAssistantMessageId: string | undefined;

  try {
    // 1. Get auth session
    const sessionResult = await auth.api.getSession({ headers: req.headers });

    // 2. Create and validate runtime context
    const contextResult = createRuntimeContext(sessionResult);

    if (!contextResult.success) {
      const error = RuntimeErrors.unauthenticated();
      return jsonError(error, 401);
    }

    const { context } = contextResult;
    const contextValidation = validateRuntimeContext(context);
    if (!contextValidation.valid) {
      const error = RuntimeErrors.invalidRequest(contextValidation.reason);
      return jsonError(error, 400);
    }

    // 3. Auth/Entitlement check (TASK-014)
    const entitlementCheck = enforceEntitlement(context);
    if (!entitlementCheck.allowed) {
      const error =
        entitlementCheck.error.code === 'forbidden'
          ? RuntimeErrors.forbidden(entitlementCheck.error.message)
          : RuntimeErrors.unauthenticated();

      const statusCode =
        entitlementCheck.error.code === 'forbidden' ? 403 : 401;

      return jsonError(error, statusCode);
    }

    // 4. Parse request body
    const {
      messages = [],
      threadId,
      modelId,
      tools,
      memoryEnabled: requestMemoryEnabled,
      knowledgeEnabled: requestKnowledgeEnabled,
    }: ChatRequestBody = await req.json();

    const memoryEnabled = isMemoryEnabledForRequest(requestMemoryEnabled);
    const knowledgeEnabled =
      requestKnowledgeEnabled === true && isKnowledgeRetrievalEnabled();

    const lastUserMessage = getLastUserMessage(messages);
    if (!lastUserMessage) {
      const error = RuntimeErrors.invalidRequest(
        'At least one user message is required.'
      );
      return jsonError(error, 400);
    }

    await ensureAIModelCatalog();

    // 5. Resolve model with per-chat > user default > system default.
    let selectedModel: { providerId: 'openai'; modelId: string } | undefined;
    if (modelId) {
      selectedModel = { providerId: 'openai' as const, modelId };
    }

    const userDefaultModel = await getUserDefaultModelReference(context.userId);
    const modelResult = await resolveModel(
      selectedModel,
      userDefaultModel ?? undefined
    );

    if (!modelResult.success) {
      const error =
        modelResult.error.code === 'provider-unavailable'
          ? RuntimeErrors.providerUnavailable(
              modelResult.error.providerId ?? 'openai'
            )
          : modelResult.error.code === 'no-default-model'
            ? RuntimeErrors.noDefaultModel()
            : RuntimeErrors.modelNotFound(modelId ?? 'default', 'openai');
      return jsonError(error, 400);
    }

    const { data: resolvedModel } = modelResult;

    const threadResult = await ensureThread({
      threadId,
      userId: context.userId,
      providerId: resolvedModel.reference.providerId,
      modelId: resolvedModel.reference.modelId,
      firstMessage: lastUserMessage,
    });

    if (!threadResult.success || !threadResult.data) {
      const error = RuntimeErrors.persistenceFailed(
        threadResult.error?.message ?? 'Failed to prepare chat thread.'
      );
      return jsonError(error, 500);
    }

    const persistedThread = threadResult.data;
    const userMessageResult = await createMessage({
      threadId: persistedThread.id,
      role: 'user',
      content: lastUserMessage.parts,
      metadata: {
        runtimeMessageId: lastUserMessage.id,
      },
      status: 'complete',
    });

    if (!userMessageResult.success || !userMessageResult.data) {
      const error = RuntimeErrors.persistenceFailed(
        userMessageResult.error?.message ?? 'Failed to save user message.'
      );
      return jsonError(error, 500);
    }

    const assistantMessageResult = await createMessage({
      threadId: persistedThread.id,
      role: 'assistant',
      content: [],
      metadata: {
        modelSelectionSource: resolvedModel.source,
        providerId: resolvedModel.reference.providerId,
        modelId: resolvedModel.reference.modelId,
      },
      parentMessageId: userMessageResult.data.id,
      status: 'streaming',
    });

    if (!assistantMessageResult.success || !assistantMessageResult.data) {
      const error = RuntimeErrors.persistenceFailed(
        assistantMessageResult.error?.message ??
          'Failed to create assistant message.'
      );
      return jsonError(error, 500);
    }

    const assistantMessageId = assistantMessageResult.data.id;
    pendingAssistantMessageId = assistantMessageId;
    const runtimeContext = {
      ...context,
      threadId: persistedThread.id,
      messageId: assistantMessageId,
    };

    // 6. Create and validate chat request
    const chatRequest = createChatRuntimeRequest(
      messages,
      runtimeContext,
      resolvedModel
    );

    const chatValidation = validateChatRequest(chatRequest);
    if (!chatValidation.valid) {
      const error = RuntimeErrors.invalidRequest(chatValidation.reason);
      await updateMessageStatus(assistantMessageId, 'error', new Date());
      return jsonError(error, 400);
    }

    // 6.5. Memory context injection (v0.3 TASK-005)
    // Read-only durable memory recall by user/resourceId. The persisted chat
    // thread remains separate from Mastra memory threads.
    const memoryResult = await getMemoryContextForChat(
      context.userId,
      persistedThread.id,
      memoryEnabled
    );

    const memoryContextMessages: UIMessage[] = [];
    if (memoryResult.success && memoryResult.messages.length > 0) {
      for (const msg of memoryResult.messages) {
        const mastraMsg = msg as {
          role?: string;
          content?: unknown;
          id?: string;
        };
        if (mastraMsg.role === 'user' || mastraMsg.role === 'assistant') {
          const textContent = extractMemoryMessageText(mastraMsg);
          if (textContent) {
            memoryContextMessages.push({
              id: mastraMsg.id ?? `memory-${crypto.randomUUID()}`,
              role: mastraMsg.role as 'user' | 'assistant',
              parts: [{ type: 'text' as const, text: textContent }],
            });
          }
        }
      }
    }

    const messagesForModel = [...memoryContextMessages, ...messages];

    // 6.6. Knowledge retrieval context injection (v0.3 TASK-008)
    let knowledgeContextText = '';
    let knowledgeCitations: readonly unknown[] = [];
    let knowledgeChunks: readonly unknown[] = [];

    if (knowledgeEnabled && lastUserMessage) {
      const userQuery = lastUserMessage.parts
        .filter(
          (part): part is { type: 'text'; text: string } => part.type === 'text'
        )
        .map((part) => part.text)
        .join(' ');

      if (userQuery.trim()) {
        const retrievalResult = await retrieveKnowledgeContext(userQuery, {
          userId: context.userId,
          topK: 5,
          minScore: 0.0,
          includeOtherUserPublic: false,
        });

        if (retrievalResult.success && retrievalResult.chunks.length > 0) {
          knowledgeContextText =
            formatRetrievalContextForPrompt(retrievalResult);
          knowledgeCitations = retrievalResult.citations;
          knowledgeChunks = retrievalResult.chunks;
        }
      }
    }

    const systemPrompt = knowledgeContextText
      ? `${getSystemPrompt()}\n\n${knowledgeContextText}`
      : getSystemPrompt();

    // 7. Stream text from the model
    const result = streamText({
      model: resolvedModel.model,
      system: systemPrompt,
      messages: await convertToModelMessages(messagesForModel),
      tools: frontendTools(
        (tools ?? {}) as Parameters<typeof frontendTools>[0]
      ),
      abortSignal: req.signal,
      onAbort: async () => {
        await updateMessageStatus(assistantMessageId, 'aborted', new Date());
      },
    });

    // 8. Return UI message stream response
    const citationsJson =
      knowledgeCitations.length > 0 ? JSON.stringify(knowledgeCitations) : '';

    return result.toUIMessageStreamResponse({
      originalMessages: messages,
      generateMessageId: () => assistantMessageId,
      consumeSseStream: ({ stream }) => consumeStream({ stream }),
      headers: {
        'x-ai-thread-id': persistedThread.id,
        'x-ai-message-id': assistantMessageId,
        'x-ai-memory-enabled': String(memoryEnabled),
        'x-ai-memory-context-count': String(memoryContextMessages.length),
        'x-ai-knowledge-enabled': String(knowledgeEnabled),
        'x-ai-knowledge-chunk-count': String(knowledgeChunks.length),
        ...(citationsJson ? { 'x-ai-knowledge-citations': citationsJson } : {}),
      },
      onFinish: async ({ responseMessage, finishReason, isAborted }) => {
        const status = isAborted ? 'aborted' : 'complete';
        await saveMessageParts(assistantMessageId, responseMessage.parts, {
          threadId: persistedThread.id,
        });
        await updateMessageStatus(assistantMessageId, status, new Date());

        const totalUsage = await result.totalUsage;
        const providerMetadata = await result.providerMetadata;
        const usageAny = totalUsage as any;
        await recordUsageAudit(
          createUsageAuditEntry(runtimeContext, resolvedModel.reference, {
            status: isAborted
              ? 'error'
              : finishReason === 'stop'
                ? 'success'
                : 'error',
            tokens: {
              inputTokens: usageAny?.promptTokens ?? usageAny?.inputTokens ?? 0,
              outputTokens:
                usageAny?.completionTokens ?? usageAny?.outputTokens ?? 0,
              totalTokens: usageAny?.totalTokens,
              cachedInputTokens:
                usageAny?.cachedPromptTokens ?? usageAny?.cachedInputTokens,
              reasoningTokens: usageAny?.reasoningTokens,
            },
            startedAt: new Date(startTime),
            completedAt: new Date(),
            failureReason: isAborted
              ? 'aborted'
              : finishReason === 'stop'
                ? undefined
                : finishReason,
            rawUsage: totalUsage,
            providerMetadata,
            providerModelId: resolvedModel.providerModelId,
            requestDurationMs: Date.now() - startTime,
          })
        );
      },
      onError: (streamError) => {
        void updateMessageStatus(assistantMessageId, 'error', new Date());
        void recordUsageAudit(
          createUsageAuditEntry(runtimeContext, resolvedModel.reference, {
            status: 'error',
            startedAt: new Date(startTime),
            completedAt: new Date(),
            failureReason:
              streamError instanceof Error
                ? streamError.message
                : String(streamError),
            errorMessage:
              streamError instanceof Error
                ? streamError.message
                : String(streamError),
            providerModelId: resolvedModel.providerModelId,
            requestDurationMs: Date.now() - startTime,
          })
        );
        return 'AI response failed while streaming.';
      },
      messageMetadata: ({ part }) => {
        if (part.type === 'start') {
          return {
            threadId: persistedThread.id,
            messageId: assistantMessageId,
            providerId: resolvedModel.reference.providerId,
            modelId: resolvedModel.reference.modelId,
            knowledgeEnabled,
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
            citations:
              knowledgeCitations.length > 0 ? knowledgeCitations : undefined,
            knowledgeEnabled,
          };
        }
        return undefined;
      },
    });
  } catch (error) {
    // Handle unexpected errors
    console.error('[AI Chat Route Error]', error);

    const runtimeError = isRuntimeError(error)
      ? error
      : RuntimeErrors.streamFailed(
          error instanceof Error ? error.message : String(error)
        );

    if (pendingAssistantMessageId) {
      await updateMessageStatus(pendingAssistantMessageId, 'error', new Date());
    }

    return jsonError(runtimeError, 500);
  }
}
