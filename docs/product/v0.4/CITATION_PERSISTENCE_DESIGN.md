# v0.4 Citation Persistence Design

状态：DESIGN_ONLY

本文件设计 citation persistence。它不授权 schema 修改、migration、DB push、DB reset 或 destructive migration。

## 1. Current State

v0.3 当前 citation path：

- Knowledge retrieval 返回 `SourceCitationMetadata[]`。
- `/api/ai/chat` 把 citations 写入 `x-ai-knowledge-citations` response header。
- `/api/ai/chat` 在 AI SDK `messageMetadata` finish 阶段返回 `citations`。
- UI 从 `message.metadata?.citations` 更新 `lastCitations` 并渲染 `CitationList`。
- `ai_message_part` 支持 `partType='source'`，但当前 citations 主要是 response-only metadata/header，不保证历史 reload 时可从 message parts replay。

## 2. Design Goals

- 历史消息可以 replay 当次回答的 citations。
- Replay 不依赖重新执行 retrieval。
- Citation metadata 能追踪 source/document/chunk/provenance/provider/score。
- 不默认存储完整 source content。
- 不绕过 knowledge source access policy。
- 不执行 migration，除非后续独立确认。

## 3. Citation Semantics

Citation 是一次 assistant response 对 retrieval result 的引用快照，不是 source 当前状态的实时查询结果。

Replay 时应展示：

- answer-time citation snapshot。
- source title/provenance/chunk reference。
- source 是否仍可访问的当前状态，如实现了 current access check。

Replay 时不应：

- 重新检索向量并声称结果等同于原回答。
- 因 source 后来被删除而悄悄改写历史回答。
- 把未授权用户的 raw source text 暴露在历史 citation 中。

## 4. Recommended Path A: No-Migration Source Part Persistence

### Summary

优先评估把 citations 转换成 AI SDK `source-document` 或 app-specific `data-citation` parts，并通过现有 `ai_message_part` 持久化。当前 schema 已允许：

- `partType='source'`
- `partType='data'`
- `content jsonb`
- `runtimePartType`

### Candidate Runtime Shape

Persisted source part should include:

- `type`: `source-document` or `data-citation`
- `sourceId`
- `documentId`
- `chunkId`
- `title`
- `provenance`
- `provider`
- `score`
- `retrievedAt`
- `knowledgeIndexName`
- `embeddingModel`
- `visibilityAtAnswerTime`
- optional `snippetPreview`, length-limited and redacted

### Advantages

- No schema migration.
- Aligns with AI SDK source/data part stream semantics.
- Reuses existing `ai_message_part` ordering and message ownership.
- Makes citation replay part of message persistence rather than a parallel system.

### Risks

- `ai_message_part.content` becomes a polymorphic citation store.
- Querying citations across messages is harder than with a dedicated table.
- Requires careful UI replay support to read persisted source/data parts.

### Acceptance if Implemented Later

- New response stores citation source/data parts for assistant message.
- Reloaded thread can render citations without response header.
- No DB schema or migration changes.
- Existing response metadata/header may remain for live UI, but is not the only persistence path.

## 5. Future Path B: Dedicated Citation Table

This option requires separate schema/migration confirmation and is not v0.4 default implementation.

### Candidate Table

```txt
ai_message_citation
  id
  message_id -> ai_message.id
  source_id -> knowledge_source.id nullable/set null
  document_id -> knowledge_document.id nullable/set null
  chunk_id -> knowledge_chunk.id nullable/set null
  sort_order
  title_snapshot
  provenance
  provider
  score
  knowledge_index_name
  embedding_model
  visibility_snapshot
  access_policy_snapshot jsonb
  display_snapshot jsonb
  created_at
```

### Advantages

- Queryable audit surface.
- Cleaner admin/reporting model.
- Easier future integration with tool/MCP provenance.

### Costs

- Requires schema design review.
- Requires migration generation and DB verification.
- Requires rollback plan for migration.
- Risks premature schema commitment before citation semantics settle.

## 6. Access Policy

Citation replay has two possible display modes:

- Historical snapshot mode: show citation title/provenance/chunk reference that was visible at answer time, even if source is later archived, but do not expose full raw content.
- Current access mode: show citation only if the viewer currently has access; otherwise show redacted citation shell.

v0.4 recommendation:

- Use historical snapshot for title/provenance/reference.
- Re-check current access before exposing any full source text or long snippet.
- Store only short `snippetPreview` if needed, with length limit and redaction.

## 7. Privacy and Data Minimization

Do not store by default:

- full source document text.
- provider secret or embedding secret.
- raw vector values.
- raw request prompt beyond existing message persistence.
- full retrieved context block if citations only need reference metadata.

Allow storing:

- source ID, document ID, chunk ID.
- title snapshot.
- provenance string.
- score and provider/model metadata.
- short display preview if explicitly accepted.

## 8. Migration Gate

Any dedicated citation table requires:

- updated Scope Freeze.
- schema design doc.
- migration review.
- `packages/db/src/schema.ts` aggregation update.
- generated SQL review.
- user confirmation before `db:generate`, `db:migrate`, `db:push` or `db:enable-pgvector`.

## 9. Rollback

No-migration path:

- Remove source/data part emission.
- Keep existing response metadata/header behavior.
- Existing persisted source/data parts remain harmless message parts.

Dedicated table path:

- Requires migration rollback plan before implementation.
- Must not be entered under default v0.4 scope.

## 10. Open Decision

Recommended v0.4 default:

- Keep this file as the design record.
- During implementation, first attempt no-migration source/data part persistence only if user explicitly opens citation persistence implementation.
- Do not create dedicated citation table in v0.4 default scope.
