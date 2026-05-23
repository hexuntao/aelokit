import assert from 'node:assert/strict';
import test from 'node:test';
import type { ChatUIMessage } from './types';
import { getThreadInsights } from './thread-insights';

test('restores knowledge-active state from persisted citations', () => {
  const messages: readonly ChatUIMessage[] = [
    {
      id: 'msg-1',
      role: 'assistant',
      parts: [{ type: 'text', text: 'Answer with sources' }],
      metadata: {
        citations: [
          {
            sourceId: 'source-1',
            title: 'Knowledge doc',
            documentId: 'doc-1',
            chunkId: 'chunk-1',
            provenance: 'knowledge',
            score: 0.91,
            provider: 'mastra',
          },
        ],
      },
    } as unknown as ChatUIMessage,
  ];

  const insights = getThreadInsights(messages);

  assert.equal(insights.citations.length, 1);
  assert.equal(insights.knowledgeActive, true);
});

test('keeps knowledge inactive when no citations or knowledge flag exist', () => {
  const messages: readonly ChatUIMessage[] = [
    {
      id: 'msg-1',
      role: 'assistant',
      parts: [{ type: 'text', text: 'Plain answer' }],
      metadata: {},
    } as unknown as ChatUIMessage,
  ];

  const insights = getThreadInsights(messages);

  assert.equal(insights.citations.length, 0);
  assert.equal(insights.knowledgeActive, false);
});
