import 'server-only';

import { MDocument } from '@mastra/rag';
import type { AIKnowledgeIngestionConfig } from '@repo/ai/knowledge';

export interface ChunkResult {
  readonly id: string;
  readonly text: string;
  readonly metadata: Record<string, unknown>;
}

export async function chunkText(
  text: string,
  config: AIKnowledgeIngestionConfig
): Promise<ChunkResult[]> {
  const doc = MDocument.fromText(text);

  const chunks = await doc.chunk({
    strategy: config.chunkStrategy,
    maxSize: config.chunkSize,
    overlap: config.chunkOverlap,
  });

  return chunks.map((chunk, index) => ({
    id: `chunk-${index}`,
    text: chunk.text,
    metadata: {
      chunkIndex: index,
      chunkStrategy: config.chunkStrategy,
      chunkSize: config.chunkSize,
    },
  }));
}

export async function chunkMarkdown(
  markdown: string,
  config: AIKnowledgeIngestionConfig
): Promise<ChunkResult[]> {
  const doc = MDocument.fromMarkdown(markdown);

  const chunks = await doc.chunk({
    strategy: 'markdown',
    maxSize: config.chunkSize,
    overlap: config.chunkOverlap,
  });

  return chunks.map((chunk, index) => ({
    id: `chunk-${index}`,
    text: chunk.text,
    metadata: {
      chunkIndex: index,
      chunkStrategy: 'markdown',
      chunkSize: config.chunkSize,
    },
  }));
}

export const PARTIAL_UNTIL_WIRED = true;
