import type { AIAgentReference } from '../../agents';
import type { AIError } from '../../errors';
import type { AIModelReference } from '../../models';
import type { AIPermissionDecision } from '../../permissions';
import type { AIProviderId } from '../../providers';
import type { AIToolCallStatus, AIToolDefinitionId } from '../../tools';
import type { AIUsageTokenUsage } from '../../usage';

export type AIVercelAISDKMessageId = string;

export type AIVercelAISDKToolCallId = string;

export type AIVercelAISDKStreamId = string;

export type AIVercelAISDKMessageRole = 'system' | 'user' | 'assistant' | 'tool';

export type AIVercelAISDKFinishReason =
  | 'stop'
  | 'length'
  | 'content-filter'
  | 'tool-calls'
  | 'error'
  | 'cancelled'
  | 'unknown';

export type AIVercelAISDKToolPartState =
  | 'input-streaming'
  | 'input-available'
  | 'output-available'
  | 'output-error';

export type AIVercelAISDKStreamEventType =
  | 'stream-start'
  | 'text-delta'
  | 'reasoning-delta'
  | 'tool-call-start'
  | 'tool-call-delta'
  | 'tool-call-result'
  | 'source'
  | 'usage'
  | 'finish'
  | 'error';

export type AIVercelAISDKSerializableMetadata = Readonly<
  Record<string, unknown>
>;

export interface AIVercelAISDKTextPart {
  readonly type: 'text';
  readonly text: string;
  readonly metadata?: AIVercelAISDKSerializableMetadata;
}

export interface AIVercelAISDKReasoningPart {
  readonly type: 'reasoning';
  readonly text: string;
  readonly metadata?: AIVercelAISDKSerializableMetadata;
}

export interface AIVercelAISDKToolCallPart {
  readonly type: 'tool-call';
  readonly toolCallId: AIVercelAISDKToolCallId;
  readonly toolId?: AIToolDefinitionId;
  readonly toolName: string;
  readonly state: AIVercelAISDKToolPartState;
  // Tool inputs and outputs stay unknown until the app/runtime layer validates schemas.
  readonly input?: unknown;
  readonly output?: unknown;
  readonly errorText?: string;
  readonly metadata?: AIVercelAISDKSerializableMetadata;
}

export interface AIVercelAISDKFilePart {
  readonly type: 'file';
  readonly mediaType: string;
  readonly filename?: string;
  readonly url?: string;
  readonly metadata?: AIVercelAISDKSerializableMetadata;
}

export interface AIVercelAISDKSourcePart {
  readonly type: 'source';
  readonly sourceId: string;
  readonly title?: string;
  readonly url?: string;
  readonly metadata?: AIVercelAISDKSerializableMetadata;
}

export type AIVercelAISDKUIMessagePart =
  | AIVercelAISDKTextPart
  | AIVercelAISDKReasoningPart
  | AIVercelAISDKToolCallPart
  | AIVercelAISDKFilePart
  | AIVercelAISDKSourcePart;

export interface AIVercelAISDKUIMessage {
  readonly id: AIVercelAISDKMessageId;
  readonly role: AIVercelAISDKMessageRole;
  // This mirrors AI SDK UI message shape structurally without importing the runtime package.
  readonly parts: ReadonlyArray<AIVercelAISDKUIMessagePart>;
  readonly metadata?: AIVercelAISDKSerializableMetadata;
}

export interface AIVercelAISDKModelMessage {
  readonly role: AIVercelAISDKMessageRole;
  // Model message content is intentionally structural because v0.1 must not depend on AI SDK runtime types.
  readonly content: string | ReadonlyArray<AIVercelAISDKUIMessagePart>;
  readonly metadata?: AIVercelAISDKSerializableMetadata;
}

export interface AIVercelAISDKUIMessageMappingReserve {
  readonly sourceMessages: ReadonlyArray<AIVercelAISDKUIMessage>;
  readonly modelMessages: ReadonlyArray<AIVercelAISDKModelMessage>;
  readonly model: AIModelReference;
  readonly agent?: AIAgentReference;
  readonly metadata?: AIVercelAISDKSerializableMetadata;
}

export interface AIVercelAISDKStreamRequestReference {
  readonly streamId?: AIVercelAISDKStreamId;
  readonly userId?: string;
  readonly threadId?: string;
  readonly messageId?: string;
}

export interface AIVercelAISDKStreamModelMetadata {
  readonly providerId: AIProviderId;
  readonly model: AIModelReference;
  readonly providerModelId?: string;
}

export interface AIVercelAISDKStreamMetadata {
  readonly request: AIVercelAISDKStreamRequestReference;
  readonly model: AIVercelAISDKStreamModelMetadata;
  readonly agent?: AIAgentReference;
  readonly startedAt?: string;
  readonly completedAt?: string;
  readonly usage?: AIUsageTokenUsage;
  readonly finishReason?: AIVercelAISDKFinishReason;
  // Stream metadata is audit reserve only; it is not a Response, stream controller, or AI SDK runtime object.
  readonly metadata?: AIVercelAISDKSerializableMetadata;
}

export interface AIVercelAISDKToolCallStreamState {
  readonly toolCallId: AIVercelAISDKToolCallId;
  readonly toolId?: AIToolDefinitionId;
  readonly toolName: string;
  readonly status: AIToolCallStatus;
  readonly permission?: AIPermissionDecision;
  readonly input?: unknown;
  readonly output?: unknown;
  readonly error?: AIError;
}

export interface AIVercelAISDKStreamEventBase {
  readonly type: AIVercelAISDKStreamEventType;
  readonly metadata: AIVercelAISDKStreamMetadata;
}

export interface AIVercelAISDKTextDeltaStreamEvent
  extends AIVercelAISDKStreamEventBase {
  readonly type: 'text-delta';
  readonly delta: string;
}

export interface AIVercelAISDKReasoningDeltaStreamEvent
  extends AIVercelAISDKStreamEventBase {
  readonly type: 'reasoning-delta';
  readonly delta: string;
}

export interface AIVercelAISDKToolCallStreamEvent
  extends AIVercelAISDKStreamEventBase {
  readonly type: 'tool-call-start' | 'tool-call-delta' | 'tool-call-result';
  // Tool call stream events reserve AI SDK-compatible lifecycle data without executing tools.
  readonly toolCall: AIVercelAISDKToolCallStreamState;
}

export interface AIVercelAISDKSourceStreamEvent
  extends AIVercelAISDKStreamEventBase {
  readonly type: 'source';
  readonly source: AIVercelAISDKSourcePart;
}

export interface AIVercelAISDKUsageStreamEvent
  extends AIVercelAISDKStreamEventBase {
  readonly type: 'usage';
  readonly usage: AIUsageTokenUsage;
}

export interface AIVercelAISDKFinishStreamEvent
  extends AIVercelAISDKStreamEventBase {
  readonly type: 'finish';
  readonly finishReason: AIVercelAISDKFinishReason;
}

export interface AIVercelAISDKErrorStreamEvent
  extends AIVercelAISDKStreamEventBase {
  readonly type: 'error';
  readonly error: AIError;
}

export interface AIVercelAISDKStreamStartEvent
  extends AIVercelAISDKStreamEventBase {
  readonly type: 'stream-start';
}

export type AIVercelAISDKStreamEvent =
  | AIVercelAISDKStreamStartEvent
  | AIVercelAISDKTextDeltaStreamEvent
  | AIVercelAISDKReasoningDeltaStreamEvent
  | AIVercelAISDKToolCallStreamEvent
  | AIVercelAISDKSourceStreamEvent
  | AIVercelAISDKUsageStreamEvent
  | AIVercelAISDKFinishStreamEvent
  | AIVercelAISDKErrorStreamEvent;
