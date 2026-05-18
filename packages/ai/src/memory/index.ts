import type { AIAgentId } from '../agents';

export type AIMemoryId = string;

export type AIMemoryOwnerType = 'user' | 'agent' | 'workspace' | 'thread';

export type AIMemoryKind =
  | 'preference'
  | 'project-context'
  | 'behavioral-pattern'
  | 'instruction-note'
  | 'summary';

export type AIMemoryStatus = 'active' | 'archived' | 'deleted';

export type AIMemoryConfidence = 'low' | 'medium' | 'high' | 'confirmed';

export interface AIMemoryOwnerReference {
  readonly type: AIMemoryOwnerType;
  readonly id: string;
}

export interface AIMemorySourceReference {
  readonly threadId?: string;
  readonly messageId?: string;
  readonly agentId?: AIAgentId;
  readonly capturedAt?: string;
}

export interface AIMemoryContent {
  readonly title?: string;
  readonly text: string;
  readonly tags?: ReadonlyArray<string>;
}

export interface AIMemoryRetentionPolicyReference {
  readonly policyId?: string;
  readonly expiresAt?: string;
  readonly userEditable: boolean;
  readonly userDeletable: boolean;
}

export interface AIMemory {
  readonly id: AIMemoryId;
  readonly owner: AIMemoryOwnerReference;
  readonly kind: AIMemoryKind;
  readonly status: AIMemoryStatus;
  readonly confidence: AIMemoryConfidence;
  // Memory is durable behavioral/context state; it is not source-grounded retrieval content.
  readonly content: AIMemoryContent;
  readonly source?: AIMemorySourceReference;
  readonly retention: AIMemoryRetentionPolicyReference;
  readonly createdAt?: string;
  readonly updatedAt?: string;
}

export interface AIMemoryReference {
  readonly memoryId: AIMemoryId;
}

export interface AIMemoryRecallReference extends AIMemoryReference {
  readonly reason?: string;
  readonly relevanceScore?: number;
}
