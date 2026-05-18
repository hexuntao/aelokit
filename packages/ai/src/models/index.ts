import type { AIProviderId } from '../providers';

export type AIModelId = string;

export type AIModelCapability =
  | 'chat'
  | 'completion'
  | 'embedding'
  | 'image-input'
  | 'json-mode'
  | 'streaming'
  | 'structured-output'
  | 'tool-calling';

export type AIModelEnabledStatus = 'enabled' | 'disabled' | 'deprecated';

export interface AIModelDisplayMetadata {
  readonly name: string;
  readonly description?: string;
}

export interface AIModelContextWindow {
  readonly contextWindowTokens: number;
  readonly maxOutputTokens?: number;
}

export interface AIModelTokenMetadata {
  readonly inputTokenUnit?: 'token';
  readonly outputTokenUnit?: 'token';
}

export interface AIModelCostMetadataReserve {
  readonly currencyCode?: string;
  readonly inputCostPerMillionTokens?: number;
  readonly outputCostPerMillionTokens?: number;
  readonly cachedInputCostPerMillionTokens?: number;
  readonly updatedAt?: string;
}

export interface AIModel {
  readonly id: AIModelId;
  readonly providerId: AIProviderId;
  readonly providerModelId: string;
  readonly display: AIModelDisplayMetadata;
  readonly capabilities: ReadonlyArray<AIModelCapability>;
  readonly status: AIModelEnabledStatus;
  readonly contextWindow: AIModelContextWindow;
  readonly tokenMetadata?: AIModelTokenMetadata;
  // Reserved for future usage audit and cost estimation; not pricing UI or billing.
  readonly costMetadata?: AIModelCostMetadataReserve;
}

export interface AIModelReference {
  readonly providerId: AIProviderId;
  readonly modelId: AIModelId;
}

export type AISystemDefaultModelReference = AIModelReference;

export interface AIUserDefaultModelReference extends AIModelReference {
  readonly userId: string;
}

export interface AIThreadModelReference extends AIModelReference {
  readonly threadId: string;
}

export type AIModelFallbackReason =
  | 'model-disabled'
  | 'model-deprecated'
  | 'model-unavailable'
  | 'model-not-configured'
  | 'capability-not-supported';

export interface AIModelFallbackPolicy {
  readonly preferredModel: AIModelReference;
  readonly fallbackModels: ReadonlyArray<AIModelReference>;
  // App/runtime layers interpret this order when user or thread selection cannot be used.
  readonly reason?: AIModelFallbackReason;
}

export type AIModelSelectionSource =
  | 'system-default'
  | 'user-default'
  | 'thread';

export interface AIModelSelectionReference extends AIModelReference {
  readonly source: AIModelSelectionSource;
  readonly fallback?: AIModelFallbackPolicy;
}
