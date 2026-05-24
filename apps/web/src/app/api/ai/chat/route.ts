import 'server-only';

import { consumeStream, type UIMessage } from 'ai';
import type { AIUsageBillingStatus, AIUsageTokenUsage } from '@repo/ai/usage';
import {
  preflightAICredits,
  refundAICredits,
  reserveAICredits,
  settleAICredits,
} from '@repo/credits/ai-billing';
import { serverEnv } from '@repo/env/server';
import { auth } from '@/lib/auth';
import {
  createRuntimeContext,
  validateRuntimeContext,
  type AIRuntimeContext,
} from '@/ai/context';
import {
  ensureAIModelCatalog,
  getUserDefaultModelReference,
  resolveModel,
  type ResolvedModel,
} from '@/ai/models';
import {
  createChatRuntimeRequest,
  validateChatRequest,
  getSystemPrompt,
} from '@/ai/runtime';
import { buildMastraAgentContext, runMastraChat } from '@/ai/mastra';
import { RuntimeErrors, isRuntimeError } from '@/ai/errors';
import {
  createUsageAuditEntry,
  estimateCreditsFromTokenUsage,
  recordCostEventAudit,
  recordUsageAudit,
} from '@/ai/usage';
import { enforceEntitlement } from '@/ai/entitlements';
import { getAIUsageBillingMode } from '@/ai/billing-policy';
import {
  createMessage,
  createToolCall,
  ensureThread,
  saveMessageParts,
  updateMessageMetadata,
  updateMessageStatus,
  updateToolCall,
} from '@/ai/persistence';
import { isMemoryEnabledForRequest } from '@/ai/memory';
import {
  isKnowledgeRetrievalEnabled,
  type SourceCitationMetadata,
} from '@/ai/knowledge';
import { createMastraToolRegistry, getToolIdByName } from '@/ai/tools';
import { nanoid } from 'nanoid';

export const maxDuration = 30;

type ChatRequestBody = {
  readonly messages?: UIMessage[];
  readonly threadId?: string;
  readonly modelId?: string;
  readonly tools?: Record<string, unknown>;
  readonly memoryEnabled?: boolean;
  readonly knowledgeEnabled?: boolean;
};

const CITATION_SOURCE_PART_TYPE = 'source-document';
const APPROX_CHARS_PER_TOKEN = 4;
const RESERVED_OUTPUT_TOKENS = 2_000;

function createCitationSourceParts(
  citations: readonly SourceCitationMetadata[],
  retrievedAt: string
): UIMessage['parts'] {
  return citations.map(
    (citation, index) =>
      ({
        type: CITATION_SOURCE_PART_TYPE,
        id: `${citation.sourceId}:${citation.chunkId}`,
        mediaType: 'text/plain',
        sourceId: citation.sourceId,
        documentId: citation.documentId,
        chunkId: citation.chunkId,
        title: citation.title,
        provenance: citation.provenance,
        score: citation.score,
        provider: citation.provider,
        citationIndex: index + 1,
        retrievedAt,
      }) as UIMessage['parts'][number]
  );
}

function withCitationSourceParts(
  parts: UIMessage['parts'],
  citations: readonly SourceCitationMetadata[],
  retrievedAt: string
): UIMessage['parts'] {
  if (citations.length === 0) {
    return parts;
  }

  return [...parts, ...createCitationSourceParts(citations, retrievedAt)];
}

function jsonError(error: unknown, status: number): Response {
  return new Response(JSON.stringify({ error }), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

function getLastUserMessage(messages: UIMessage[]): UIMessage | undefined {
  return [...messages].reverse().find((message) => message.role === 'user');
}

function getTextFromMessages(messages: UIMessage[]): string {
  return messages
    .flatMap((message) => message.parts)
    .map((part) =>
      part.type === 'text' && typeof part.text === 'string' ? part.text : ''
    )
    .join(' ');
}

function estimateInitialAICredits(messages: UIMessage[]): number {
  const text = getTextFromMessages(messages);
  const estimatedInputTokens = Math.ceil(text.length / APPROX_CHARS_PER_TOKEN);
  const totalTokens = estimatedInputTokens + RESERVED_OUTPUT_TOKENS;
  return Math.max(1, Math.ceil(totalTokens / 1_000));
}

function extractUsageTokens(totalUsage: unknown): AIUsageTokenUsage {
  const usage = totalUsage as {
    promptTokens?: number;
    inputTokens?: number;
    completionTokens?: number;
    outputTokens?: number;
    totalTokens?: number;
    cachedPromptTokens?: number;
    cachedInputTokens?: number;
    reasoningTokens?: number;
  };

  const inputTokens = usage?.promptTokens ?? usage?.inputTokens ?? 0;
  const outputTokens = usage?.completionTokens ?? usage?.outputTokens ?? 0;

  return {
    inputTokens,
    outputTokens,
    totalTokens: usage?.totalTokens ?? inputTokens + outputTokens,
    cachedInputTokens: usage?.cachedPromptTokens ?? usage?.cachedInputTokens,
    reasoningTokens: usage?.reasoningTokens,
  };
}

function getErrorStatus(error: unknown): 'error' | 'timeout' | 'rate_limited' {
  const errorLike = error as {
    status?: number;
    statusCode?: number;
    code?: string;
    message?: string;
  };
  const message = errorLike?.message?.toLowerCase() ?? '';
  const code = errorLike?.code?.toLowerCase() ?? '';
  const statusCode = errorLike?.status ?? errorLike?.statusCode;

  if (statusCode === 429 || code.includes('rate') || message.includes('429')) {
    return 'rate_limited';
  }

  if (code.includes('timeout') || message.includes('timeout')) {
    return 'timeout';
  }

  return 'error';
}

function getBillingReference(options: {
  usageId: string;
  reservationId?: string;
  reservedCredits?: number;
  estimatedCredits?: number;
  settlementError?: string;
  refundError?: string;
}): Readonly<Record<string, unknown>> {
  return {
    usageId: options.usageId,
    reservationId: options.reservationId,
    reservedCredits: options.reservedCredits,
    estimatedCredits: options.estimatedCredits,
    settlementError: options.settlementError,
    refundError: options.refundError,
  };
}

function asRecord(value: unknown): Record<string, unknown> | undefined {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return undefined;
  }

  return value as Record<string, unknown>;
}

function asToolOutputRecord(value: unknown): Record<string, unknown> {
  return asRecord(value) ?? { value: value ?? null };
}

function getToolErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error ?? 'unknown');
}

function withToolAuditMetadata(
  providerMetadata: unknown,
  toolCalls: readonly Record<string, unknown>[]
): unknown {
  if (toolCalls.length === 0) {
    return providerMetadata;
  }

  const providerMetadataRecord = asRecord(providerMetadata);
  const aelokitMetadata = asRecord(providerMetadataRecord?.aelokit);

  if (providerMetadataRecord) {
    return {
      ...providerMetadataRecord,
      aelokit: {
        ...(aelokitMetadata ?? {}),
        toolCalls,
      },
    };
  }

  return {
    providerMetadata: providerMetadata ?? null,
    aelokit: {
      toolCalls,
    },
  };
}

export async function POST(req: Request) {
  const startTime = Date.now();
  let pendingAssistantMessageId: string | undefined;
  let pendingUsageId: string | undefined;
  let pendingReservationId: string | undefined;
  let pendingRuntimeContext: AIRuntimeContext | undefined;
  let pendingResolvedModel: ResolvedModel | undefined;
  let usageFinalized = false;

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
    pendingRuntimeContext = runtimeContext;
    pendingResolvedModel = resolvedModel;

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

    const usageId = nanoid();
    pendingUsageId = usageId;
    const creditsBillingEnabled = serverEnv.AI_CREDITS_BILLING_ENABLED;
    const billingMode = getAIUsageBillingMode(creditsBillingEnabled);
    let reservedCredits: number | undefined;
    const toolAuditById = new Map<string, Record<string, unknown>>();

    if (creditsBillingEnabled) {
      reservedCredits = estimateInitialAICredits(messages);
      const preflightResult = await preflightAICredits({
        usageId,
        userId: context.userId,
        requiredCredits: reservedCredits,
      });

      if (!preflightResult.success) {
        await updateMessageStatus(assistantMessageId, 'error', new Date());
        await recordUsageAudit({
          ...createUsageAuditEntry(runtimeContext, resolvedModel.reference, {
            status: 'error',
            startedAt: new Date(startTime),
            completedAt: new Date(),
            failureReason: preflightResult.error.code,
            errorMessage: preflightResult.error.message,
            providerModelId: resolvedModel.providerModelId,
            requestDurationMs: Date.now() - startTime,
            billingMode,
            billingStatus: 'preflight_failed',
            billingReference: getBillingReference({
              usageId,
              reservedCredits,
              settlementError: preflightResult.error.message,
            }),
          }),
          id: usageId,
        });

        return jsonError(
          {
            code: preflightResult.error.code,
            message: preflightResult.error.message,
          },
          preflightResult.error.code === 'insufficient_credits' ? 402 : 500
        );
      }

      const reservationResult = await reserveAICredits({
        usageId,
        userId: context.userId,
        requiredCredits: reservedCredits,
      });

      if (!reservationResult.success) {
        await updateMessageStatus(assistantMessageId, 'error', new Date());
        await recordUsageAudit({
          ...createUsageAuditEntry(runtimeContext, resolvedModel.reference, {
            status: 'error',
            startedAt: new Date(startTime),
            completedAt: new Date(),
            failureReason: reservationResult.error.code,
            errorMessage: reservationResult.error.message,
            providerModelId: resolvedModel.providerModelId,
            requestDurationMs: Date.now() - startTime,
            billingMode,
            billingStatus: 'reservation_failed',
            billingReference: getBillingReference({
              usageId,
              reservedCredits,
              settlementError: reservationResult.error.message,
            }),
          }),
          id: usageId,
        });

        return jsonError(
          {
            code: reservationResult.error.code,
            message: reservationResult.error.message,
          },
          reservationResult.error.code === 'insufficient_credits' ? 402 : 500
        );
      }

      pendingReservationId = reservationResult.data.id;
    }

    async function finalizeUsageOnce(options: {
      readonly status: 'success' | 'error' | 'timeout' | 'rate_limited';
      readonly finishReason?: string;
      readonly isAborted?: boolean;
      readonly totalUsage?: unknown;
      readonly providerMetadata?: unknown;
      readonly error?: unknown;
    }) {
      if (usageFinalized) {
        return;
      }
      usageFinalized = true;

      const completedAt = new Date();
      const tokens = extractUsageTokens(options.totalUsage);
      const estimatedCredits = estimateCreditsFromTokenUsage(tokens);
      let billingStatus: AIUsageBillingStatus = creditsBillingEnabled
        ? 'no_charge'
        : 'audit_only';
      let settlementError: string | undefined;
      let refundError: string | undefined;

      if (creditsBillingEnabled && pendingReservationId) {
        if (options.status === 'success' && !options.isAborted) {
          const settlementResult = await settleAICredits({
            reservationId: pendingReservationId,
            usageId,
            userId: context.userId,
            settledCredits: estimatedCredits,
            description: `AI chat usage settlement for ${usageId}`,
          });

          if (settlementResult.success) {
            billingStatus = 'settled';
          } else {
            billingStatus = 'settlement_failed';
            settlementError = settlementResult.error.message;
            console.error('[AI Credits Settlement Error]', {
              usageId,
              reservationId: pendingReservationId,
              error: settlementResult.error,
            });
          }
        } else {
          const refundResult = await refundAICredits({
            reservationId: pendingReservationId,
            usageId,
            userId: context.userId,
            reason:
              options.status === 'rate_limited'
                ? 'rate_limited'
                : options.status === 'timeout'
                  ? 'timeout'
                  : options.isAborted
                    ? 'aborted'
                    : (options.finishReason ?? 'stream_failed'),
          });

          if (refundResult.success) {
            billingStatus =
              refundResult.data.refundStatus === 'refunded'
                ? 'refunded'
                : options.status === 'rate_limited'
                  ? 'rate_limited'
                  : options.status === 'timeout'
                    ? 'timeout'
                    : 'no_charge';
          } else {
            billingStatus = 'refund_failed';
            refundError = refundResult.error.message;
            console.error('[AI Credits Refund Error]', {
              usageId,
              reservationId: pendingReservationId,
              error: refundResult.error,
            });
          }
        }
      }

      const usageResult = await recordUsageAudit({
        ...createUsageAuditEntry(runtimeContext, resolvedModel.reference, {
          status: options.status,
          tokens,
          startedAt: new Date(startTime),
          completedAt,
          failureReason:
            options.status === 'success'
              ? undefined
              : options.error instanceof Error
                ? options.error.message
                : (options.finishReason ?? String(options.error ?? 'unknown')),
          rawUsage: options.totalUsage,
          providerMetadata: withToolAuditMetadata(
            options.providerMetadata,
            Array.from(toolAuditById.values())
          ),
          providerModelId: resolvedModel.providerModelId,
          requestDurationMs: Date.now() - startTime,
          billingMode,
          billingStatus,
          billingReference: getBillingReference({
            usageId,
            reservationId: pendingReservationId,
            reservedCredits,
            estimatedCredits,
            settlementError,
            refundError,
          }),
        }),
        id: usageId,
      });

      if (usageResult.recorded) {
        await recordCostEventAudit({
          usageId,
          userId: context.userId,
          providerId: resolvedModel.reference.providerId,
          modelId: resolvedModel.reference.modelId,
          tokens,
          estimatedCredits,
          currencyCode: 'USD',
          source: 'provider-reported',
          status:
            billingStatus === 'no_charge' ||
            billingStatus === 'refund_failed' ||
            billingStatus === 'rate_limited' ||
            billingStatus === 'timeout'
              ? 'no_charge'
              : options.status === 'success'
                ? 'final'
                : 'failed',
          metadata: {
            billingMode,
            billingStatus,
            reservationId: pendingReservationId,
            finishReason: options.finishReason,
          },
        });
      }
    }

    const agentContext = await buildMastraAgentContext({
      userId: context.userId,
      threadId: persistedThread.id,
      messages,
      lastUserMessage,
      baseSystemPrompt: getSystemPrompt(),
      memoryEnabled,
      knowledgeEnabled,
    });

    const messagesForModel = [...agentContext.inputMessages];
    const memoryContextMessages = [...agentContext.memoryMessages];
    const knowledgeCitations = agentContext.knowledgeCitations;
    const knowledgeChunks = agentContext.knowledgeChunks;
    const systemPrompt = agentContext.systemPrompt;
    const toolRegistry = createMastraToolRegistry({
      userId: context.userId,
    });

    // 7. Stream text from the model
    const runnerResult = await runMastraChat({
      request: chatRequest,
      inputMessages: messagesForModel,
      systemPrompt,
      tools,
      serverTools: toolRegistry.tools,
      memoryEnabled,
      knowledgeEnabled,
      abortSignal: req.signal,
      onAbort: async () => {
        await updateMessageStatus(assistantMessageId, 'aborted', new Date());
      },
      onToolCallStart: async ({ toolCall }) => {
        const toolId = getToolIdByName(toolRegistry, toolCall.toolName);
        toolAuditById.set(toolCall.toolCallId, {
          toolCallId: toolCall.toolCallId,
          toolName: toolCall.toolName,
          toolId,
          status: 'running',
          startedAt: new Date().toISOString(),
        });
        await createToolCall({
          id: toolCall.toolCallId,
          threadId: persistedThread.id,
          messageId: assistantMessageId,
          toolName: toolCall.toolName,
          toolId,
          status: 'running',
          input: asRecord(toolCall.input),
          providerExecuted: Boolean(toolCall.providerExecuted),
        });
      },
      onToolCallFinish: async ({ toolCall, success, output, error }) => {
        const existingAudit = toolAuditById.get(toolCall.toolCallId) ?? {};
        toolAuditById.set(toolCall.toolCallId, {
          ...existingAudit,
          toolCallId: toolCall.toolCallId,
          toolName: toolCall.toolName,
          toolId: getToolIdByName(toolRegistry, toolCall.toolName),
          status: success ? 'success' : 'error',
          completedAt: new Date().toISOString(),
        });

        if (success) {
          await updateToolCall(toolCall.toolCallId, {
            status: 'success',
            output: asToolOutputRecord(output),
            completedAt: new Date(),
          });
          return;
        }

        await updateToolCall(toolCall.toolCallId, {
          status: 'error',
          errorMessage: getToolErrorMessage(error),
          completedAt: new Date(),
        });
      },
    });
    const { result } = runnerResult;

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
        await saveMessageParts(
          assistantMessageId,
          withCitationSourceParts(
            responseMessage.parts,
            knowledgeCitations,
            new Date(startTime).toISOString()
          ),
          {
            threadId: persistedThread.id,
          }
        );
        await updateMessageMetadata(assistantMessageId, {
          finishReason,
          isAborted,
          memoryEnabled,
          memoryContextCount: memoryContextMessages.length,
          knowledgeEnabled,
          knowledgeChunkCount: knowledgeChunks.length,
          citations: knowledgeCitations,
          knowledgeError: agentContext.knowledgeError,
          modelSelectionSource: resolvedModel.source,
          providerId: resolvedModel.reference.providerId,
          modelId: resolvedModel.reference.modelId,
        });
        await updateMessageStatus(assistantMessageId, status, new Date());

        const totalUsage = await result.totalUsage;
        const providerMetadata = await result.providerMetadata;
        await finalizeUsageOnce({
          status: isAborted
            ? 'error'
            : finishReason === 'stop'
              ? 'success'
              : 'error',
          finishReason,
          isAborted,
          totalUsage,
          providerMetadata,
        });
      },
      onError: (streamError) => {
        void updateMessageStatus(assistantMessageId, 'error', new Date());
        void finalizeUsageOnce({
          status: getErrorStatus(streamError),
          error: streamError,
        });
        return 'AI response failed while streaming.';
      },
      messageMetadata: ({ part }) => {
        if (part.type === 'start') {
          return {
            threadId: persistedThread.id,
            messageId: assistantMessageId,
            providerId: resolvedModel.reference.providerId,
            modelId: resolvedModel.reference.modelId,
            modelSelectionSource: resolvedModel.source,
            memoryEnabled,
            memoryContextCount: memoryContextMessages.length,
            knowledgeEnabled,
            knowledgeChunkCount: knowledgeChunks.length,
            knowledgeError: agentContext.knowledgeError,
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
            knowledgeError: agentContext.knowledgeError,
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

    if (
      pendingUsageId &&
      pendingRuntimeContext &&
      pendingResolvedModel &&
      !usageFinalized
    ) {
      const refundResult = pendingReservationId
        ? await refundAICredits({
            reservationId: pendingReservationId,
            usageId: pendingUsageId,
            userId: pendingRuntimeContext.userId,
            reason: 'route_error',
          })
        : undefined;
      const creditsBillingEnabled = serverEnv.AI_CREDITS_BILLING_ENABLED;

      await recordUsageAudit({
        ...createUsageAuditEntry(
          pendingRuntimeContext,
          pendingResolvedModel.reference,
          {
            status: getErrorStatus(error),
            startedAt: new Date(startTime),
            completedAt: new Date(),
            failureReason:
              error instanceof Error ? error.message : String(error),
            errorMessage:
              error instanceof Error ? error.message : String(error),
            providerModelId: pendingResolvedModel.providerModelId,
            requestDurationMs: Date.now() - startTime,
            billingMode: getAIUsageBillingMode(creditsBillingEnabled),
            billingStatus: pendingReservationId
              ? refundResult?.success
                ? 'no_charge'
                : 'refund_failed'
              : creditsBillingEnabled
                ? 'no_charge'
                : 'audit_only',
            billingReference: getBillingReference({
              usageId: pendingUsageId,
              reservationId: pendingReservationId,
              refundError: refundResult?.success
                ? undefined
                : refundResult?.error.message,
            }),
          }
        ),
        id: pendingUsageId,
      });
    }

    return jsonError(runtimeError, 500);
  }
}
