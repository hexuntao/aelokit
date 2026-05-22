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
- Effective embedding key is present through `OPENAI_API_KEY`.

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

## Final Validation Summary

日期：2026-05-21

## T07/T08 Blocker Retry: Embedding Compatibility and Controlled Knowledge Flow

日期：2026-05-21

Status: PARTIAL/BLOCKED.

Code change:

- `apps/web/src/ai/knowledge/embedding.ts` now keeps the AI SDK OpenAI
  embedding path as the primary path, and falls back to a server-side
  OpenAI-compatible embeddings request without `encoding_format` only when the
  provider error body reports the unsupported `encoding_format` parameter.
- The fallback validates that the response is a real embeddings response with
  `data[].embedding`; it does not accept non-embedding response shapes as
  successful embeddings.
- No `.env`, secret, dependency, `package.json`, lockfile, DB schema, migration,
  or CI/CD file was changed.

Provider/config evidence:

- Effective embedding base URL uses `OPENAI_BASE_URL`.
- Effective embedding host is non-official OpenAI:
  `api-xai.ainaibahub.com`.
- The AI SDK OpenAI embedding request failed with `AI_APICallError`,
  status `400`, message `Bad Request`, and sanitized `responseBody` containing
  `encoding_format`.
- Direct fallback request without `encoding_format` reached the endpoint, but
  `/embeddings` and `/v1/embeddings` returned a Responses API-shaped object
  with keys such as `background`, `completed_at`, `instructions`, `output`, and
  no `data[].embedding`.
- Direct official OpenAI embeddings smoke with the same effective key returned
  HTTP `401 invalid_api_key`; no key value was printed in this report.

Controlled DB write evidence after user confirmation:

- Authenticated Chrome session reached `/knowledge` as `admin` /
  `admin@gmail.com`.
- UI embedding configuration check passed.
- Two controlled manual knowledge sources were submitted through the existing
  `/knowledge` UI path:
  - `v0.4 controlled knowledge source 2026-05-21`
  - `v0.4 controlled knowledge source 2026-05-21 retry`
- Both controlled sources were written to `knowledge_source`, but both ended
  with `status=failed`.
- Latest controlled failure reason:
  `Embedding provider returned 0 embeddings for 1 input values. Expected
  OpenAI-compatible embeddings response with data[].embedding.`

Read-only DB/vector evidence after retry:

- PostgreSQL read-only guard: `default_transaction_read_only=on`.
- `vector` extension exists: version `0.8.2`.
- App-created embedding storage tables matching `%embedding%` were not found.
- `ready_sources=0`.
- `source_chunk_count=0`.
- `source_vector_count=0`.
- `controlled_sources=2`.
- `controlled_failed=2`.
- `knowledge_chunk` rows: `0`.
- `knowledge_chunk.vector_id` rows: `0`.

Conclusion:

- The original `encoding_format` compatibility issue was narrowed and partially
  mitigated in code, but the configured endpoint is still not a usable
  OpenAI-compatible embeddings endpoint for this environment.
- Controlled knowledge flow did not complete chunk -> embedding -> vector
  upsert -> retrieval -> citation.
- Knowledge-enabled citation smoke cannot be marked PASS.
- DB/vector controlled retrieval cannot be marked PASS.
- Overall T07 remains PARTIAL.
- Overall T08 remains PARTIAL.
- v0.4 remains PARTIAL.

## T07/T08 Config Unification Retry

日期：2026-05-22

Status: PARTIAL/BLOCKED.

Code/config change:

- `packages/env/src/server.ts` removed the separate embedding key/base URL env
  names.
- `apps/web/src/ai/knowledge/config.ts` now resolves embeddings directly from
  `OPENAI_API_KEY` and `OPENAI_BASE_URL`.
- `AI_EMBEDDING_MODEL` remains the embedding model selector.
- No `.env`, secret, dependency, `package.json`, lockfile, DB schema, migration,
  or CI/CD file was changed.

Updated assumption:

- The current `OPENAI_API_KEY` / `OPENAI_BASE_URL` pair is expected to support
  OpenAI-compatible `/v1/embeddings`.

Static validation:

- `pnpm check:env`: PASS.
- `pnpm check:package-exports`: PASS.
- `pnpm check:db-shims`: PASS.
- `pnpm --filter @repo/web typecheck`: PASS.
- `pnpm --filter @repo/ai typecheck`: PASS.
- `pnpm --filter @repo/db typecheck`: PASS.
- `pnpm lint`: PASS.
- `git diff --check`: PASS.

Authenticated/browser evidence:

- Dev server started with `pnpm --filter @repo/web dev`.
- Chrome authenticated session reached `/knowledge`.
- Authenticated user visible in UI: `admin` / `admin@gmail.com`.
- Knowledge form unlocked after configuration check, confirming the app runtime
  sees embedding config as present.

Controlled ingestion evidence:

- Controlled source title:
  `v0.4 embedding unified smoke 2026-05-22`.
- Controlled source id: `cLeXMBE4Qzhu1rVG74786`.
- Controlled document id: `EBlAkanhZ3tUwyZsLWl2g`.
- Result: `status=failed`, `chunkCount=0`, `vectorCount=0`.
- Sanitized failure:
  `Embedding provider returned 0 embeddings for 1 input values. Expected
  OpenAI-compatible embeddings response with data[].embedding. Response keys:
  background, completed_at, created_at, error, frequency_penalty, id,
  incomplete_details, instructions.`

Read-only DB/vector evidence after retry:

- `vector` extension exists: version `0.8.2`.
- Controlled source rows: `1`.
- Controlled document rows: `1`.
- Controlled chunk rows: `0`.
- Controlled vector ids: `0`.
- Ready sources: `0`.
- Ready source chunk count: `0`.
- Ready source vector count: `0`.
- App-created embedding tables matching `%embedding%`: `0`.

Conclusion:

- Config fork removal is complete.
- The current `OPENAI_API_KEY` / `OPENAI_BASE_URL` path is still not returning
  an OpenAI-compatible embeddings payload in this environment.
- Controlled retrieval did not complete chunk -> embedding -> vector upsert ->
  retrieval -> citation.
- Authenticated knowledge citation smoke cannot be marked PASS because ingestion
  failed before retrievable vectors and citations existed.
- Overall T07 remains PARTIAL.
- Overall T08 remains PARTIAL.
- v0.4 remains PARTIAL.

Static and code validation:

- T01/T03/T04 docs-only diff checks passed.
- T02 boundary checks passed: `pnpm check:package-exports`,
  `pnpm check:db-shims`, `pnpm check:env`, `git diff --check`.
- T05 code validation passed: `pnpm check:env`,
  `pnpm check:package-exports`, `pnpm check:db-shims`, `pnpm format`,
  `pnpm lint`, `pnpm --filter @repo/ai typecheck`,
  `pnpm --filter @repo/db typecheck`,
  `pnpm --filter @repo/web typecheck`, `git diff --check`.
- T06 readiness validation passed: `pnpm check:env`, `git diff --check`.
- T07 authenticated base runtime smoke passed, but knowledge citation runtime is
  PARTIAL/BLOCKED.
- T08 real PostgreSQL/vector checks passed for DB connection, tables, and
  `vector` extension, but controlled vector retrieval is PARTIAL/BLOCKED.
- T07/T08 blocker retry confirmed the current effective embedding endpoint is
  not a usable embeddings API even after removing `encoding_format`; controlled
  source writes failed before chunk/vector creation.

Overall validation result:

- Boundary hardening status: PASS with T03 skipped because T02 found no required
  patch.
- Citation persistence status: PASS for no-migration compact source-part
  persistence; live knowledge citation generation remains blocked by retrieval.
- Runtime smoke status: PARTIAL.
- DB/vector verification status: PARTIAL.
- v0.4 acceptance status: PARTIAL.
