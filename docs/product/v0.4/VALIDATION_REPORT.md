# v0.4 Validation Report

本文件记录 v0.4 implementation 的静态验证、runtime smoke、DB/vector verification 和已知阻塞。报告不打印 secret 值。

## T07 Authenticated Runtime Smoke

日期：2026-05-20

Status: PARTIAL.

Passed evidence:

- Dev server started with `pnpm --filter @repo/web dev`.
- Local URL: `http://localhost:3000`.
- Browser session: Chrome authenticated session reached `/chat`.
- Authenticated user visible in UI: `admin` / `admin@gmail.com`.
- UI smoke:
  - Prompt: `v0.4 runtime smoke: reply with the single word pong.`
  - UI rendered assistant response: `pong`.
- Browser-context route smoke:
  - Request path: `POST /api/ai/chat`.
  - HTTP status: `200`.
  - Response content type: `text/event-stream`.
  - `x-ai-thread-id`: present.
  - `x-ai-message-id`: present.
  - `x-ai-memory-enabled`: `false`.
  - `x-ai-knowledge-enabled`: `false`.
  - Response body used UI message stream data and included `pong`.
- Read-only DB evidence for the two smoke requests:
  - `smoke_threads=2`.
  - `smoke_messages=4`.
  - `smoke_parts=6`.
  - `usage_records=2,success=2,error=0`.
  - `credit_transactions_for_smoke_user_since_start=0`.
- Memory default evidence:
  - After clearing local browser memory/knowledge preferences and reloading, UI showed `Memory Off` and `Knowledge Off`.

Partial / blocked evidence:

- Knowledge-enabled UI attempt hit an embedding provider error before citations could be returned:
  - error class: `AI_APICallError`.
  - provider endpoint returned HTTP 400.
  - sanitized response body: `Unsupported parameter: encoding_format`.
- Because knowledge retrieval did not return citations, T07 does not mark knowledge citation runtime PASS.
- Confirmed-only durable memory recall was not separately exercised with controlled memory data in this task.

Conclusion:

- Authenticated base chat runtime smoke: PASS.
- UI message stream headers/metadata path: PASS.
- Thread/message/message part persistence: PASS.
- Usage audit and no credits mutation: PASS.
- Knowledge citation runtime: PARTIAL/BLOCKED by embedding provider compatibility.
- Overall T07: PARTIAL.

## T08 DB/Vector Verification

日期：2026-05-21

Status: PARTIAL.

Read-only commands:

- `PGOPTIONS='-c default_transaction_read_only=on' psql "$DATABASE_URL" ...`
  for PostgreSQL, table, vector extension, count, and index evidence.
- Shell env presence check for effective embedding config without printing
  secret values.

Passed evidence:

- PostgreSQL connection succeeded against local database `aelokit`.
- Read-only guard was active: `default_transaction_read_only=on`.
- `vector` extension exists: version `0.8.2`.
- Required tables exist:
  - `ai_thread`
  - `ai_message`
  - `ai_message_part`
  - `ai_usage`
  - `ai_memory_draft`
  - `knowledge_source`
  - `knowledge_document`
  - `knowledge_chunk`
  - `knowledge_source_access`
  - `credit_transaction`
- `ai_message_part_type_check` includes `source`, so no schema change is
  required for persisted citation source parts.
- Current DB counts:
  - `ai_thread`: 4.
  - `ai_message`: 10.
  - `ai_message_part`: 13.
  - `ai_usage`: 6.
  - `ai_memory_draft`: 0.
  - `knowledge_source`: 1.
  - `knowledge_document`: 1.
  - `knowledge_chunk`: 0.
  - `knowledge_chunk.vector_id not null`: 0.
- Effective embedding key is present through `AI_EMBEDDING_API_KEY` or
  `OPENAI_API_KEY`.

Partial / blocked evidence:

- The only knowledge source is `failed` with `chunk_count=0` and
  `vector_count=0`.
- There are no ready knowledge sources:
  `sources=0,chunk_count=0,vector_count=0`.
- No app-created PgVector storage object was found for
  `public.aelokit_knowledge_embeddings` or
  `mastra.aelokit_knowledge_embeddings`.
- No vector/embedding typed DB columns were found beyond AeloKit metadata fields
  (`knowledge_chunk.vector_id`, `knowledge_source.vector_count`,
  `knowledge_source.embedding_model`, `knowledge_source.embedding_dimensions`).
- Controlled retrieval was not rerun as PASS evidence because there is no
  indexed source/vector data and T07 already showed the configured embedding
  endpoint rejects AI SDK embedding requests with
  `Unsupported parameter: encoding_format`.
- Creating controlled source/vector data would require a seed or ad hoc DB write,
  which is forbidden without explicit confirmation.

Conclusion:

- PostgreSQL connection: PASS.
- `vector` extension: PASS.
- AI/knowledge tables: PASS.
- Existing schema support for citation source parts: PASS.
- PgVector app index/storage: PARTIAL/BLOCKED, not present in this DB snapshot.
- Controlled retrieval: PARTIAL/BLOCKED by absent indexed vectors and embedding
  provider compatibility.
- Overall T08: PARTIAL.
