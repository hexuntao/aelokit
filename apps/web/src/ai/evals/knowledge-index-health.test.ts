import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { scoreKnowledgeIndexHealth } from './knowledge-index-health';

describe('scoreKnowledgeIndexHealth', () => {
  it('fails when no accessible sources are present', () => {
    const result = scoreKnowledgeIndexHealth({ sources: [] });

    assert.equal(result.status, 'failed');
    assert.equal(result.score, 0);
    assert.deepEqual(result.metadata, {
      reason: 'no-accessible-sources',
    });
  });

  it('passes when every ready source has indexed vectors for all chunks', () => {
    const result = scoreKnowledgeIndexHealth({
      sources: [
        {
          status: 'ready',
          chunkCount: 2,
          vectorCount: 2,
          documents: [{ chunks: ['chunk-a', 'chunk-b'] }],
        },
      ],
    });

    assert.equal(result.status, 'passed');
    assert.equal(result.score, 1);
    assert.deepEqual(result.metadata, {
      sourceCount: 1,
      readySourceCount: 1,
      indexedSourceCount: 1,
      observedChunkCount: 2,
    });
  });

  it('fails partial indexing without exposing raw source content', () => {
    const result = scoreKnowledgeIndexHealth({
      sources: [
        {
          status: 'ready',
          chunkCount: 2,
          vectorCount: 1,
          documents: [{ chunks: ['chunk-a', 'chunk-b'] }],
        },
        {
          status: 'processing',
          chunkCount: 0,
          vectorCount: 0,
          documents: [],
        },
      ],
    });

    assert.equal(result.status, 'failed');
    assert.equal(result.score, 0.25);
    assert.equal(Object.hasOwn(result.metadata, 'rawContent'), false);
    assert.deepEqual(result.metadata, {
      sourceCount: 2,
      readySourceCount: 1,
      indexedSourceCount: 0,
      observedChunkCount: 2,
    });
  });
});
