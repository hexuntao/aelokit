'use server';

import {
  archiveKnowledgeSource,
  deleteKnowledgeSource,
  ingestManualKnowledgeSource,
  isEmbeddingProviderConfigured,
  listUserKnowledgeSources,
} from '@/ai/knowledge';
import type {
  AIKnowledgeIngestionResult,
  AIKnowledgeSourceId,
} from '@repo/ai/knowledge';
import type { KnowledgeSourceRecord } from '@/ai/knowledge';
import type { SessionUser } from '@/lib/auth-types';
import { userActionClient } from '@/lib/safe-action';
import { z } from 'zod';

export type CreateKnowledgeSourceResult = {
  success: boolean;
  result?: AIKnowledgeIngestionResult;
  error?: string;
};

export type ManageKnowledgeSourceResult = {
  success: boolean;
  source?: KnowledgeSourceRecord;
  deleted?: boolean;
  cleanupFailed?: boolean;
  error?: string;
};

const createKnowledgeSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  text: z.string().min(1, 'Text content is required'),
  sourceKind: z.enum(['manual-note', 'uploaded-file']).default('manual-note'),
  mimeType: z.string().optional(),
});
const sourceIdSchema = z.object({
  sourceId: z.string().min(1),
});

export const createManualKnowledgeSourceAction = userActionClient
  .inputSchema(createKnowledgeSchema)
  .action(
    async ({ parsedInput, ctx }): Promise<CreateKnowledgeSourceResult> => {
      const user = (ctx as { user: SessionUser }).user;

      if (!isEmbeddingProviderConfigured()) {
        return {
          success: false,
          error:
            'Embedding provider is not configured. ' +
            'Please set AI_EMBEDDING_API_KEY or OPENAI_API_KEY environment variable.',
        };
      }

      try {
        const result = await ingestManualKnowledgeSource({
          title: parsedInput.title.trim(),
          text: parsedInput.text.trim(),
          userId: user.id,
          kind: parsedInput.sourceKind,
          mimeType: parsedInput.mimeType,
          visibility: 'private',
        });

        return {
          success: result.status === 'success',
          result,
          error: result.status === 'failed' ? result.error : undefined,
        };
      } catch (error) {
        return {
          success: false,
          error:
            error instanceof Error
              ? error.message
              : 'Unknown error during ingestion.',
        };
      }
    }
  );

export const checkEmbeddingProviderStatusAction = userActionClient.action(
  async (): Promise<{ configured: boolean; message?: string }> => {
    return {
      configured: isEmbeddingProviderConfigured(),
      message: isEmbeddingProviderConfigured()
        ? undefined
        : 'Embedding provider is not configured. Set AI_EMBEDDING_API_KEY or OPENAI_API_KEY.',
    };
  }
);

export const getUserKnowledgeSourcesAction = userActionClient.action(
  async ({
    ctx,
  }): Promise<{
    success: boolean;
    sources?: KnowledgeSourceRecord[];
    error?: string;
  }> => {
    const user = (ctx as { user: SessionUser }).user;

    try {
      const sources = await listUserKnowledgeSources(user.id);
      return {
        success: true,
        sources,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }
);

export const archiveKnowledgeSourceAction = userActionClient
  .inputSchema(sourceIdSchema)
  .action(
    async ({ parsedInput, ctx }): Promise<ManageKnowledgeSourceResult> => {
      const user = (ctx as { user: SessionUser }).user;

      try {
        const source = await archiveKnowledgeSource(
          parsedInput.sourceId as AIKnowledgeSourceId,
          user.id
        );

        if (!source) {
          return {
            success: false,
            error: 'Knowledge source not found.',
          };
        }

        return {
          success: true,
          source,
        };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : String(error),
        };
      }
    }
  );

export const deleteKnowledgeSourceAction = userActionClient
  .inputSchema(sourceIdSchema)
  .action(
    async ({ parsedInput, ctx }): Promise<ManageKnowledgeSourceResult> => {
      const user = (ctx as { user: SessionUser }).user;

      try {
        const deleteResult = await deleteKnowledgeSource(
          parsedInput.sourceId as AIKnowledgeSourceId,
          user.id
        );

        if (deleteResult.status === 'not_found') {
          return {
            success: false,
            error: 'Knowledge source not found.',
          };
        }

        if (deleteResult.status === 'archived_cleanup_failed') {
          return {
            success: true,
            source: deleteResult.source,
            deleted: false,
            cleanupFailed: true,
            error: deleteResult.error,
          };
        }

        return {
          success: true,
          deleted: true,
        };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : String(error),
        };
      }
    }
  );
