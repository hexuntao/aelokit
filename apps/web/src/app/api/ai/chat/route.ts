import 'server-only';

import {
  consumeStream,
  createUIMessageStream,
  createUIMessageStreamResponse,
  type UIMessage,
} from 'ai';
import type { AIUsageBillingStatus, AIUsageTokenUsage } from '@repo/ai/usage';
import { getUserCredits } from '@repo/credits';
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
  ensureAIAgentCatalog,
  resolveRuntimeAgentSelection,
} from '@/ai/agents';
import {
  ensureAIModelCatalog,
  getUserDefaultModelReference,
  resolveModel,
  type ResolvedModel,
} from '@/ai/models';
import {
  getAppLocalModelCatalog,
  isSelectableModel,
} from '@/ai/models/catalog';
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
import { getAIEntitlementPolicyForUser } from '@/ai/entitlements/plan-policy';
import { getAIUsageBillingMode } from '@/ai/billing-policy';
import {
  createMessage,
  createToolCall,
  ensureThread,
  getThread,
  saveMessageParts,
  updateMessageMetadata,
  updateMessageStatus,
  updateToolCall,
} from '@/ai/persistence';
import { isMemoryEnabledForRequest } from '@/ai/memory';
import { recordAIObservabilityEvent } from '@/ai/observability';
import {
  isKnowledgeRetrievalEnabled,
  type SourceCitationMetadata,
} from '@/ai/knowledge';
import {
  createMastraToolRegistry,
  getToolDefinitionByName,
  getToolIdByName,
  getToolPermissionDecisionByName,
  toSafePermissionDecisionMetadata,
} from '@/ai/tools';
import { nanoid } from 'nanoid';
import {
  getAIChatBillingReference,
  resolveAIChatRefundOutcome,
  resolveAIChatRouteErrorBillingOutcome,
  type AIChatBillingAction,
} from './billing-audit';

export const maxDuration = 30;

type ChatRequestBody = {
  readonly messages?: UIMessage[];
  readonly threadId?: string;
  readonly modelId?: string;
  readonly agentId?: string;
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

function asRecord(value: unknown): Record<string, unknown> | undefined {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return undefined;
  }

  return value as Record<string, unknown>;
}

function asToolOutputRecord(value: unknown): Record<string, unknown> {
  return asRecord(value) ?? { value: value ?? null };
}

function asToolInputAuditRecord(
  value: unknown,
  permissionDecision: Record<string, unknown> | undefined
): Record<string, unknown> {
  return {
    input: asRecord(value) ?? { value: value ?? null },
    ...(permissionDecision ? { permissionDecision } : {}),
  };
}

function getToolErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error ?? 'unknown');
}

function withToolAuditMetadata(
  providerMetadata: unknown,
  toolCalls: readonly Record<string, unknown>[],
  permissionDecisions: readonly Record<string, unknown>[] = []
): unknown {
  if (toolCalls.length === 0 && permissionDecisions.length === 0) {
    return providerMetadata;
  }

  const providerMetadataRecord = asRecord(providerMetadata);
  const aelokitMetadata = asRecord(providerMetadataRecord?.aelokit);
  const aelokitToolMetadata = {
    ...(toolCalls.length > 0 ? { toolCalls } : {}),
    ...(permissionDecisions.length > 0 ? { permissionDecisions } : {}),
  };

  if (providerMetadataRecord) {
    return {
      ...providerMetadataRecord,
      aelokit: {
        ...(aelokitMetadata ?? {}),
        ...aelokitToolMetadata,
      },
    };
  }

  return {
    providerMetadata: providerMetadata ?? null,
    aelokit: aelokitToolMetadata,
  };
}

export async function POST(req: Request) {
  const startTime = Date.now();
  let pendingAssistantMessageId: string | undefined;
  let pendingUsageId: string | undefined;
  let pendingReservationId: string | undefined;
  let pendingRuntimeContext: AIRuntimeContext | undefined;
  let pendingResolvedModel: ResolvedModel | undefined;
  let pendingToolPermissionDecisionMetadata: readonly Record<
    string,
    unknown
  >[] = [];
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
    const entitlementCheck = enforceEntitlement(context, {
      allowedModelIds: [],
      knowledgeEnabled: false,
      knowledgeAvailable: true,
      memoryEnabled: false,
      toolsRequested: 0,
      toolsAllowed: false,
      creditsBillingEnabled: false,
      creditsRequired: 0,
    });
    if (!entitlementCheck.allowed && entitlementCheck.error) {
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
      agentId,
      tools,
      memoryEnabled: requestMemoryEnabled,
      knowledgeEnabled: requestKnowledgeEnabled,
    }: ChatRequestBody = await req.json();

    const memoryEnabled = isMemoryEnabledForRequest(requestMemoryEnabled);
    const knowledgeRequested = requestKnowledgeEnabled === true;
    const knowledgeAvailable = isKnowledgeRetrievalEnabled();
    const knowledgeEnabled = knowledgeRequested && knowledgeAvailable;

    const lastUserMessage = getLastUserMessage(messages);
    if (!lastUserMessage) {
      const error = RuntimeErrors.invalidRequest(
        'At least one user message is required.'
      );
      return jsonError(error, 400);
    }

    const existingThreadResult = threadId
      ? await getThread(threadId, context.userId)
      : { success: true as const, data: null };

    if (!existingThreadResult.success) {
      const error = RuntimeErrors.persistenceFailed(
        existingThreadResult.error?.message ??
          'Failed to load the existing chat thread.'
      );
      return jsonError(error, 500);
    }

    const persistedThreadConfig = existingThreadResult.data;
    const requestedAgentId = agentId ?? persistedThreadConfig?.agentId;

    await ensureAIModelCatalog();
    await ensureAIAgentCatalog();
    const agentSelectionResult = await resolveRuntimeAgentSelection({
      requestedAgentId,
    });
    if (!agentSelectionResult.success) {
      const error = RuntimeErrors.forbidden(agentSelectionResult.error.message);
      return jsonError(
        error,
        agentSelectionResult.error.code === 'no-agents-available' ? 503 : 403
      );
    }

    const resolvedAgent = agentSelectionResult.data;
    const agentKnowledgeEnabled =
      knowledgeEnabled && resolvedAgent.agent.features.knowledge;
    const agentMemoryEnabled =
      memoryEnabled && resolvedAgent.agent.features.memory;

    // 5. Resolve model with per-chat > user default > system default.
    let selectedModel: { providerId: 'openai'; modelId: string } | undefined;
    const requestedModelId =
      modelId ??
      persistedThreadConfig?.modelId ??
      resolvedAgent.agent.defaultModelId;
    if (
      !modelId &&
      persistedThreadConfig?.providerId === 'openai' &&
      persistedThreadConfig.modelId
    ) {
      selectedModel = {
        providerId: persistedThreadConfig.providerId,
        modelId: persistedThreadConfig.modelId,
      };
    } else if (requestedModelId) {
      selectedModel = {
        providerId: 'openai' as const,
        modelId: requestedModelId,
      };
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
      agentId: resolvedAgent.agent.id,
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
        agentId: resolvedAgent.agent.id,
        requestedAgentId: agentId,
        agentFallbackFromUnknown: resolvedAgent.fallbackFromUnknown,
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
      selectedAgent: { agentId: resolvedAgent.agent.id },
    };
    pendingRuntimeContext = runtimeContext;
    pendingResolvedModel = resolvedModel;
    const usageId = nanoid();
    pendingUsageId = usageId;
    const creditsBillingEnabled = serverEnv.AI_CREDITS_BILLING_ENABLED;
    const billingMode = getAIUsageBillingMode(creditsBillingEnabled);
    const estimatedRequiredCredits = estimateInitialAICredits(messages);
    const requestedClientToolIds = Object.keys(tools ?? {}).sort();
    const requestedToolCount = requestedClientToolIds.length;
    const selectableModelIds = getAppLocalModelCatalog()
      .filter(isSelectableModel)
      .map((model) => model.id);
    const planPolicy = await getAIEntitlementPolicyForUser(context.userId);
    const toolsAllowed =
      resolvedAgent.agent.features.tools && planPolicy.toolsEnabled;
    const toolRegistry = createMastraToolRegistry({
      userId: context.userId,
      knowledgeEnabled: agentKnowledgeEnabled,
      toolsAllowed,
      allowedToolIds: resolvedAgent.agent.allowedToolIds,
      requestedClientToolIds,
    });
    const toolPermissionDecisionMetadata =
      toolRegistry.permissionDecisions.flatMap((decision) => {
        const metadata = toSafePermissionDecisionMetadata(decision);
        return metadata ? [metadata] : [];
      });
    pendingToolPermissionDecisionMetadata = toolPermissionDecisionMetadata;
    const policyAllowedModelIds =
      planPolicy.allowedModelIds.length > 0
        ? selectableModelIds.filter((modelId) =>
            planPolicy.allowedModelIds.includes(modelId)
          )
        : selectableModelIds;
    const currentCredits = creditsBillingEnabled
      ? await getUserCredits(context.userId)
      : undefined;

    const requestEntitlement = enforceEntitlement(runtimeContext, {
      requestedModelId: resolvedModel.reference.modelId,
      allowedModelIds:
        planPolicy.status === 'enabled' ? policyAllowedModelIds : [],
      toolsRequested: requestedToolCount,
      knowledgeEnabled: knowledgeRequested,
      knowledgeAvailable:
        !knowledgeRequested ||
        (knowledgeAvailable &&
          resolvedAgent.agent.features.knowledge &&
          planPolicy.knowledgeEnabled),
      memoryEnabled: agentMemoryEnabled,
      memoryAvailable: planPolicy.memoryEnabled,
      toolsAllowed,
      creditsBillingEnabled,
      creditsRequired: estimatedRequiredCredits,
      maxCreditsPerRequest: planPolicy.maxCreditsPerRequest,
      currentCredits,
    });

    if (!requestEntitlement.allowed) {
      await updateMessageStatus(assistantMessageId, 'error', new Date());
      await recordUsageAudit({
        ...createUsageAuditEntry(runtimeContext, resolvedModel.reference, {
          status: 'error',
          startedAt: new Date(startTime),
          completedAt: new Date(),
          failureReason: requestEntitlement.error?.code,
          errorMessage: requestEntitlement.error?.message,
          providerMetadata: withToolAuditMetadata(
            undefined,
            [],
            toolPermissionDecisionMetadata
          ),
          providerModelId: resolvedModel.providerModelId,
          requestDurationMs: Date.now() - startTime,
          billingMode,
          billingStatus:
            requestEntitlement.error?.code === 'payment_required'
              ? 'preflight_failed'
              : creditsBillingEnabled
                ? 'no_charge'
                : 'audit_only',
          billingReference: getAIChatBillingReference({
            usageId,
            estimatedCredits: estimatedRequiredCredits,
          }),
        }),
        id: usageId,
      });

      const error =
        requestEntitlement.error?.code === 'forbidden' ||
        requestEntitlement.error?.code === 'payment_required'
          ? RuntimeErrors.forbidden(requestEntitlement.error.message)
          : RuntimeErrors.unauthenticated();

      return jsonError(
        error,
        requestEntitlement.error?.code === 'payment_required'
          ? 402
          : requestEntitlement.error?.code === 'forbidden'
            ? 403
            : 401
      );
    }

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

    let reservedCredits: number | undefined;
    const toolAuditById = new Map<string, Record<string, unknown>>();
    await recordAIObservabilityEvent({
      eventType: 'ai.chat.started',
      severity: 'info',
      userId: context.userId,
      usageId,
      threadId: persistedThread.id,
      messageId: assistantMessageId,
      metadata: {
        providerId: resolvedModel.reference.providerId,
        modelId: resolvedModel.reference.modelId,
        agentId: resolvedAgent.agent.id,
        modelSelectionSource: resolvedModel.source,
        memoryEnabled: agentMemoryEnabled,
        knowledgeEnabled: agentKnowledgeEnabled,
        toolsAllowed,
        requestedClientToolCount: requestedClientToolIds.length,
        deniedClientToolCount: toolRegistry.permissionDecisions.filter(
          (decision) =>
            requestedClientToolIds.includes(decision.request.resource.id) &&
            decision.outcome === 'deny'
        ).length,
        rawContentIncluded: false,
      },
    });

    if (creditsBillingEnabled) {
      reservedCredits = estimatedRequiredCredits;
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
            providerMetadata: withToolAuditMetadata(
              undefined,
              [],
              toolPermissionDecisionMetadata
            ),
            providerModelId: resolvedModel.providerModelId,
            requestDurationMs: Date.now() - startTime,
            billingMode,
            billingStatus: 'preflight_failed',
            billingReference: getAIChatBillingReference({
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
            providerMetadata: withToolAuditMetadata(
              undefined,
              [],
              toolPermissionDecisionMetadata
            ),
            providerModelId: resolvedModel.providerModelId,
            requestDurationMs: Date.now() - startTime,
            billingMode,
            billingStatus: 'reservation_failed',
            billingReference: getAIChatBillingReference({
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
      let billingAction: AIChatBillingAction = creditsBillingEnabled
        ? 'no_charge'
        : 'audit_only';
      let settledCredits: number | undefined;
      let releasedCredits: number | undefined;
      let refundedCredits: number | undefined;
      let overageCredits = 0;
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
            settledCredits = settlementResult.data.settledCredits ?? 0;
            releasedCredits =
              settlementResult.data.releasedCredits ?? undefined;
            refundedCredits =
              settlementResult.data.refundedCredits ?? undefined;
            overageCredits = Math.max(
              0,
              estimatedCredits - (settledCredits ?? 0)
            );
            billingStatus = 'settled';
            billingAction =
              releasedCredits && releasedCredits > 0 ? 'released' : 'settled';
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
            refundedCredits = refundResult.data.refundedCredits ?? undefined;
            const refundOutcome = resolveAIChatRefundOutcome(
              refundResult.data.refundStatus
            );
            billingStatus = refundOutcome.billingStatus;
            billingAction = refundOutcome.billingAction;
            releasedCredits =
              refundOutcome.billingAction === 'released'
                ? refundedCredits
                : undefined;
          } else {
            billingStatus = 'refund_failed';
            billingAction = 'refund_failed';
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
            Array.from(toolAuditById.values()),
            toolPermissionDecisionMetadata
          ),
          providerModelId: resolvedModel.providerModelId,
          requestDurationMs: Date.now() - startTime,
          billingMode,
          billingStatus,
          billingReference: getAIChatBillingReference({
            usageId,
            reservationId: pendingReservationId,
            reservedCredits,
            estimatedCredits,
            settledCredits,
            releasedCredits,
            refundedCredits,
            overageCredits,
            settlementError,
            refundError,
            billingAction,
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
            billingStatus === 'refunded' ||
            billingStatus === 'refund_failed' ||
            settledCredits === 0
              ? 'no_charge'
              : options.status === 'success'
                ? 'final'
                : 'failed',
          metadata: {
            billingMode,
            billingStatus,
            reservationId: pendingReservationId,
            reservedCredits,
            settledCredits,
            releasedCredits,
            refundedCredits,
            overageCredits,
            billingAction,
            finishReason: options.finishReason,
          },
        });
      }
      await recordAIObservabilityEvent({
        eventType:
          options.status === 'success' && !options.isAborted
            ? 'ai.chat.completed'
            : 'ai.chat.failed',
        severity:
          options.status === 'success' && !options.isAborted ? 'info' : 'error',
        userId: context.userId,
        usageId,
        threadId: persistedThread.id,
        messageId: assistantMessageId,
        metadata: {
          status: options.status,
          finishReason: options.finishReason,
          billingMode,
          billingStatus,
          billingAction,
          reservationId: pendingReservationId,
          toolCallCount: toolAuditById.size,
          requestedClientToolCount: requestedClientToolIds.length,
          deniedClientToolCount: toolRegistry.permissionDecisions.filter(
            (decision) =>
              requestedClientToolIds.includes(decision.request.resource.id) &&
              decision.outcome === 'deny'
          ).length,
          knowledgeEnabled: agentKnowledgeEnabled,
          knowledgeError: agentContext.knowledgeError,
          rawContentIncluded: false,
        },
      });
    }

    const agentContext = await buildMastraAgentContext({
      userId: context.userId,
      threadId: persistedThread.id,
      messages,
      lastUserMessage,
      baseSystemPrompt: `${getSystemPrompt()}\n\n${resolvedAgent.agent.instructions}`,
      memoryEnabled: agentMemoryEnabled,
      knowledgeEnabled: agentKnowledgeEnabled,
    });

    const messagesForModel = [...agentContext.inputMessages];
    const memoryContextMessages = [...agentContext.memoryMessages];
    const memoryThreadIds = [...agentContext.memoryThreadIds];
    const knowledgeCitations = agentContext.knowledgeCitations;
    const knowledgeChunks = agentContext.knowledgeChunks;
    const systemPrompt = agentContext.systemPrompt;
    // 7. Stream text from the model
    const runnerResult = await runMastraChat({
      request: chatRequest,
      inputMessages: messagesForModel,
      systemPrompt,
      tools,
      serverTools: toolRegistry.tools,
      memoryEnabled: agentMemoryEnabled,
      memoryResourceId: agentContext.memoryResourceId,
      memoryThreadIds,
      memoryRecallPolicy: agentContext.memoryRecallPolicy,
      knowledgeEnabled: agentKnowledgeEnabled,
      knowledgeRetrievalProvider: agentContext.knowledgeRetrievalProvider,
      knowledgeChunkCount: knowledgeChunks.length,
      knowledgeCitationCount: knowledgeCitations.length,
      abortSignal: req.signal,
      messageMetadata: ({ part }) => {
        if (
          typeof part === 'object' &&
          part !== null &&
          'type' in part &&
          part.type === 'start'
        ) {
          return {
            threadId: persistedThread.id,
            messageId: assistantMessageId,
            providerId: resolvedModel.reference.providerId,
            modelId: resolvedModel.reference.modelId,
            agentId: resolvedAgent.agent.id,
            modelSelectionSource: resolvedModel.source,
            memoryEnabled: agentMemoryEnabled,
            memoryContextCount: memoryContextMessages.length,
            memoryThreadCount: memoryThreadIds.length,
            memoryRecallPolicy: agentContext.memoryRecallPolicy,
            knowledgeEnabled: agentKnowledgeEnabled,
            knowledgeChunkCount: knowledgeChunks.length,
            knowledgeCitationCount: knowledgeCitations.length,
            knowledgeRetrievalProvider: agentContext.knowledgeRetrievalProvider,
            knowledgeError: agentContext.knowledgeError,
          };
        }
        if (
          typeof part === 'object' &&
          part !== null &&
          'type' in part &&
          part.type === 'finish'
        ) {
          const totalUsage =
            'totalUsage' in part ? (part.totalUsage as any) : undefined;
          return {
            totalTokens: totalUsage ? totalUsage.totalTokens : undefined,
            inputTokens: totalUsage ? totalUsage.promptTokens : undefined,
            outputTokens: totalUsage ? totalUsage.completionTokens : undefined,
            citations:
              knowledgeCitations.length > 0 ? knowledgeCitations : undefined,
            knowledgeError: agentContext.knowledgeError,
            knowledgeEnabled: agentKnowledgeEnabled,
          };
        }
        return undefined;
      },
      onAbort: async () => {
        await updateMessageStatus(assistantMessageId, 'aborted', new Date());
        await finalizeUsageOnce({
          status: 'error',
          finishReason: 'aborted',
          isAborted: true,
        });
      },
      onFinish: async (event) => {
        const finishEvent = event as {
          finishReason?: string;
          totalUsage?: unknown;
          providerMetadata?: unknown;
        };

        await finalizeUsageOnce({
          status: finishEvent.finishReason === 'stop' ? 'success' : 'error',
          finishReason: finishEvent.finishReason,
          totalUsage: finishEvent.totalUsage,
          providerMetadata: finishEvent.providerMetadata,
        });
      },
      onError: async (event) => {
        const errorEvent = event as { error?: unknown };
        const streamError = errorEvent.error;

        await updateMessageStatus(assistantMessageId, 'error', new Date());
        await finalizeUsageOnce({
          status: getErrorStatus(streamError),
          error: streamError,
        });
      },
      onToolCallStart: async ({ toolCall }) => {
        const toolId = getToolIdByName(toolRegistry, toolCall.toolName);
        const toolDefinition = getToolDefinitionByName(
          toolRegistry,
          toolCall.toolName
        );
        const permissionDecision = toSafePermissionDecisionMetadata(
          getToolPermissionDecisionByName(toolRegistry, toolCall.toolName)
        );
        const mcpMetadata = toolDefinition?.mcp.compatible
          ? {
              compatible: true,
              name: toolDefinition.mcp.name,
              serverName: toolDefinition.mcp.serverName,
              transport: 'remote-read-only-reserve',
            }
          : undefined;
        toolAuditById.set(toolCall.toolCallId, {
          toolCallId: toolCall.toolCallId,
          toolName: toolCall.toolName,
          toolId,
          permissionDecision,
          mcp: mcpMetadata,
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
          input: asToolInputAuditRecord(toolCall.input, permissionDecision),
          providerExecuted: Boolean(toolCall.providerExecuted),
        });
      },
      onToolCallFinish: async ({ toolCall, success, output, error }) => {
        const existingAudit = toolAuditById.get(toolCall.toolCallId) ?? {};
        const permissionDecision =
          toSafePermissionDecisionMetadata(
            getToolPermissionDecisionByName(toolRegistry, toolCall.toolName)
          ) ?? asRecord(existingAudit.permissionDecision);
        toolAuditById.set(toolCall.toolCallId, {
          ...existingAudit,
          toolCallId: toolCall.toolCallId,
          toolName: toolCall.toolName,
          toolId: getToolIdByName(toolRegistry, toolCall.toolName),
          permissionDecision,
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

    // 8. Return UI message stream response
    const citationsJson =
      knowledgeCitations.length > 0 ? JSON.stringify(knowledgeCitations) : '';
    const stream = createUIMessageStream({
      originalMessages: messages,
      generateId: () => assistantMessageId,
      execute: ({ writer }) => {
        writer.merge(runnerResult.stream);
      },
      onError: () => 'AI response failed while streaming.',
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
          memoryEnabled: agentMemoryEnabled,
          memoryContextCount: memoryContextMessages.length,
          memoryThreadCount: memoryThreadIds.length,
          memoryRecallPolicy: agentContext.memoryRecallPolicy,
          knowledgeEnabled: agentKnowledgeEnabled,
          knowledgeChunkCount: knowledgeChunks.length,
          knowledgeCitationCount: knowledgeCitations.length,
          knowledgeRetrievalProvider: agentContext.knowledgeRetrievalProvider,
          citations: knowledgeCitations,
          knowledgeError: agentContext.knowledgeError,
          agentId: resolvedAgent.agent.id,
          requestedAgentId: agentId,
          agentFallbackFromUnknown: resolvedAgent.fallbackFromUnknown,
          modelSelectionSource: resolvedModel.source,
          providerId: resolvedModel.reference.providerId,
          modelId: resolvedModel.reference.modelId,
        });
        await updateMessageStatus(assistantMessageId, status, new Date());
      },
    });

    return createUIMessageStreamResponse({
      stream,
      consumeSseStream: consumeStream,
      headers: {
        'x-ai-thread-id': persistedThread.id,
        'x-ai-message-id': assistantMessageId,
        'x-ai-agent-id': resolvedAgent.agent.id,
        'x-ai-memory-enabled': String(agentMemoryEnabled),
        'x-ai-memory-context-count': String(memoryContextMessages.length),
        'x-ai-knowledge-enabled': String(agentKnowledgeEnabled),
        'x-ai-knowledge-chunk-count': String(knowledgeChunks.length),
        ...(citationsJson ? { 'x-ai-knowledge-citations': citationsJson } : {}),
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

      const billingOutcome = resolveAIChatRouteErrorBillingOutcome({
        creditsBillingEnabled,
        hasReservation: Boolean(pendingReservationId),
        refundSucceeded: refundResult?.success,
        refundStatus: refundResult?.success
          ? refundResult.data.refundStatus
          : undefined,
      });

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
            providerMetadata: withToolAuditMetadata(
              undefined,
              [],
              pendingToolPermissionDecisionMetadata
            ),
            providerModelId: pendingResolvedModel.providerModelId,
            requestDurationMs: Date.now() - startTime,
            billingMode: getAIUsageBillingMode(creditsBillingEnabled),
            billingStatus: billingOutcome.billingStatus,
            billingReference: getAIChatBillingReference({
              usageId: pendingUsageId,
              reservationId: pendingReservationId,
              releasedCredits:
                billingOutcome.billingAction === 'released' &&
                refundResult?.success
                  ? refundResult.data.refundedCredits
                  : undefined,
              refundedCredits:
                billingOutcome.billingAction === 'refunded' &&
                refundResult?.success
                  ? refundResult.data.refundedCredits
                  : undefined,
              refundError: refundResult?.success
                ? undefined
                : refundResult?.error.message,
              billingAction: billingOutcome.billingAction,
            }),
          }
        ),
        id: pendingUsageId,
      });
    }

    return jsonError(runtimeError, 500);
  }
}
