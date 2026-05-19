import { sql } from 'drizzle-orm';
import {
  check,
  index,
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
} from 'drizzle-orm/pg-core';
import { user } from './auth.schema';

// Knowledge source kind enum
export const knowledgeSourceKindEnum = pgEnum('knowledge_source_kind', [
  'manual-note', // Manual text input (TASK-007)
  'uploaded-file', // File upload (future)
  'url', // URL crawl (future)
  'integration', // External integration (future)
]);

// Knowledge source visibility enum
export const knowledgeSourceVisibilityEnum = pgEnum(
  'knowledge_source_visibility',
  ['private', 'shared', 'public']
);

// Knowledge source status enum
export const knowledgeSourceStatusEnum = pgEnum('knowledge_source_status', [
  'draft', // Draft, not indexed
  'indexing', // Currently being indexed
  'ready', // Ready for retrieval
  'failed', // Indexing failed
  'archived', // Archived, not available for retrieval
]);

// Knowledge source table - stores source metadata and ownership
export const knowledgeSource = pgTable(
  'knowledge_source',
  {
    id: text('id').primaryKey(),
    kind: knowledgeSourceKindEnum('kind').notNull().default('manual-note'),
    title: text('title').notNull(),
    description: text('description'),

    // Ownership
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    visibility: knowledgeSourceVisibilityEnum('visibility')
      .notNull()
      .default('private'),

    // Status
    status: knowledgeSourceStatusEnum('status').notNull().default('draft'),
    errorMessage: text('error_message'),

    // Indexing stats
    chunkCount: integer('chunk_count').notNull().default(0),
    vectorCount: integer('vector_count').notNull().default(0),

    // Embedding config used
    embeddingModel: text('embedding_model'),
    embeddingDimensions: integer('embedding_dimensions'),

    // Timestamps
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
    indexedAt: timestamp('indexed_at'),
  },
  (table) => ({
    knowledgeSourceUserIdIdx: index('knowledge_source_user_id_idx').on(
      table.userId
    ),
    knowledgeSourceStatusIdx: index('knowledge_source_status_idx').on(
      table.status
    ),
    knowledgeSourceKindIdx: index('knowledge_source_kind_idx').on(table.kind),
    knowledgeSourceVisibilityIdx: index('knowledge_source_visibility_idx').on(
      table.visibility
    ),
    knowledgeSourceUserStatusIdx: index('knowledge_source_user_status_idx').on(
      table.userId,
      table.status
    ),
  })
);

// Knowledge document table - stores original document content
export const knowledgeDocument = pgTable(
  'knowledge_document',
  {
    id: text('id').primaryKey(),
    sourceId: text('source_id')
      .notNull()
      .references(() => knowledgeSource.id, { onDelete: 'cascade' }),

    // Content
    title: text('title').notNull(),
    text: text('text').notNull(),

    // Metadata
    mimeType: text('mime_type').default('text/plain'),
    charCount: integer('char_count').notNull().default(0),

    // Timestamps
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (table) => ({
    knowledgeDocumentSourceIdIdx: index('knowledge_document_source_id_idx').on(
      table.sourceId
    ),
    knowledgeDocumentSourceIdUidx: uniqueIndex(
      'knowledge_document_source_id_uidx'
    ).on(table.sourceId),
  })
);

// Knowledge chunk table - tracks individual chunks (optional but useful for debugging)
export const knowledgeChunk = pgTable(
  'knowledge_chunk',
  {
    id: text('id').primaryKey(),
    documentId: text('document_id')
      .notNull()
      .references(() => knowledgeDocument.id, { onDelete: 'cascade' }),
    sourceId: text('source_id')
      .notNull()
      .references(() => knowledgeSource.id, { onDelete: 'cascade' }),

    // Content
    text: text('text').notNull(),
    chunkIndex: integer('chunk_index').notNull(),
    charCount: integer('char_count').notNull().default(0),

    // Vector reference
    vectorId: text('vector_id'), // ID in PgVector

    // Timestamps
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (table) => ({
    knowledgeChunkDocumentIdIdx: index('knowledge_chunk_document_id_idx').on(
      table.documentId
    ),
    knowledgeChunkSourceIdIdx: index('knowledge_chunk_source_id_idx').on(
      table.sourceId
    ),
    knowledgeChunkVectorIdIdx: index('knowledge_chunk_vector_id_idx').on(
      table.vectorId
    ),
    knowledgeChunkDocumentIndexUidx: uniqueIndex(
      'knowledge_chunk_document_index_uidx'
    ).on(table.documentId, table.chunkIndex),
  })
);

// Knowledge source access table - for shared visibility
export const knowledgeSourceAccess = pgTable(
  'knowledge_source_access',
  {
    id: text('id').primaryKey(),
    sourceId: text('source_id')
      .notNull()
      .references(() => knowledgeSource.id, { onDelete: 'cascade' }),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),

    // Permission level
    permission: text('permission').notNull().default('read'),

    // Timestamps
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (table) => ({
    knowledgeSourceAccessSourceIdIdx: index(
      'knowledge_source_access_source_id_idx'
    ).on(table.sourceId),
    knowledgeSourceAccessUserIdIdx: index(
      'knowledge_source_access_user_id_idx'
    ).on(table.userId),
    knowledgeSourceAccessSourceUserUidx: uniqueIndex(
      'knowledge_source_access_source_user_uidx'
    ).on(table.sourceId, table.userId),
    knowledgeSourceAccessPermissionCheck: check(
      'knowledge_source_access_permission_check',
      sql`${table.permission} in ('read', 'write', 'admin')`
    ),
  })
);
