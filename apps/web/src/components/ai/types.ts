import type { UIMessage } from 'ai';

export interface CitationMetadata {
  readonly sourceId: string;
  readonly title: string;
  readonly documentId: string;
  readonly chunkId: string;
  readonly provenance: string;
  readonly score: number;
  readonly provider: string;
}

export interface ChatMessageMetadata {
  readonly threadId?: string;
  readonly messageId?: string;
  readonly providerId?: string;
  readonly modelId?: string;
  readonly totalTokens?: number;
  readonly inputTokens?: number;
  readonly outputTokens?: number;
  readonly citations?: readonly CitationMetadata[];
  readonly knowledgeEnabled?: boolean;
}

export type ChatUIMessage = UIMessage<ChatMessageMetadata>;

export interface ChatModelOption {
  readonly providerId: string;
  readonly modelId: string;
  readonly providerLabel: string;
  readonly modelLabel: string;
  readonly label: string;
}

export interface ChatThreadSummary {
  readonly id: string;
  readonly title?: string;
  readonly status: 'active' | 'archived' | 'deleted';
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly providerId?: string;
  readonly providerName?: string;
  readonly modelId?: string;
  readonly modelName?: string;
}

export interface ChatThreadState {
  readonly thread: ChatThreadSummary;
  readonly messages: readonly ChatUIMessage[];
}
