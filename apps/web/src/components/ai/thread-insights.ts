import type { ChatUIMessage, CitationMetadata } from './types';

function asRecord(value: unknown): Record<string, unknown> | null {
  return typeof value === 'object' && value !== null
    ? (value as Record<string, unknown>)
    : null;
}

function isCitationMetadata(value: unknown): value is CitationMetadata {
  const candidate = asRecord(value);

  return (
    candidate !== null &&
    typeof candidate.sourceId === 'string' &&
    typeof candidate.title === 'string' &&
    typeof candidate.documentId === 'string' &&
    typeof candidate.chunkId === 'string' &&
    typeof candidate.provenance === 'string' &&
    typeof candidate.score === 'number' &&
    typeof candidate.provider === 'string'
  );
}

function getMessageCitations(
  message: ChatUIMessage | undefined
): readonly CitationMetadata[] {
  const metadataCitations = Array.isArray(message?.metadata?.citations)
    ? message.metadata.citations.filter(isCitationMetadata)
    : [];

  if (metadataCitations.length > 0) {
    return metadataCitations;
  }

  const persistedParts = Array.isArray(message?.parts)
    ? (message.parts as readonly unknown[])
    : [];

  return persistedParts.filter(isCitationMetadata);
}

export function getThreadInsights(messages: readonly ChatUIMessage[]): {
  readonly citations: readonly CitationMetadata[];
  readonly knowledgeActive: boolean;
} {
  const lastAssistantMessage = [...messages]
    .reverse()
    .find((message) => message.role === 'assistant');
  const citations = getMessageCitations(lastAssistantMessage);
  const knowledgeEnabled =
    lastAssistantMessage?.metadata?.knowledgeEnabled === true;

  return {
    citations,
    knowledgeActive: knowledgeEnabled || citations.length > 0,
  };
}
