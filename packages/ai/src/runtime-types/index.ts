import type { AIAgentReference, AIAgentSelectionReference } from '../agents';
import type { AIError } from '../errors';
import type { AIKnowledgeBaseReference } from '../knowledge';
import type { AIMemoryReference } from '../memory';
import type { AIModelReference, AIModelSelectionReference } from '../models';
import type { AIPermissionDecision } from '../permissions';
import type { AIProviderId } from '../providers';
import type {
  AIToolCallStatus,
  AIToolDefinitionId,
  AIToolExecutionSurface,
} from '../tools';
import type { AIUsageTokenUsage } from '../usage';

export type AIRuntimeRequestId = string;

export type AIRuntimeUserId = string;

export type AIRuntimeSessionId = string;

export type AIRuntimeThreadId = string;

export type AIRuntimeMessageId = string;

export type AIRuntimeLocale = string;

export type AIRuntimeCurrencyCode = string;

export type AIRuntimeEntitlementId = string;

export type AIRuntimePolicyId = string;

export type AIRuntimeRequestKind =
  | 'chat'
  | 'completion'
  | 'embedding-reserved'
  | 'tool-execute'
  | 'agent-run';

export type AIRuntimeRequestStatus =
  | 'pending'
  | 'validating'
  | 'running'
  | 'streaming'
  | 'succeeded'
  | 'failed'
  | 'cancelled';

export type AIRuntimeFailureReason =
  | 'validation-failed'
  | 'permission-denied'
  | 'provider-unavailable'
  | 'model-unavailable'
  | 'rate-limited'
  | 'timeout'
  | 'cancelled'
  | 'unknown';

export interface AIRuntimeUserReference {
  readonly userId: AIRuntimeUserId;
  readonly sessionId?: AIRuntimeSessionId;
  readonly email?: string;
  readonly displayName?: string;
}

export interface AIRuntimeSessionReference {
  readonly sessionId: AIRuntimeSessionId;
  readonly userId: AIRuntimeUserId;
  readonly startedAt?: string;
  readonly expiresAt?: string;
}

export interface AIRuntimeLocaleContext {
  readonly locale: AIRuntimeLocale;
  readonly timezone?: string;
  readonly currency?: AIRuntimeCurrencyCode;
}

export interface AIRuntimeEntitlementContext {
  readonly entitlementId?: AIRuntimeEntitlementId;
  readonly planId?: string;
  readonly features: Readonly<string>;
  readonly limits?: Readonly<Record<string, number>>;
  readonly usageQuotaRemaining?: number;
}

export interface AIRuntimePolicyContext {
  readonly policyId?: AIRuntimePolicyId;
  readonly allowedProviders?: ReadonlyArray<AIProviderId>;
  readonly allowedModels?: ReadonlyArray<AIModelReference>;
  readonly allowedAgents?: ReadonlyArray<AIAgentReference>;
  readonly maxTokens?: number;
  readonly requirePermissionForTools?: boolean;
}

export interface AIRuntimeModelSettingsContext {
  readonly systemDefaultModel?: AIModelReference;
  readonly userDefaultModel?: AIModelReference;
  readonly threadModel?: AIModelReference;
  readonly agentDefaultModel?: AIModelReference;
}

export interface AIRuntimeAuthContext {
  readonly user: AIRuntimeUserReference;
  readonly session?: AIRuntimeSessionReference;
  readonly isAuthenticated: boolean;
}

export interface AIRuntimeRequestContext {
  readonly requestId: AIRuntimeRequestId;
  readonly kind: AIRuntimeRequestKind;
  readonly auth: AIRuntimeAuthContext;
  readonly locale?: AIRuntimeLocaleContext;
  readonly entitlement?: AIRuntimeEntitlementContext;
  readonly policy?: AIRuntimePolicyContext;
  readonly modelSettings?: AIRuntimeModelSettingsContext;
  readonly metadata?: Readonly<Record<string, unknown>>;
}

export interface AIRuntimeModelSelection {
  readonly selected: AIModelSelectionReference;
  readonly available: ReadonlyArray<AIModelReference>;
  readonly fallbackChain?: ReadonlyArray<AIModelReference>;
  readonly selectionReason?:
    | 'user-explicit'
    | 'thread-setting'
    | 'user-default'
    | 'agent-default'
    | 'system-default'
    | 'fallback';
}

export interface AIRuntimeAgentSelection {
  readonly selected: AIAgentSelectionReference;
  readonly available: ReadonlyArray<AIAgentReference>;
  readonly selectionReason?:
    | 'user-explicit'
    | 'thread-setting'
    | 'system-default';
}

export interface AIRuntimeSelectionContext {
  readonly model: AIRuntimeModelSelection;
  readonly agent?: AIRuntimeAgentSelection;
  readonly memory?: ReadonlyArray<AIMemoryReference>;
  readonly knowledge?: ReadonlyArray<AIKnowledgeBaseReference>;
}

export type AIRuntimeToolCallPhase =
  | 'requested'
  | 'validating-permission'
  | 'permission-granted'
  | 'permission-denied'
  | 'executing'
  | 'streaming-result'
  | 'completed'
  | 'failed'
  | 'cancelled';

export interface AIRuntimeToolCallLifecycle {
  readonly callId: string;
  readonly toolId: AIToolDefinitionId;
  readonly toolName: string;
  readonly phase: AIRuntimeToolCallPhase;
  readonly status: AIToolCallStatus;
  readonly permission?: AIPermissionDecision;
  readonly input?: AIToolExecutionSurface['input'];
  readonly output?: AIToolExecutionSurface['output'];
  readonly error?: AIError;
  readonly startedAt?: string;
  readonly completedAt?: string;
  readonly durationMs?: number;
}

export interface AIRuntimeToolCallEvent {
  readonly callId: string;
  readonly toolId: AIToolDefinitionId;
  readonly phase: AIRuntimeToolCallPhase;
  readonly previousPhase?: AIRuntimeToolCallPhase;
  readonly permission?: AIPermissionDecision;
  readonly error?: AIError;
  readonly occurredAt: string;
}

export type AIRuntimeStreamEventType =
  | 'stream-start'
  | 'text-delta'
  | 'reasoning-delta'
  | 'tool-call-start'
  | 'tool-call-delta'
  | 'tool-call-result'
  | 'source-citation'
  | 'usage-update'
  | 'finish'
  | 'error';

export interface AIRuntimeStreamMetadata {
  readonly requestId: AIRuntimeRequestId;
  readonly threadId?: AIRuntimeThreadId;
  readonly messageId?: AIRuntimeMessageId;
  readonly model: AIModelReference;
  readonly agent?: AIAgentReference;
  readonly startedAt?: string;
  readonly completedAt?: string;
  readonly finishReason?:
    | 'stop'
    | 'length'
    | 'content-filter'
    | 'tool-calls'
    | 'error'
    | 'cancelled';
}

export interface AIRuntimeStreamEventBase {
  readonly type: AIRuntimeStreamEventType;
  readonly metadata: AIRuntimeStreamMetadata;
  readonly occurredAt: string;
}

export interface AIRuntimeStreamStartEvent extends AIRuntimeStreamEventBase {
  readonly type: 'stream-start';
}

export interface AIRuntimeTextDeltaEvent extends AIRuntimeStreamEventBase {
  readonly type: 'text-delta';
  readonly delta: string;
  readonly accumulatedLength?: number;
}

export interface AIRuntimeReasoningDeltaEvent extends AIRuntimeStreamEventBase {
  readonly type: 'reasoning-delta';
  readonly delta: string;
}

export interface AIRuntimeToolCallStartEvent extends AIRuntimeStreamEventBase {
  readonly type: 'tool-call-start';
  readonly toolCall: AIRuntimeToolCallLifecycle;
}

export interface AIRuntimeToolCallDeltaEvent extends AIRuntimeStreamEventBase {
  readonly type: 'tool-call-delta';
  readonly callId: string;
  readonly delta?: unknown;
}

export interface AIRuntimeToolCallResultEvent extends AIRuntimeStreamEventBase {
  readonly type: 'tool-call-result';
  readonly toolCall: AIRuntimeToolCallLifecycle;
}

export interface AIRuntimeSourceCitationEvent extends AIRuntimeStreamEventBase {
  readonly type: 'source-citation';
  readonly sourceId: string;
  readonly title?: string;
  readonly url?: string;
  readonly quotedText?: string;
}

export interface AIRuntimeUsageUpdateEvent extends AIRuntimeStreamEventBase {
  readonly type: 'usage-update';
  readonly usage: AIUsageTokenUsage;
  readonly cumulative?: boolean;
}

export interface AIRuntimeFinishEvent extends AIRuntimeStreamEventBase {
  readonly type: 'finish';
  readonly finishReason: AIRuntimeStreamMetadata['finishReason'];
  readonly finalUsage?: AIUsageTokenUsage;
}

export interface AIRuntimeErrorEvent extends AIRuntimeStreamEventBase {
  readonly type: 'error';
  readonly error: AIError;
}

export type AIRuntimeStreamEvent =
  | AIRuntimeStreamStartEvent
  | AIRuntimeTextDeltaEvent
  | AIRuntimeReasoningDeltaEvent
  | AIRuntimeToolCallStartEvent
  | AIRuntimeToolCallDeltaEvent
  | AIRuntimeToolCallResultEvent
  | AIRuntimeSourceCitationEvent
  | AIRuntimeUsageUpdateEvent
  | AIRuntimeFinishEvent
  | AIRuntimeErrorEvent;

export interface AIRuntimeRequestResult {
  readonly requestId: AIRuntimeRequestId;
  readonly status: AIRuntimeRequestStatus;
  readonly model: AIModelReference;
  readonly agent?: AIAgentReference;
  readonly usage?: AIUsageTokenUsage;
  readonly error?: AIError;
  readonly startedAt: string;
  readonly completedAt?: string;
  readonly durationMs?: number;
}

export interface AIRuntimeFailureResult {
  readonly requestId: AIRuntimeRequestId;
  readonly status: 'failed';
  readonly reason: AIRuntimeFailureReason;
  readonly error: AIError;
  readonly occurredAt: string;
}
