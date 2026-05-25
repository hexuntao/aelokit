import 'server-only';

export {
  resolveKnowledgeRuntimeConfig,
  resolveKnowledgeIngestionConfig,
  isEmbeddingProviderConfigured,
  PARTIAL_UNTIL_WIRED as CONFIG_PARTIAL_UNTIL_WIRED,
} from './config';
export {
  createKnowledgeVectorStore,
  getKnowledgeVectorStore,
  ensureKnowledgeVectorIndex,
  deleteKnowledgeVectorsByIds,
  KNOWLEDGE_INDEX_NAME,
} from './vector';
export {
  createEmbeddingModel,
  generateEmbeddings,
  generateSingleEmbedding,
  PARTIAL_UNTIL_WIRED as EMBEDDING_PARTIAL_UNTIL_WIRED,
} from './embedding';
export {
  chunkText,
  chunkMarkdown,
  PARTIAL_UNTIL_WIRED as CHUNKING_PARTIAL_UNTIL_WIRED,
} from './chunking';
export {
  ingestManualKnowledgeSource,
  getKnowledgeSource,
  getKnowledgeDocument,
  listUserKnowledgeSources,
  getSourceOwnership,
  archiveKnowledgeSource,
  deleteKnowledgeSource,
  PARTIAL_UNTIL_WIRED as INGESTION_PARTIAL_UNTIL_WIRED,
} from './ingestion';
export type {
  KnowledgeSourceRecord,
  KnowledgeDocumentRecord,
  DeleteKnowledgeSourceResult,
} from './ingestion';
export {
  retrieveKnowledgeContext,
  formatRetrievalContextForPrompt,
  isKnowledgeRetrievalEnabled,
  RETRIEVAL_WIRED,
} from './retrieval';
export type {
  RetrievedChunk,
  SourceCitationMetadata,
  KnowledgeRetrievalResult,
  KnowledgeRetrievalOptions,
} from './retrieval';

export const KNOWLEDGE_RETRIEVAL_WIRED = true;

export const SOURCE_CITATION_METADATA_SHAPE = {
  description:
    'Source/citation metadata shape for knowledge retrieval results. ' +
    'Each citation includes: sourceId (unique source identifier), ' +
    'title (human-readable source title), documentId (reference to indexed document), ' +
    'chunkId (reference to specific chunk), provenance (origin information), ' +
    'score (relevance score from retrieval), provider (embedding provider used).',
  fields: {
    sourceId: 'string - unique identifier for the source',
    title: 'string - human-readable source title',
    documentId: 'string - reference to the indexed document',
    chunkId: 'string - reference to the indexed chunk',
    provenance:
      'string - origin information (e.g., "manual-note:sourceId" or URL)',
    score: 'number - relevance score from vector similarity search',
    provider:
      'string - retrieval/embedding provider used (e.g., "openai-embedding")',
  },
  persistence: {
    mode: 'message-source-parts',
    reason:
      'Citations are returned in response metadata and stream headers for live ' +
      'display, and v0.4 persists compact citation snapshots as source message ' +
      'parts in ai_message_part without schema changes.',
    provenancePath:
      'Provenance is carried through stream response headers (x-ai-knowledge-citations) ' +
      'and response message metadata for immediate UI rendering. Historical ' +
      'replay uses persisted source message parts with source/document/chunk ' +
      'metadata and does not rerun retrieval as historical evidence.',
  },
} as const;
