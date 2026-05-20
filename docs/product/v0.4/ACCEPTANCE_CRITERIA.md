# v0.4 Acceptance Criteria

状态：READY_FOR_REVIEW

本文件定义 v0.4 implementation 的验收标准。当前 planning 回合只生成文档，不执行 implementation。

## 1. Acceptance Levels

### PASS

只有满足以下条件时，v0.4 才能标记 PASS：

- Static checks 通过。
- Runtime boundary checks 通过。
- Authenticated browser runtime smoke 通过。
- DB/vector verification 通过。
- Citation persistence design 被实现或明确保持为设计阶段并在 acceptance 中标注限制。
- 无 forbidden path 修改。

### PARTIAL

以下情况必须标记 PARTIAL：

- 代码/文档检查通过，但 authenticated runtime smoke 未执行。
- runtime smoke 通过，但 DB/vector verification 未执行。
- DB/vector verification 只检查了 schema 文件，没有连接真实 PostgreSQL。
- citation 仍 response-only 且未实现 replayable persistence。

### BLOCKED

以下情况必须标记 BLOCKED：

- 缺 authenticated browser session。
- 缺 `DATABASE_URL` 或 PostgreSQL 不可用。
- PostgreSQL 未启用 `vector` 且用户未授权执行 `db:enable-pgvector`。
- 缺 provider key 或 embedding key。
- 用户未确认 DB-mutating command、migration 或 dependency change。

## 2. Documentation Acceptance

- Required Reading 文档已读取并在完成报告列出。
- `OFFICIAL_DOCS_RESEARCH.md` 包含官方文档结论，并只记录 v0.4 相关内容。
- `PRODUCT_PRD.md`, `SCOPE_FREEZE.md`, `IMPLEMENTATION_PLAN.md` 三者 scope 一致。
- `IMPLEMENTATION_PLAN.md` 不继承旧 v0.2/v0.3 TASK 编号。
- `OPEN_QUESTIONS.md` 记录发现的文档冲突。
- 不把 roadmap v0.4 段落直接作为 task list。

## 3. AI Stack Decision Acceptance

- `AI_STACK_DECISION_RECORD.md` 明确 assistant-ui、AI SDK、Mastra、`/api/ai/chat`、`apps/web/src/ai`、`packages/ai`、`packages/db` 的职责。
- 明确 AI SDK v6 是当前 stack baseline。
- 明确 Assistant Cloud 不默认启用。
- 明确 Mastra 不接管所有 chat。
- 明确 real third-party MCP 和 local stdio MCP 不进入 v0.4 implementation。
- 明确 official docs 中存在某能力不等于 scope acceptance。

## 4. Runtime Boundary Acceptance

- 未新增 `apps/web/src/app/api/chat/route.ts`。
- `POST /api/ai/chat` 仍是 chat stream route。
- `apps/web/src/ai` 持有 app runtime wiring。
- `apps/web/src/components/ai` 不初始化 provider SDK、不读 server secret、不写 DB schema、不调用 credits ledger。
- `packages/ai` 不 import `apps/web`、`next/*` runtime API、React UI、DB query、provider SDK runtime 或 Mastra runtime。
- `packages/db/src/schema.ts` 仍是 DB schema aggregation entrypoint。
- `apps/web/src/db/*` 仍为 shim，不写真实 schema。
- usage audit 不调用 `@repo/credits` ledger。
- provider secret / embedding secret 不进入 client payload、client component、client hook 或 `NEXT_PUBLIC_*`。

## 5. Citation Acceptance

v0.4 至少必须完成 citation persistence design：

- 明确当前 response-only citation 限制。
- 明确 source/data part persistence 方案是否可在无 migration 下实现。
- 明确 future dedicated citation table 的字段、关系和 migration gate。
- 明确 replay semantics：历史消息 replay 不应重新执行 retrieval 作为“原始引用事实”。
- 明确 access policy：replay citation 显示与当前 source access 的关系。
- 明确 raw content minimization：不要默认把完整 source content 存到 citation snapshot。

如果 v0.4 implementation 选择不实现 citation persistence，只能标记 citation acceptance 为 DESIGN ACCEPTED / RUNTIME PERSISTENCE NOT IMPLEMENTED，不能标记 full replay PASS。

## 6. Runtime Smoke Acceptance

Authenticated runtime smoke 必须验证：

- 用户已登录。
- 用户能进入 AI workspace。
- 发送 message 到 `POST /api/ai/chat`。
- 响应为 UI message stream，不是 plain text stream。
- response headers 或 metadata 包含 `x-ai-thread-id` / `x-ai-message-id` 或等价 evidence。
- thread/message persistence 可在 DB 中查到。
- usage audit 可在 DB 中查到，且未写 credits ledger。
- memory toggle 默认行为和 confirmed-only recall 不回归。
- knowledge toggle 在具备 embedding/vector 条件时可返回 citations。
- 失败路径能记录 error status，不伪造 success。

## 7. DB/Vector Acceptance

DB/vector verification 必须验证：

- PostgreSQL 可连接。
- `vector` extension 存在。
- `packages/db` schema ownership 未漂移。
- AI tables 和 knowledge tables 存在。
- `ai_memory_draft` 存在且支持 pending/confirmed/deleted semantics。
- `knowledge_source`, `knowledge_document`, `knowledge_chunk`, `knowledge_source_access` 存在。
- PgVector index `aelokit_knowledge_embeddings` 存在或创建路径明确。
- 至少一个 controlled knowledge source 可完成 chunk -> embedding -> vector upsert -> retrieval -> citation。
- embedding dimension 与 current embedding model 匹配。

不得把读取 schema 文件替代真实 DB/vector verification。

## 8. Required Verification Commands

Planning/docs-only changes:

```bash
git diff --check
git diff --stat
git diff --name-only
```

Future implementation static checks:

```bash
pnpm check:env
pnpm check:package-exports
pnpm check:db-shims
pnpm --filter @repo/ai typecheck
pnpm --filter @repo/db typecheck
pnpm --filter @repo/web typecheck
```

Runtime smoke and DB/vector verification require explicit environment readiness. DB-mutating commands such as `db:enable-pgvector`, `db:migrate`, `db:push`, seed scripts or destructive SQL require explicit user confirmation.
