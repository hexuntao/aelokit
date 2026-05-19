export type AIKnowledgeBaseId = string;

export type AIKnowledgeDocumentId = string;

export type AIKnowledgeChunkId = string;

export type AIKnowledgeSourceId = string;

export type AIKnowledgeCitationId = string;

export type AIKnowledgeSourceKind =
  | 'uploaded-file'
  | 'url'
  | 'manual-note'
  | 'integration'
  | 'external-reference';

export type AIKnowledgeDocumentStatus =
  | 'draft'
  | 'indexing-reserved'
  | 'ready'
  | 'archived'
  | 'failed';

export type AIKnowledgeSourceVisibility = 'private' | 'shared' | 'public';

export interface AIKnowledgeSourceOwnership {
  readonly sourceId: AIKnowledgeSourceId;
  readonly userId: string;
  readonly visibility: AIKnowledgeSourceVisibility;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface AIKnowledgeSourceAccessPolicy {
  readonly sourceId: AIKnowledgeSourceId;
  readonly ownerUserId: string;
  readonly visibility: AIKnowledgeSourceVisibility;
  readonly allowedUserIds?: readonly string[];
}

export interface AIKnowledgeBaseReference {
  readonly knowledgeBaseId: AIKnowledgeBaseId;
}

export interface AIKnowledgeSource {
  readonly id: AIKnowledgeSourceId;
  readonly kind: AIKnowledgeSourceKind;
  readonly title?: string;
  readonly uri?: string;
  readonly contentType?: string;
  readonly capturedAt?: string;
}

export interface AIKnowledgeDocument {
  readonly id: AIKnowledgeDocumentId;
  readonly knowledgeBaseId: AIKnowledgeBaseId;
  readonly sourceId: AIKnowledgeSourceId;
  readonly title: string;
  readonly status: AIKnowledgeDocumentStatus;
  readonly metadata?: Readonly<Record<string, string>>;
  readonly createdAt?: string;
  readonly updatedAt?: string;
}

export interface AIKnowledgeChunkLocation {
  readonly pageNumber?: number;
  readonly sectionTitle?: string;
  readonly startOffset?: number;
  readonly endOffset?: number;
}

export interface AIKnowledgeChunk {
  readonly id: AIKnowledgeChunkId;
  readonly documentId: AIKnowledgeDocumentId;
  readonly sourceId: AIKnowledgeSourceId;
  readonly text: string;
  readonly location?: AIKnowledgeChunkLocation;
  // Knowledge is source-grounded retrievable content; provenance must survive retrieval.
  readonly provenance: AIKnowledgeProvenance;
}

export interface AIKnowledgeProvenance {
  readonly sourceId: AIKnowledgeSourceId;
  readonly documentId?: AIKnowledgeDocumentId;
  readonly chunkId?: AIKnowledgeChunkId;
  readonly sourceUri?: string;
  readonly sourceTitle?: string;
}

export interface AIKnowledgeRetrievalMetadata {
  readonly query: string;
  readonly retrievalMode?: 'keyword' | 'semantic-reserved' | 'hybrid-reserved';
  readonly score?: number;
  readonly rank?: number;
}

export interface AIKnowledgeCitation {
  readonly id: AIKnowledgeCitationId;
  readonly provenance: AIKnowledgeProvenance;
  readonly quotedText?: string;
  readonly retrieval?: AIKnowledgeRetrievalMetadata;
}

export interface AIKnowledgeRetrievalReference {
  readonly chunkId: AIKnowledgeChunkId;
  readonly citationId?: AIKnowledgeCitationId;
  readonly retrieval: AIKnowledgeRetrievalMetadata;
}

export interface AIKnowledgeIngestionConfig {
  readonly chunkStrategy: 'recursive' | 'character' | 'token' | 'sentence';
  readonly chunkSize: number;
  readonly chunkOverlap: number;
  readonly embeddingModel: string;
  readonly embeddingDimensions?: number;
}

export interface AIKnowledgeIngestionResult {
  readonly sourceId: AIKnowledgeSourceId;
  readonly documentId: AIKnowledgeDocumentId;
  readonly chunkCount: number;
  readonly vectorCount: number;
  readonly status: 'success' | 'partial' | 'failed';
  readonly error?: string;
  readonly indexedAt: string;
}

export interface AIKnowledgeManualSourceInput {
  readonly title: string;
  readonly text: string;
  readonly userId: string;
  readonly visibility?: AIKnowledgeSourceVisibility;
}
