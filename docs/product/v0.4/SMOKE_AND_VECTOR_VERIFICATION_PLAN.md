# v0.4 Smoke and Vector Verification Plan

状态：READY_FOR_REVIEW

本计划定义 v0.4 implementation acceptance 所需的真实 runtime / DB / vector 验证。它不授权当前 planning 回合执行 runtime smoke、DB writes、migration 或 secret 修改。

## 1. Verification Principle

Static checks 可以证明代码边界，但不能证明 runtime smoke。

Authenticated runtime smoke 和 DB/vector verification 必须用真实环境证据完成；否则只能标记 PARTIAL 或 BLOCKED。

## 2. Prerequisites

Runtime smoke 需要：

- 可启动的 `apps/web`。
- 可登录测试用户。
- 可用 AI provider key，例如 `OPENAI_API_KEY` 或 configured provider。
- `DATABASE_URL` 指向可用 PostgreSQL。
- PostgreSQL 已启用 `vector` extension。
- Knowledge retrieval 需要 `AI_EMBEDDING_API_KEY` 或 `OPENAI_API_KEY`。
- 测试环境允许创建 controlled test thread/message/knowledge source。

不得在报告中打印 secret 值。

## 3. Static Preflight

```bash
pnpm check:env
pnpm check:package-exports
pnpm check:db-shims
pnpm --filter @repo/ai typecheck
pnpm --filter @repo/db typecheck
pnpm --filter @repo/web typecheck
git diff --check
```

## 4. Authenticated Runtime Smoke

### Scenario A: Base Chat Stream

Goal:

- 验证 authenticated user 可以通过 `POST /api/ai/chat` 得到 UI message stream。

Evidence:

- Browser session is authenticated.
- Network request path is `/api/ai/chat`.
- Response is not plain text stream.
- Response exposes `x-ai-thread-id` and `x-ai-message-id` or equivalent metadata.
- UI renders streamed assistant response.
- DB contains corresponding `ai_thread`, `ai_message`, `ai_message_part`.
- DB contains `ai_usage` audit.
- No `@repo/credits` ledger mutation occurs.

### Scenario B: Memory Boundary

Goal:

- 验证 memory create/confirm/recall boundary 未回归。

Evidence:

- Create action creates pending `ai_memory_draft`.
- Confirm action writes durable Mastra memory and stores mapping.
- Recall reads confirmed and not-disabled memory only.
- Disabled/deleted memory does not appear in chat recall.
- Other users cannot read the memory.

### Scenario C: Knowledge Retrieval and Citation

Goal:

- 验证 controlled knowledge source 可以生成 chunks/vectors 并被 chat retrieval 使用。

Evidence:

- Manual source can be created.
- Source status becomes `ready`.
- `knowledge_source.vector_count` is greater than zero.
- `knowledge_chunk.vector_id` exists.
- Chat with `knowledgeEnabled=true` retrieves source context.
- Response metadata/header includes citations.
- UI renders citations.

If citation persistence is not implemented, record:

```txt
CITATION RUNTIME: RESPONSE-ONLY; REPLAY PERSISTENCE NOT IMPLEMENTED
```

Do not mark citation replay PASS in that case.

## 5. DB Verification

Read-only DB checks should confirm:

- AI tables exist.
- Knowledge tables exist.
- `ai_memory_draft` exists.
- `ai_message_part.part_type` supports `source`.
- `ai_usage` has expected records for smoke request.
- No credits ledger mutation from AI usage audit.

Example checks to adapt to the target DB client:

```sql
select to_regclass('public.ai_thread');
select to_regclass('public.ai_message');
select to_regclass('public.ai_message_part');
select to_regclass('public.ai_usage');
select to_regclass('public.ai_memory_draft');
select to_regclass('public.knowledge_source');
select to_regclass('public.knowledge_document');
select to_regclass('public.knowledge_chunk');
select to_regclass('public.knowledge_source_access');
```

## 6. Vector Verification

Read-only vector checks should confirm:

- `vector` extension exists.
- PgVector index/table for `aelokit_knowledge_embeddings` exists or the app-created vector index is discoverable.
- Embedding dimension matches configured model.
- Vector count matches or exceeds controlled source chunk count.
- A query against the controlled source returns expected candidate metadata.

Example checks:

```sql
select extname from pg_extension where extname = 'vector';
```

The exact Mastra PgVector storage table/index shape must be inspected in the target DB before writing a final SQL assertion, because provider internals can vary by Mastra version.

## 7. DB-Mutating Commands Gate

The following require explicit user confirmation at execution time:

```bash
pnpm --filter @repo/db db:enable-pgvector
pnpm --filter @repo/db db:generate
pnpm --filter @repo/db db:migrate
pnpm --filter @repo/db db:push
pnpm --filter @repo/db db:studio
```

Seed scripts or ad hoc insert/update/delete SQL also require confirmation if they mutate shared DB state.

## 8. Evidence Template

Future validation report should include:

```txt
Runtime Smoke:
- Authenticated browser session: PASS/BLOCKED
- POST /api/ai/chat stream: PASS/FAIL
- Thread/message persistence: PASS/FAIL
- Usage audit: PASS/FAIL
- Credits not mutated: PASS/FAIL

DB/Vector:
- PostgreSQL connected: PASS/FAIL
- vector extension: PASS/FAIL
- knowledge tables: PASS/FAIL
- PgVector index: PASS/FAIL
- Controlled retrieval: PASS/FAIL

Citation:
- Live citations: PASS/FAIL
- Replay persistence: PASS/PARTIAL/BLOCKED

Overall:
- PASS / PARTIAL / BLOCKED
```

## 9. Stop Conditions

Stop verification and report BLOCKED if:

- login cannot be completed.
- provider key is missing.
- embedding key is missing for knowledge scenario.
- DB is unavailable.
- `vector` extension is missing and user has not approved enabling it.
- any required check would require a destructive operation.
