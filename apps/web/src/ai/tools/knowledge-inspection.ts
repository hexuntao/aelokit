import 'server-only';

import { tool } from 'ai';
import {
  and,
  asc,
  desc,
  eq,
  inArray,
  isNotNull,
  or,
  type SQL,
} from 'drizzle-orm';
import { z } from 'zod';
import { getDb } from '@repo/db';
import {
  knowledgeChunk,
  knowledgeDocument,
  knowledgeSource,
  knowledgeSourceAccess,
} from '@repo/db/knowledge-schema';

const DEFAULT_INSPECTION_LIMIT = 10;
const MAX_INSPECTION_LIMIT = 25;
const ROW_MULTIPLIER = 20;
const KNOWLEDGE_READ_PERMISSIONS = ['read', 'write', 'admin'] as const;

export const KNOWLEDGE_INSPECTION_TOOL_NAME = 'inspectKnowledge';
export const KNOWLEDGE_INSPECTION_TOOL_ID = 'knowledge.inspect';

export const knowledgeInspectionToolInputSchema = z.object({
  sourceId: z
    .string()
    .min(1)
    .optional()
    .describe('Optional knowledge source id to inspect.'),
  documentId: z
    .string()
    .min(1)
    .optional()
    .describe('Optional knowledge document id to inspect.'),
  chunkId: z
    .string()
    .min(1)
    .optional()
    .describe('Optional knowledge chunk id to inspect.'),
  limit: z
    .number()
    .int()
    .min(1)
    .max(MAX_INSPECTION_LIMIT)
    .optional()
    .describe('Maximum number of sources to return.'),
  includeChunks: z
    .boolean()
    .optional()
    .describe('Whether to include chunk metadata. Defaults to true.'),
});

export type KnowledgeInspectionToolInput = z.infer<
  typeof knowledgeInspectionToolInputSchema
>;

export interface KnowledgeInspectionCitationMetadata {
  readonly sourceId: string;
  readonly documentId: string;
  readonly chunkId: string;
  readonly provenance: string;
  readonly provider: string;
}

export interface KnowledgeInspectionChunkMetadata {
  readonly id: string;
  readonly chunkIndex: number;
  readonly charCount: number;
  readonly vectorId?: string;
  readonly createdAt: string;
  readonly citation: KnowledgeInspectionCitationMetadata;
}

export interface KnowledgeInspectionDocumentMetadata {
  readonly id: string;
  readonly title: string;
  readonly mimeType?: string;
  readonly charCount: number;
  readonly createdAt: string;
  readonly chunks: KnowledgeInspectionChunkMetadata[];
}

export interface KnowledgeInspectionSourceMetadata {
  readonly id: string;
  readonly title: string;
  readonly kind: string;
  readonly visibility: string;
  readonly status: string;
  readonly access: 'owner' | 'shared-read' | 'shared-write' | 'shared-admin';
  readonly chunkCount: number;
  readonly vectorCount: number;
  readonly embeddingModel?: string;
  readonly embeddingDimensions?: number;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly indexedAt?: string;
  readonly documents: KnowledgeInspectionDocumentMetadata[];
}

export interface KnowledgeInspectionToolOutput {
  readonly inspectedAt: string;
  readonly matched: boolean;
  readonly scope: {
    readonly sourceId?: string;
    readonly documentId?: string;
    readonly chunkId?: string;
    readonly limit: number;
    readonly includeChunks: boolean;
  };
  readonly sources: KnowledgeInspectionSourceMetadata[];
  readonly note?: string;
}

interface InspectKnowledgeMetadataOptions {
  readonly userId: string;
  readonly input: KnowledgeInspectionToolInput;
}

function toIso(value: Date | null | undefined): string | undefined {
  return value?.toISOString();
}

function resolveLimit(limit: number | undefined): number {
  return Math.min(
    Math.max(limit ?? DEFAULT_INSPECTION_LIMIT, 1),
    MAX_INSPECTION_LIMIT
  );
}

function resolveAccessLabel(row: {
  readonly sourceUserId: string;
  readonly accessPermission: string | null;
  readonly userId: string;
}): KnowledgeInspectionSourceMetadata['access'] {
  if (row.sourceUserId === row.userId) {
    return 'owner';
  }

  if (row.accessPermission === 'admin') {
    return 'shared-admin';
  }

  if (row.accessPermission === 'write') {
    return 'shared-write';
  }

  return 'shared-read';
}

function resolveProvider(embeddingModel: string | null): string {
  return embeddingModel ?? 'unknown';
}

function resolveProvenance(kind: string, sourceId: string): string {
  return `${kind}:${sourceId}`;
}

export async function inspectKnowledgeMetadata({
  userId,
  input,
}: InspectKnowledgeMetadataOptions): Promise<KnowledgeInspectionToolOutput> {
  const db = await getDb();
  const limit = resolveLimit(input.limit);
  const includeChunks = input.includeChunks !== false;
  const filters: SQL[] = [
    or(
      eq(knowledgeSource.userId, userId),
      isNotNull(knowledgeSourceAccess.id)
    )!,
  ];

  if (input.sourceId) {
    filters.push(eq(knowledgeSource.id, input.sourceId));
  }

  if (input.documentId) {
    filters.push(eq(knowledgeDocument.id, input.documentId));
  }

  if (input.chunkId) {
    filters.push(eq(knowledgeChunk.id, input.chunkId));
  }

  const rows = await db
    .select({
      sourceId: knowledgeSource.id,
      sourceTitle: knowledgeSource.title,
      sourceKind: knowledgeSource.kind,
      sourceVisibility: knowledgeSource.visibility,
      sourceStatus: knowledgeSource.status,
      sourceUserId: knowledgeSource.userId,
      sourceChunkCount: knowledgeSource.chunkCount,
      sourceVectorCount: knowledgeSource.vectorCount,
      sourceEmbeddingModel: knowledgeSource.embeddingModel,
      sourceEmbeddingDimensions: knowledgeSource.embeddingDimensions,
      sourceCreatedAt: knowledgeSource.createdAt,
      sourceUpdatedAt: knowledgeSource.updatedAt,
      sourceIndexedAt: knowledgeSource.indexedAt,
      accessPermission: knowledgeSourceAccess.permission,
      documentId: knowledgeDocument.id,
      documentTitle: knowledgeDocument.title,
      documentMimeType: knowledgeDocument.mimeType,
      documentCharCount: knowledgeDocument.charCount,
      documentCreatedAt: knowledgeDocument.createdAt,
      chunkId: knowledgeChunk.id,
      chunkIndex: knowledgeChunk.chunkIndex,
      chunkCharCount: knowledgeChunk.charCount,
      chunkVectorId: knowledgeChunk.vectorId,
      chunkCreatedAt: knowledgeChunk.createdAt,
    })
    .from(knowledgeSource)
    .leftJoin(
      knowledgeSourceAccess,
      and(
        eq(knowledgeSourceAccess.sourceId, knowledgeSource.id),
        eq(knowledgeSourceAccess.userId, userId),
        inArray(knowledgeSourceAccess.permission, [
          ...KNOWLEDGE_READ_PERMISSIONS,
        ])
      )
    )
    .leftJoin(
      knowledgeDocument,
      eq(knowledgeDocument.sourceId, knowledgeSource.id)
    )
    .leftJoin(
      knowledgeChunk,
      eq(knowledgeChunk.documentId, knowledgeDocument.id)
    )
    .where(and(...filters))
    .orderBy(
      desc(knowledgeSource.updatedAt),
      asc(knowledgeDocument.createdAt),
      asc(knowledgeChunk.chunkIndex)
    )
    .limit(limit * ROW_MULTIPLIER);

  const sources = new Map<string, KnowledgeInspectionSourceMetadata>();
  const documentsBySource = new Map<
    string,
    Map<string, KnowledgeInspectionDocumentMetadata>
  >();
  const chunksByDocument = new Map<string, Set<string>>();

  for (const row of rows) {
    if (!sources.has(row.sourceId)) {
      sources.set(row.sourceId, {
        id: row.sourceId,
        title: row.sourceTitle,
        kind: row.sourceKind,
        visibility: row.sourceVisibility,
        status: row.sourceStatus,
        access: resolveAccessLabel({
          sourceUserId: row.sourceUserId,
          accessPermission: row.accessPermission,
          userId,
        }),
        chunkCount: row.sourceChunkCount,
        vectorCount: row.sourceVectorCount,
        embeddingModel: row.sourceEmbeddingModel ?? undefined,
        embeddingDimensions: row.sourceEmbeddingDimensions ?? undefined,
        createdAt: row.sourceCreatedAt.toISOString(),
        updatedAt: row.sourceUpdatedAt.toISOString(),
        indexedAt: toIso(row.sourceIndexedAt),
        documents: [],
      });
      documentsBySource.set(row.sourceId, new Map());
    }

    if (!row.documentId) {
      continue;
    }

    const source = sources.get(row.sourceId)!;
    const sourceDocuments = documentsBySource.get(row.sourceId)!;

    if (!sourceDocuments.has(row.documentId)) {
      const documentMetadata: KnowledgeInspectionDocumentMetadata = {
        id: row.documentId,
        title: row.documentTitle ?? row.sourceTitle,
        mimeType: row.documentMimeType ?? undefined,
        charCount: row.documentCharCount ?? 0,
        createdAt: row.documentCreatedAt?.toISOString() ?? source.createdAt,
        chunks: [],
      };
      sourceDocuments.set(row.documentId, documentMetadata);
      source.documents.push(documentMetadata);
      chunksByDocument.set(row.documentId, new Set());
    }

    if (!includeChunks || !row.chunkId) {
      continue;
    }

    const documentMetadata = sourceDocuments.get(row.documentId)!;
    const documentChunks = chunksByDocument.get(row.documentId)!;

    if (documentChunks.has(row.chunkId)) {
      continue;
    }

    documentChunks.add(row.chunkId);
    documentMetadata.chunks.push({
      id: row.chunkId,
      chunkIndex: row.chunkIndex ?? 0,
      charCount: row.chunkCharCount ?? 0,
      vectorId: row.chunkVectorId ?? undefined,
      createdAt:
        row.chunkCreatedAt?.toISOString() ?? documentMetadata.createdAt,
      citation: {
        sourceId: row.sourceId,
        documentId: row.documentId,
        chunkId: row.chunkId,
        provenance: resolveProvenance(row.sourceKind, row.sourceId),
        provider: resolveProvider(row.sourceEmbeddingModel),
      },
    });
  }

  const sourceList = Array.from(sources.values()).slice(0, limit);

  return {
    inspectedAt: new Date().toISOString(),
    matched: sourceList.length > 0,
    scope: {
      sourceId: input.sourceId,
      documentId: input.documentId,
      chunkId: input.chunkId,
      limit,
      includeChunks,
    },
    sources: sourceList,
    note:
      sourceList.length === 0
        ? 'No accessible knowledge metadata matched the requested scope.'
        : undefined,
  };
}

export function createKnowledgeInspectionTool(options: {
  readonly userId: string;
}) {
  return tool({
    title: 'Inspect knowledge',
    description:
      'Read accessible knowledge source, document, chunk, and citation metadata. ' +
      'This tool does not return original document text or chunk text.',
    inputSchema: knowledgeInspectionToolInputSchema,
    metadata: {
      toolId: KNOWLEDGE_INSPECTION_TOOL_ID,
      permission: 'knowledge:read',
      mcpReady: true,
    },
    execute: async (input) =>
      inspectKnowledgeMetadata({
        userId: options.userId,
        input,
      }),
  });
}
