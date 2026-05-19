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

export const PARTIAL_UNTIL_WIRED = true;

export const KNOWLEDGE_SKELETON_STATUS = 'PARTIAL_UNTIL_WIRED' as const;

export const KNOWLEDGE_SKELETON_NOTE =
  'This knowledge ingestion service provides minimal manual text source ingestion using Mastra RAG. ' +
  'Supports chunking, embedding, and vector storage. ' +
  'Retrieval is NOT wired to chat route - that belongs to TASK-008.';
