'use server';

import {
  ingestManualKnowledgeSource,
  isEmbeddingProviderConfigured,
} from '@/ai/knowledge';
import type { AIKnowledgeIngestionResult } from '@repo/ai/knowledge';
import type { SessionUser } from '@/lib/auth-types';
import { userActionClient } from '@/lib/safe-action';
import { z } from 'zod';

export type CreateKnowledgeSourceResult = {
  success: boolean;
  result?: AIKnowledgeIngestionResult;
  error?: string;
};

const createKnowledgeSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  text: z.string().min(1, 'Text content is required'),
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
            'Please set OPENAI_API_KEY environment variable.',
        };
      }

      try {
        const result = await ingestManualKnowledgeSource({
          title: parsedInput.title.trim(),
          text: parsedInput.text.trim(),
          userId: user.id,
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
        : 'Embedding provider is not configured. Set OPENAI_API_KEY.',
    };
  }
);
