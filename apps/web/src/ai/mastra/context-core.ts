import type { UIMessage } from 'ai';
import type { MemoryRecallResult } from '../memory';
import type {
  KnowledgeRetrievalResult,
  RetrievedChunk,
  SourceCitationMetadata,
} from '../knowledge';

export interface MastraAgentContextResult {
  readonly inputMessages: readonly UIMessage[];
  readonly systemPrompt: string;
  readonly memoryMessages: readonly UIMessage[];
  readonly memoryResourceId: string;
  readonly memoryThreadIds: readonly string[];
  readonly memoryRecallPolicy: 'confirmed-user-memory';
  readonly knowledgeChunks: readonly RetrievedChunk[];
  readonly knowledgeCitations: readonly SourceCitationMetadata[];
  readonly knowledgeContextText: string;
  readonly knowledgeRetrievalProvider?: 'mastra-pgvector';
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

export interface BuildMastraAgentContextDefaults {
  readonly recallMemory: NonNullable<
    BuildMastraAgentContextOptions['recallMemory']
  >;
  readonly retrieveKnowledge: NonNullable<
    BuildMastraAgentContextOptions['retrieveKnowledge']
  >;
  readonly formatKnowledgeContext: (result: KnowledgeRetrievalResult) => string;
}

function extractMemoryMessageText(message: unknown): string {
  const content = (message as { content?: unknown })?.content;

  if (typeof content === 'string') {
    return content;
  }

  if (!content || typeof content !== 'object') {
    return '';
  }

  if ('text' in content) {
    return String((content as { text: unknown }).text);
  }

  const parts = (content as { parts?: unknown }).parts;
  if (!Array.isArray(parts)) {
    return '';
  }

  return parts
    .map((part) => {
      if (!part || typeof part !== 'object') {
        return '';
      }
      if ((part as { type?: unknown }).type !== 'text') {
        return '';
      }
      return String((part as { text?: unknown }).text ?? '');
    })
    .filter(Boolean)
    .join('\n');
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

export async function buildMastraAgentContextCore(
  options: BuildMastraAgentContextOptions,
  defaults: BuildMastraAgentContextDefaults
): Promise<MastraAgentContextResult> {
  const recallMemory = options.recallMemory ?? defaults.recallMemory;
  const retrieveKnowledge =
    options.retrieveKnowledge ?? defaults.retrieveKnowledge;

  const memoryResult = options.memoryEnabled
    ? await recallMemory(options.userId, options.threadId, true)
    : {
        success: true,
        messages: [],
        threadIds: [],
      };
  const memoryMessages = toMemoryContextMessages(memoryResult);
  const memoryThreadIds = memoryResult.threadIds ?? [];
  const inputMessages = [...memoryMessages, ...options.messages];

  let knowledgeContextText = '';
  let knowledgeCitations: readonly SourceCitationMetadata[] = [];
  let knowledgeChunks: readonly RetrievedChunk[] = [];
  let knowledgeRetrievalProvider: 'mastra-pgvector' | undefined;
  let knowledgeError: string | undefined;

  if (options.knowledgeEnabled) {
    const query = getTextFromMessage(options.lastUserMessage).trim();

    if (query) {
      knowledgeRetrievalProvider = 'mastra-pgvector';
      const retrievalResult = await retrieveKnowledge(query, {
        userId: options.userId,
        topK: 5,
        minScore: 0.0,
        includeOtherUserPublic: false,
      });

      if (retrievalResult.success && retrievalResult.chunks.length > 0) {
        knowledgeContextText = defaults.formatKnowledgeContext(retrievalResult);
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
    memoryResourceId: options.userId,
    memoryThreadIds,
    memoryRecallPolicy: 'confirmed-user-memory',
    knowledgeChunks,
    knowledgeCitations,
    knowledgeContextText,
    knowledgeRetrievalProvider,
    knowledgeError,
  };
}
