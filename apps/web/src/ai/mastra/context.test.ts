import assert from 'node:assert/strict';
import test from 'node:test';
import type { UIMessage } from 'ai';
import {
  buildMastraAgentContextCore,
  type BuildMastraAgentContextDefaults,
} from './context-core';
import type { MemoryRecallResult } from '../memory';
import type { KnowledgeRetrievalResult } from '../knowledge';

const userMessage = {
  id: 'user-1',
  role: 'user',
  parts: [{ type: 'text', text: 'What did the knowledge source say?' }],
} as UIMessage;

const defaultContextDependencies: BuildMastraAgentContextDefaults = {
  recallMemory: async () => ({
    success: true,
    messages: [],
    threadIds: [],
  }),
  retrieveKnowledge: async () => ({
    success: true,
    chunks: [],
    citations: [],
    contextText: '',
  }),
  formatKnowledgeContext: (result) =>
    result.contextText
      ? `## Relevant Knowledge Sources\n\n${result.contextText}`
      : '',
};

test('does not recall memory when memory is disabled', async () => {
  let recallCalled = false;

  const result = await buildMastraAgentContextCore(
    {
      userId: 'user-1',
      threadId: 'thread-1',
      messages: [userMessage],
      lastUserMessage: userMessage,
      baseSystemPrompt: 'Base prompt',
      memoryEnabled: false,
      knowledgeEnabled: false,
      recallMemory: async (): Promise<MemoryRecallResult> => {
        recallCalled = true;
        return {
          success: true,
          messages: [
            {
              id: 'memory-1',
              role: 'user',
              content: 'This should never be recalled.',
            },
          ],
        };
      },
    },
    defaultContextDependencies
  );

  assert.equal(recallCalled, false);
  assert.equal(result.memoryMessages.length, 0);
  assert.equal(result.memoryThreadIds.length, 0);
  assert.equal(result.memoryResourceId, 'user-1');
  assert.equal(result.memoryRecallPolicy, 'confirmed-user-memory');
});

test('includes confirmed memory recall messages when memory is enabled', async () => {
  const result = await buildMastraAgentContextCore(
    {
      userId: 'user-1',
      threadId: 'thread-1',
      messages: [userMessage],
      lastUserMessage: userMessage,
      baseSystemPrompt: 'Base prompt',
      memoryEnabled: true,
      knowledgeEnabled: false,
      recallMemory: async (_userId, _threadId, enabled) => {
        assert.equal(enabled, true);
        return {
          success: true,
          threadIds: ['memory-thread-1'],
          messages: [
            {
              id: 'memory-1',
              role: 'assistant',
              content: 'Confirmed durable memory.',
              createdAt: new Date('2026-06-01T00:00:00.000Z'),
            },
          ],
        };
      },
    },
    defaultContextDependencies
  );

  assert.equal(result.memoryMessages.length, 1);
  assert.equal(result.inputMessages.length, 2);
  assert.deepEqual(result.memoryThreadIds, ['memory-thread-1']);
});

test('does not convert failed knowledge retrieval into citations', async () => {
  const result = await buildMastraAgentContextCore(
    {
      userId: 'user-1',
      threadId: 'thread-1',
      messages: [userMessage],
      lastUserMessage: userMessage,
      baseSystemPrompt: 'Base prompt',
      memoryEnabled: false,
      knowledgeEnabled: true,
      retrieveKnowledge: async (): Promise<KnowledgeRetrievalResult> => ({
        success: false,
        chunks: [],
        citations: [
          {
            sourceId: 'source-1',
            title: 'Should not appear',
            documentId: 'doc-1',
            chunkId: 'chunk-1',
            provenance: 'test',
            score: 1,
            provider: 'mastra-pgvector',
          },
        ],
        contextText: '',
        error: 'Vector query failed.',
      }),
    },
    defaultContextDependencies
  );

  assert.equal(result.knowledgeCitations.length, 0);
  assert.equal(result.knowledgeChunks.length, 0);
  assert.equal(result.knowledgeError, 'Vector query failed.');
  assert.equal(result.knowledgeRetrievalProvider, 'mastra-pgvector');
  assert.equal(result.systemPrompt, 'Base prompt');
});

test('preserves knowledge citations only for real retrieved chunks', async () => {
  const result = await buildMastraAgentContextCore(
    {
      userId: 'user-1',
      threadId: 'thread-1',
      messages: [userMessage],
      lastUserMessage: userMessage,
      baseSystemPrompt: 'Base prompt',
      memoryEnabled: false,
      knowledgeEnabled: true,
      retrieveKnowledge: async (): Promise<KnowledgeRetrievalResult> => ({
        success: true,
        chunks: [
          {
            id: 'vector-1',
            sourceId: 'source-1',
            documentId: 'doc-1',
            chunkId: 'chunk-1',
            text: 'Retrieved source text.',
            score: 0.91,
            title: 'Knowledge doc',
            userId: 'user-1',
            visibility: 'private',
            indexedAt: '2026-06-01T00:00:00.000Z',
            provider: 'mastra-pgvector',
            provenance: 'manual-note:source-1',
          },
        ],
        citations: [
          {
            sourceId: 'source-1',
            title: 'Knowledge doc',
            documentId: 'doc-1',
            chunkId: 'chunk-1',
            provenance: 'manual-note:source-1',
            score: 0.91,
            provider: 'mastra-pgvector',
          },
        ],
        contextText: '[1] Retrieved source text.',
      }),
    },
    defaultContextDependencies
  );

  assert.equal(result.knowledgeCitations.length, 1);
  assert.equal(result.knowledgeChunks.length, 1);
  assert.match(result.systemPrompt, /Relevant Knowledge Sources/);
  assert.equal(result.knowledgeRetrievalProvider, 'mastra-pgvector');
});
