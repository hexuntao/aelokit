import 'server-only';

import type { UIMessage } from 'ai';
import {
  extractMemoryMessageText,
  getMemoryContextForChat,
  type MemoryRecallResult,
} from '../memory';
import {
  formatRetrievalContextForPrompt,
  retrieveKnowledgeContext,
  type KnowledgeRetrievalResult,
  type RetrievedChunk,
  type SourceCitationMetadata,
} from '../knowledge';

export interface MastraAgentContextResult {
  readonly inputMessages: readonly UIMessage[];
  readonly systemPrompt: string;
  readonly memoryMessages: readonly UIMessage[];
  readonly memoryThreadIds: readonly string[];
  readonly knowledgeChunks: readonly RetrievedChunk[];
  readonly knowledgeCitations: readonly SourceCitationMetadata[];
  readonly knowledgeContextText: string;
  readonly knowledgeError?: string;
}

export interface BuildMastraAgentContextOptions {
  readonly userId: string;
  readonly threadId: string;
  readonly messages: readonly UIMessage[];
  readonly lastUserMessage: UIMessage;
  readonly baseSystemPrompt: string;
  readonly memoryEnabled: boolean;
  readonly knowledgeEnabled: boolean;
  readonly recallMemory?: (
    userId: string,
    threadId: string,
    enabled: boolean
  ) => Promise<MemoryRecallResult>;
  readonly retrieveKnowledge?: (
    query: string,
    options: {
      readonly userId: string;
      readonly topK: number;
      readonly minScore: number;
      readonly includeOtherUserPublic: boolean;
    }
  ) => Promise<KnowledgeRetrievalResult>;
}

function getTextFromMessage(message: UIMessage): string {
  return message.parts
    .filter(
      (part): part is { type: 'text'; text: string } => part.type === 'text'
    )
    .map((part) => part.text)
    .join(' ');
}

function toMemoryContextMessages(
  result: MemoryRecallResult
): readonly UIMessage[] {
  if (!result.success || result.messages.length === 0) {
    return [];
  }

  return result.messages.flatMap((msg) => {
    const mastraMsg = msg as {
      role?: string;
      content?: unknown;
      id?: string;
    };

    if (mastraMsg.role !== 'user' && mastraMsg.role !== 'assistant') {
      return [];
    }

    const textContent = extractMemoryMessageText(mastraMsg);
    if (!textContent) {
      return [];
    }

    return [
      {
        id: mastraMsg.id ?? `memory-${crypto.randomUUID()}`,
        role: mastraMsg.role,
        parts: [{ type: 'text' as const, text: textContent }],
      },
    ];
  });
}

export async function buildMastraAgentContext(
  options: BuildMastraAgentContextOptions
): Promise<MastraAgentContextResult> {
  const recallMemory = options.recallMemory ?? getMemoryContextForChat;
  const retrieveKnowledge =
    options.retrieveKnowledge ?? retrieveKnowledgeContext;

  const memoryResult = await recallMemory(
    options.userId,
    options.threadId,
    options.memoryEnabled
  );
  const memoryMessages = toMemoryContextMessages(memoryResult);
  const memoryThreadIds = memoryResult.threadIds ?? [];
  const inputMessages = [...memoryMessages, ...options.messages];

  let knowledgeContextText = '';
  let knowledgeCitations: readonly SourceCitationMetadata[] = [];
  let knowledgeChunks: readonly RetrievedChunk[] = [];
  let knowledgeError: string | undefined;

  if (options.knowledgeEnabled) {
    const query = getTextFromMessage(options.lastUserMessage).trim();

    if (query) {
      const retrievalResult = await retrieveKnowledge(query, {
        userId: options.userId,
        topK: 5,
        minScore: 0.0,
        includeOtherUserPublic: false,
      });

      if (retrievalResult.success && retrievalResult.chunks.length > 0) {
        knowledgeContextText = formatRetrievalContextForPrompt(retrievalResult);
        knowledgeCitations = retrievalResult.citations;
        knowledgeChunks = retrievalResult.chunks;
      } else if (!retrievalResult.success) {
        knowledgeError = retrievalResult.error;
      }
    }
  }

  return {
    inputMessages,
    systemPrompt: knowledgeContextText
      ? `${options.baseSystemPrompt}\n\n${knowledgeContextText}`
      : options.baseSystemPrompt,
    memoryMessages,
    memoryThreadIds,
    knowledgeChunks,
    knowledgeCitations,
    knowledgeContextText,
    knowledgeError,
  };
}
