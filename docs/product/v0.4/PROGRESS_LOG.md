# v0.4 Progress Log

本文件记录 V0.4-T01 到 V0.4-T09 的执行进度。T01-T08 的真实 commit SHA 已在 T09 final acceptance 阶段回填。T09 的 commit SHA 无法写入同一个 commit 内容；以最终 `git log --oneline` 为准。

## V0.4-T01 Stack Decision Review and Freeze

- status: PASS
- changed files:
  - `docs/product/v0.4/AI_STACK_DECISION_RECORD.md`
  - `docs/product/v0.4/PROGRESS_LOG.md`
- validation commands:
  - `git diff --check`
  - `git diff --stat`
  - `git diff --name-only`
- result:
  - AI stack decision record frozen for v0.4 implementation.
  - Official docs research is dated 2026-05-20, so the 7-day refresh rule did not require a live docs refresh.
  - Current package evidence matches the selected stack: assistant-ui, AI SDK v6, app-local Mastra runtime, `packages/ai` contracts, and `packages/db` schema ownership.
  - No official-doc conflict remained unrecorded.
- commit: `f9c1a2d`
- next task decision: continue to V0.4-T02 Runtime Boundary Audit.

## V0.4-T02 Runtime Boundary Audit

- status: PASS
- changed files:
  - `docs/product/v0.4/RUNTIME_BOUNDARY_HARDENING_PLAN.md`
  - `docs/product/v0.4/PROGRESS_LOG.md`
- validation commands:
  - `pnpm check:package-exports`
  - `pnpm check:db-shims`
  - `pnpm check:env`
  - `git diff --check`
- result:
  - No blocking runtime boundary drift found.
  - Required validation commands passed.
  - `/api/ai/chat` remains the only AI chat stream route.
  - provider/embedding secrets remain server-side; client component hits are display-only env names.
  - `packages/ai` remains runtime-free.
  - AI usage audit remains separated from credits ledger.
  - `apps/web/src/db/*.ts` source files remain shim-only.
  - Citation response-only limitation remains confirmed and is assigned to T04/T05, not T03.
- commit: `cefec1e`
- next task decision: mark V0.4-T03 SKIPPED unless validation exposes a new boundary issue, then continue to V0.4-T04.

## V0.4-T03 Runtime Boundary Hardening Patch

- status: SKIPPED
- changed files:
  - `docs/product/v0.4/PROGRESS_LOG.md`
- validation commands:
  - `git diff --check`
  - `git diff --stat`
  - `git diff --name-only`
- result:
  - T02 found no blocking runtime boundary drift requiring a code hardening patch.
  - No runtime, UI, package, schema, migration, manifest, lockfile, env, or CI files were changed.
  - Citation replay remains assigned to T04/T05 under the explicit no-migration citation persistence rules.
- commit: `895c12e`
- next task decision: continue to V0.4-T04 Citation Persistence Final Design.

## V0.4-T04 Citation Persistence Final Design

- status: PASS
- changed files:
  - `docs/product/v0.4/CITATION_PERSISTENCE_DESIGN.md`
  - `docs/product/v0.4/PROGRESS_LOG.md`
- validation commands:
  - `git diff --check`
  - `git diff --stat`
- result:
  - Citation persistence design is accepted for v0.4.
  - Recommended path is no-migration source/data part persistence using existing `ai_message_part` support.
  - Future dedicated citation table remains out of v0.4 scope and requires separate schema/migration confirmation.
  - Replay semantics, access relationship, raw content minimization, and migration gate are documented.
- commit: `fc4a872`
- next task decision: continue to V0.4-T05 because the current prompt explicitly approves the no-migration citation persistence patch under strict constraints.

## V0.4-T05 Optional No-Migration Citation Persistence Patch

- status: PASS
- changed files:
  - `apps/web/src/app/api/ai/chat/route.ts`
  - `apps/web/src/ai/persistence/index.ts`
  - `apps/web/src/ai/knowledge/index.ts`
  - `docs/product/v0.4/PROGRESS_LOG.md`
- validation commands:
  - `pnpm check:env`
  - `pnpm check:package-exports`
  - `pnpm check:db-shims`
  - `pnpm format`
  - `pnpm lint`
  - `pnpm --filter @repo/ai typecheck`
  - `pnpm --filter @repo/db typecheck`
  - `pnpm --filter @repo/web typecheck`
  - `git diff --check`
- result:
  - Required validation commands passed.
  - Retrieval citations are converted to compact `source-document` snapshots and persisted through existing `ai_message_part` source-part support.
  - Live response metadata/header citation display is preserved.
  - Historical message loading now reconstructs persisted parts and citation metadata from `ai_message_part` without rerunning retrieval.
  - No schema, migration, dependency, manifest, lockfile, raw full source body, or dedicated citation table change was made.
- commit: `434040c`
- next task decision: continue to V0.4-T06 Smoke Environment Readiness.

## V0.4-T06 Smoke Environment Readiness

- status: PASS
- changed files:
  - `docs/product/v0.4/SMOKE_AND_VECTOR_VERIFICATION_PLAN.md`
  - `docs/product/v0.4/PROGRESS_LOG.md`
- validation commands:
  - `pnpm check:env`
  - `git diff --check`
- result:
  - Required validation commands passed.
  - Local `.env` is present and required smoke env names are present or covered by schema defaults/fallbacks.
  - `DATABASE_URL`, `BETTER_AUTH_SECRET`, `OPENAI_API_KEY`, and `NEXT_PUBLIC_BASE_URL` are present without printing secret values.
  - Effective embedding key is present through `OPENAI_API_KEY`; `AI_EMBEDDING_PROVIDER` and `AI_EMBEDDING_MODEL` rely on schema defaults.
  - `pnpm`, `node`, and `psql` are available.
  - Actual authenticated browser session, PostgreSQL connectivity, `vector` extension, and controlled retrieval remain T07/T08 execution evidence, not T06 PASS evidence.
- commit: `6cc9ac2`
- next task decision: continue to V0.4-T07 Authenticated Runtime Smoke Execution.

## V0.4-T07 Authenticated Runtime Smoke Execution

- status: PARTIAL
- changed files:
  - `docs/product/v0.4/VALIDATION_REPORT.md`
  - `docs/product/v0.4/PROGRESS_LOG.md`
- validation commands / evidence:
  - `pnpm --filter @repo/web dev`
  - Chrome authenticated browser session at `/chat`
  - UI message send/render smoke
  - browser-context `POST /api/ai/chat` header and stream check
  - read-only SQL for smoke thread/message/message_part/usage/credit evidence
  - `git diff --check`
- result:
  - Authenticated base chat smoke passed: UI sent a message and rendered `pong`.
  - `/api/ai/chat` returned `200`, `text/event-stream`, and present `x-ai-thread-id` / `x-ai-message-id` headers.
  - DB read evidence found 2 smoke threads, 4 smoke messages, 6 message parts, and 2 successful usage records.
  - Credit transaction count for the smoke user since smoke start was 0.
  - Memory/knowledge default toggles showed Off after clearing browser preference.
  - Knowledge-enabled citation smoke is PARTIAL/BLOCKED because the embedding provider returned HTTP 400 with `Unsupported parameter: encoding_format`.
- commit: `178ea00`
- next task decision: continue to V0.4-T08 DB/Vector Verification Execution and investigate DB/vector/embedding readiness with read-only checks only.

## V0.4-T08 DB/Vector Verification Execution

- status: PARTIAL
- changed files:
  - `docs/product/v0.4/VALIDATION_REPORT.md`
  - `docs/product/v0.4/PROGRESS_LOG.md`
- validation commands / evidence:
  - `PGOPTIONS='-c default_transaction_read_only=on' psql "$DATABASE_URL" ...`
  - env presence check for effective embedding key/provider/model/base URL without printing secret values
  - `git diff --check`
- result:
  - PostgreSQL connection passed against local database `aelokit`.
  - Read-only guard was active with `default_transaction_read_only=on`.
  - `vector` extension exists at version `0.8.2`.
  - Required AI, memory, knowledge, and credit tables exist.
  - `ai_message_part_type_check` allows `source`, confirming no schema change is needed for citation source parts.
  - Current DB has 1 `knowledge_source` and 1 `knowledge_document`, but the source is `failed` and there are 0 `knowledge_chunk` rows and 0 vector ids.
  - Expected PgVector storage object `aelokit_knowledge_embeddings` was not present in `public` or `mastra` schema.
  - Controlled retrieval could not be marked PASS because there is no ready indexed vector source and the embedding endpoint already failed during T07 with `Unsupported parameter: encoding_format`.
  - No DB writes, seed scripts, pgvector enablement, migrations, schema edits, package changes, or destructive operations were run.
- commit: `be2adad`
- next task decision: continue to V0.4-T09 Final Acceptance Report with v0.4 overall status expected PARTIAL unless final audit finds stronger blocking evidence.

## V0.4-T09 Final Acceptance Report

- status: PASS
- changed files:
  - `docs/product/v0.4/FINAL_ACCEPTANCE_REPORT.md`
  - `docs/product/v0.4/VALIDATION_REPORT.md`
  - `docs/product/v0.4/OPEN_QUESTIONS.md`
  - `docs/product/v0.4/PROGRESS_LOG.md`
- validation commands:
  - `git diff --check`
  - `git diff --stat`
  - `git diff --name-only`
  - `git status --short`
  - `git log --oneline -n 12`
- result:
  - Final acceptance report produced.
  - Required reports are present.
  - T01-T08 commit SHAs were backfilled.
  - Knowledge/vector blocker is recorded without marking runtime/vector PASS.
  - Overall v0.4 status is PARTIAL because T07/T08 knowledge citation/vector acceptance remains blocked by embedding provider compatibility and absent indexed vector data.
- commit: T09 commit SHA is the commit containing this entry; it cannot be embedded in the same commit. Confirm with final `git log --oneline`.
- next task decision: stop after final commit check; do not proceed to v0.5 implementation until the knowledge/vector blocker is resolved or explicitly carried as accepted risk.

## V0.4-T07/T08 Blocker Retry

- status: PARTIAL/BLOCKED
- changed files:
  - `apps/web/src/ai/knowledge/embedding.ts`
  - `docs/product/v0.4/VALIDATION_REPORT.md`
  - `docs/product/v0.4/FINAL_ACCEPTANCE_REPORT.md`
  - `docs/product/v0.4/OPEN_QUESTIONS.md`
  - `docs/product/v0.4/PROGRESS_LOG.md`
- validation commands / evidence:
  - `pnpm --filter @repo/web dev`
  - authenticated Chrome session at `/knowledge`
  - controlled source creation through existing `/knowledge` UI after user DB-write confirmation
  - sanitized embedding env shape check without printing secrets
  - AI SDK embedding error-shape reproduction without printing secrets
  - direct embedding endpoint shape checks without printing vector values
  - `PGOPTIONS='-c default_transaction_read_only=on' psql "$DATABASE_URL" ...`
  - `pnpm --filter @repo/web typecheck`
  - `pnpm --filter @repo/web lint`
- result:
  - The effective embedding host is `api-xai.ainaibahub.com` because
    `AI_EMBEDDING_BASE_URL` is unset and the app falls back to `OPENAI_BASE_URL`.
  - The AI SDK OpenAI embedding request fails with `AI_APICallError` status
    `400`; sanitized `responseBody` contains `encoding_format`.
  - `apps/web/src/ai/knowledge/embedding.ts` now falls back to a server-side
    OpenAI-compatible embeddings request without `encoding_format` only for that
    compatibility error.
  - The fallback still cannot complete ingestion in this environment because
    the endpoint returns a Responses API-shaped payload for `/embeddings` and
    `/v1/embeddings`, with no `data[].embedding`.
  - Same effective key against official OpenAI embeddings endpoint returned
    `invalid_api_key`.
  - Two controlled knowledge sources were created through the UI and both
    failed before chunk/vector creation.
  - Read-only DB checks showed `vector` extension version `0.8.2`,
    `ready_sources=0`, `source_chunk_count=0`, `source_vector_count=0`,
    `knowledge_chunk=0`, and no app-created embedding table matching
    `%embedding%`.
  - T07 remains PARTIAL because knowledge-enabled citation smoke has no live
    citation evidence.
  - T08 remains PARTIAL because controlled retrieval did not complete
    chunk -> embedding -> vector upsert -> retrieval -> citation.
  - v0.4 remains PARTIAL; do not proceed to v0.5 implementation that depends on
    knowledge/vector runtime.
- next task decision: provide a real embeddings endpoint/key via
  `AI_EMBEDDING_BASE_URL` / `AI_EMBEDDING_API_KEY`, or provide the current host's
  true embeddings API contract for a separate adapter task; then rerun T07/T08.
