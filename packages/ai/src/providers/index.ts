export type AIProviderId = string;

export type AIProviderCapability =
  | 'chat'
  | 'completion'
  | 'embedding'
  | 'image-input'
  | 'json-mode'
  | 'streaming'
  | 'structured-output'
  | 'tool-calling';

export type AIProviderEnabledStatus = 'enabled' | 'disabled' | 'deprecated';

export interface AIProviderDisplayMetadata {
  readonly name: string;
  readonly description?: string;
  readonly documentationUrl?: string;
}

export interface AIProviderOrdering {
  readonly defaultOrder: number;
}

export interface AIProvider {
  readonly id: AIProviderId;
  readonly display: AIProviderDisplayMetadata;
  // Capabilities describe registry support only; they do not imply SDK availability.
  readonly capabilities: ReadonlyArray<AIProviderCapability>;
  readonly status: AIProviderEnabledStatus;
  readonly ordering: AIProviderOrdering;
}

export interface AISystemDefaultProviderReference {
  readonly providerId: AIProviderId;
}

export type AIProviderFallbackReason =
  | 'provider-disabled'
  | 'provider-deprecated'
  | 'provider-unavailable'
  | 'provider-not-configured';

export interface AIProviderFallbackPolicy {
  readonly preferredProviderId: AIProviderId;
  readonly fallbackProviderIds: ReadonlyArray<AIProviderId>;
  // Fallback is a selection contract for app/runtime layers, not runtime execution.
  readonly reason?: AIProviderFallbackReason;
}
