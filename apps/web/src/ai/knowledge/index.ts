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
  PARTIAL_UNTIL_WIRED as INGESTION_PARTIAL_UNTIL_WIRED,
} from './ingestion';
export type {
  KnowledgeSourceRecord,
  KnowledgeDocumentRecord,
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
    mode: 'response-only',
    reason:
      'Citations are returned in response metadata and stream headers. ' +
      'They are NOT persisted to ai_message_part by default in v0.3. ' +
      'TASK-009 may add UI rendering and optional persistence.',
    provenancePath:
      'Provenance is carried through stream response headers (x-ai-knowledge-citations) ' +
      'and can be reconstructed from vector store metadata.',
  },
} as const;
