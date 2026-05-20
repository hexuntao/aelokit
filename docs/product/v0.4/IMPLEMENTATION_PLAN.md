# v0.4 Implementation Plan

状态：READY_FOR_REVIEW

本计划用于 future `/goal implementation`。当前回合只生成 planning 文档。

执行规则：

- 每次只执行一个 task。
- 不继承旧 v0.2/v0.3 TASK 编号。
- 不把 v0.3 validation notes 自动升级为 implementation scope。
- 每个 task 都必须可执行、可验证、可回滚。
- DB-mutating commands、dependency changes、schema/migration changes 必须单独确认。

## V0.4-T01 Stack Decision Review and Freeze

目标：

- 审查并确认 `AI_STACK_DECISION_RECORD.md` 是否与当前 repo、官方文档、v0.4 scope 一致。

范围：

- Docs-only。
- 允许更新 `docs/product/v0.4/AI_STACK_DECISION_RECORD.md` 和 `docs/product/v0.4/OFFICIAL_DOCS_RESEARCH.md`。

涉及文件：

- `docs/product/v0.4/AI_STACK_DECISION_RECORD.md`
- `docs/product/v0.4/OFFICIAL_DOCS_RESEARCH.md`
- `docs/product/v0.4/OPEN_QUESTIONS.md` only if conflicts are found.

实现要求：

- 重新读取 required docs。
- 如距离上次官方文档查询超过 7 天，重新查询官方 docs。
- 明确 assistant-ui、AI SDK、Mastra、`packages/ai`、`apps/web/src/ai`、`packages/db` 的职责。
- 如果官方 docs 要求 unstable API 才能满足目标，写入 blocker，不实现。

禁止事项：

- 不改 runtime、UI、DB schema、migration、package manifest、lockfile。
- 不接 Assistant Cloud。
- 不接真实 MCP。

验收标准：

- Decision Record 的 selected stack、non-decisions、revisit triggers 完整。
- No official-doc conflict remains unrecorded。

测试要求：

```bash
git diff --check
git diff --stat
git diff --name-only
```

依赖任务：

- None.

是否可并行：

- 可与 V0.4-T02 并行做 read-only audit，但不建议并行写同一 docs。

回滚策略：

- Revert this task's doc edits only.

## V0.4-T02 Runtime Boundary Audit

目标：

- 审计现有 runtime/package/schema/env/UI 边界，产生 code-grounded hardening findings。

范围：

- Read-only audit by default。
- 只在发现小型文档偏差时更新 `RUNTIME_BOUNDARY_HARDENING_PLAN.md` 或 `OPEN_QUESTIONS.md`。

涉及文件：

- `apps/web/src/app/api/ai/chat/route.ts`
- `apps/web/src/ai/**`
- `apps/web/src/components/ai/**`
- `packages/ai/src/**`
- `packages/db/src/ai.schema.ts`
- `packages/db/src/knowledge.schema.ts`
- `packages/env/src/**`
- `docs/product/v0.4/RUNTIME_BOUNDARY_HARDENING_PLAN.md`

实现要求：

- 验证 `/api/ai/chat` 是唯一 chat stream route。
- 验证 client 不读取 provider/embedding secrets。
- 验证 `packages/ai` 没有 live runtime。
- 验证 usage audit 不调用 credits ledger。
- 验证 `apps/web/src/db` 仍是 shim。
- 验证 citation 当前 response-only limitation。

禁止事项：

- 不改 business runtime unless a follow-up task explicitly opens code hardening。
- 不写 DB schema/migration。
- 不运行 DB-mutating commands。

验收标准：

- Audit findings 有 file/path evidence。
- 无冲突则明确写 no blocking boundary drift found。
- 有冲突则写 `OPEN_QUESTIONS.md` 或提出最小后续任务。

测试要求：

```bash
pnpm check:package-exports
pnpm check:db-shims
pnpm check:env
git diff --check
```

依赖任务：

- V0.4-T01 recommended, not required.

是否可并行：

- 可与 T01 并行；不可与 runtime code edits 并行。

回滚策略：

- Audit-only has no code rollback. Revert doc findings if incorrect.

## V0.4-T03 Runtime Boundary Hardening Patch

目标：

- 对 T02 发现的确认问题做最小 code hardening。

范围：

- 仅限 T02 确认的 boundary drift。
- 不引入新功能。

涉及文件：

- `apps/web/src/app/api/ai/chat/route.ts`
- `apps/web/src/ai/**`
- `apps/web/src/components/ai/**`
- `packages/ai/src/**`
- existing check scripts only if boundary check coverage is missing.

实现要求：

- 保持 `POST /api/ai/chat`。
- 保持 assistant-ui + AI SDK v6 stream path。
- 保持 secrets server-only。
- 保持 `packages/ai` runtime-free。
- 保持 usage audit and credits separation。
- Add or adjust focused checks only when existing checks do not cover the confirmed boundary.

禁止事项：

- 不创建 `/api/chat`。
- 不改 schema/migration。
- 不改 package manifest/lockfile。
- 不接 MCP、Assistant Cloud、credits charging。
- 不做 unrelated refactor。

验收标准：

- T02 finding 被最小化修复。
- Boundary checks pass。
- No forbidden path changed。

测试要求：

```bash
pnpm check:env
pnpm check:package-exports
pnpm check:db-shims
pnpm --filter @repo/ai typecheck
pnpm --filter @repo/web typecheck
git diff --check
```

依赖任务：

- V0.4-T02.

是否可并行：

- 不可与 other code edits 并行。

回滚策略：

- Revert files touched by this task.
- Rerun the same checks.

## V0.4-T04 Citation Persistence Final Design

目标：

- 将 citation persistence design 从候选方案收敛到 v0.4 accepted design。

范围：

- Docs-only by default。
- 可以明确选择 no-migration source/data part persistence 作为 future implementation path。

涉及文件：

- `docs/product/v0.4/CITATION_PERSISTENCE_DESIGN.md`
- `docs/product/v0.4/OPEN_QUESTIONS.md`
- read-only: `apps/web/src/app/api/ai/chat/route.ts`
- read-only: `apps/web/src/ai/persistence/index.ts`
- read-only: `packages/db/src/ai.schema.ts`

实现要求：

- 比较 no-migration source/data parts 和 future dedicated table。
- 明确 replay semantics。
- 明确 access snapshot/current access relationship。
- 明确 raw content minimization。
- 明确 migration gate。

禁止事项：

- 不实现 code persistence unless a separate implementation task opens it。
- 不创建 citation table。
- 不生成 migration。

验收标准：

- Design has one recommended path and one future path。
- Design states what is PASS/PARTIAL for citation acceptance。

测试要求：

```bash
git diff --check
git diff --stat
```

依赖任务：

- V0.4-T01.

是否可并行：

- 可与 T02 并行。

回滚策略：

- Revert design doc changes.

## V0.4-T05 Optional No-Migration Citation Persistence Patch

目标：

- 如果用户确认实现 citation persistence，则用现有 `ai_message_part` source/data part support 实现 replayable citations without migration。

范围：

- Optional。默认不执行。
- 不修改 schema。

涉及文件：

- `apps/web/src/app/api/ai/chat/route.ts`
- `apps/web/src/ai/persistence/index.ts`
- `apps/web/src/components/ai/**`
- possible nearby tests if existing.

实现要求：

- Convert retrieval citations to AI SDK source/data parts or persisted message source parts。
- Live UI can still use metadata/header。
- Reloaded messages can render persisted citations。
- Do not store raw full source text by default。

禁止事项：

- 不改 DB schema。
- 不生成 migration。
- 不把 citations only 留在 response header。
- 不重跑 retrieval as historical citation fact。

验收标准：

- Fresh response shows citations。
- Reloaded thread shows citations from persistence。
- Existing response-only limitation removed or downgraded with exact explanation。

测试要求：

```bash
pnpm --filter @repo/web typecheck
pnpm check:db-shims
git diff --check
```

依赖任务：

- V0.4-T04.
- User confirmation required.

是否可并行：

- 不可与 T03 runtime code patch 并行 unless files are disjoint and explicitly coordinated.

回滚策略：

- Revert route/UI/persistence changes。
- Existing persisted source/data parts remain inert history; document if cleanup is needed.

## V0.4-T06 Smoke Environment Readiness

目标：

- 在不写业务代码的前提下确认 runtime smoke 和 DB/vector verification 的环境是否具备。

范围：

- Read-only environment validation。
- 不打印 secret。

涉及文件：

- `docs/product/v0.4/SMOKE_AND_VECTOR_VERIFICATION_PLAN.md`
- `packages/env/src/server.ts` read-only.
- `env.example` read-only.

实现要求：

- 确认 required env names exist in schema/example。
- 确认 dev server command。
- 确认 DB connection strategy。
- 确认 pgvector enablement requires user confirmation if missing。

禁止事项：

- 不改 `.env`。
- 不打印 key。
- 不运行 DB-mutating command。

验收标准：

- Readiness report says READY / BLOCKED with missing prerequisites。

测试要求：

```bash
pnpm check:env
git diff --check
```

依赖任务：

- None.

是否可并行：

- 可与 docs tasks 并行。

回滚策略：

- Revert readiness doc changes only.

## V0.4-T07 Authenticated Runtime Smoke Execution

目标：

- 执行真实 browser-authenticated runtime smoke。

范围：

- Validation-only unless a blocker is found and user opens fix task。

涉及文件：

- No source writes by default.
- Validation report under `docs/product/v0.4/` may be added only if requested.

实现要求：

- Start web app or use existing dev server。
- Authenticate test user。
- Send chat message through UI。
- Verify `/api/ai/chat` stream。
- Verify thread/message/usage persistence。
- Verify no credits ledger mutation。

禁止事项：

- 不改 runtime while validating。
- 不伪造 PASS。
- 不 run full test suite unless user asks。

验收标准：

- Runtime smoke evidence recorded。
- BLOCKED/PARTIAL/PASS stated honestly。

测试要求：

- Browser evidence.
- DB read evidence.
- Relevant static checks if source changed.

依赖任务：

- V0.4-T06.

是否可并行：

- 不建议并行；runtime smoke should be isolated.

回滚策略：

- Validation-only has no source rollback.
- If test data was created, cleanup only if user confirms DB mutation.

## V0.4-T08 DB/Vector Verification Execution

目标：

- 验证 PostgreSQL、`vector` extension、knowledge tables、PgVector index、controlled retrieval。

范围：

- Validation-only。
- DB reads allowed; DB writes require user confirmation.

涉及文件：

- No source writes by default.
- `docs/product/v0.4/SMOKE_AND_VECTOR_VERIFICATION_PLAN.md` may be updated with target-specific SQL notes.

实现要求：

- Confirm PostgreSQL connection。
- Confirm `vector` extension。
- Confirm AI/knowledge tables。
- Confirm `aelokit_knowledge_embeddings` index or current Mastra PgVector storage shape。
- Run controlled retrieval only when environment is ready。

禁止事项：

- 不运行 `db:enable-pgvector` without explicit confirmation。
- 不运行 migration/db push。
- 不 destructively clean DB。

验收标准：

- DB/vector evidence recorded。
- Missing `vector` or embedding key is BLOCKED, not FAIL-by-code.

测试要求：

- Read-only SQL evidence.
- App-level retrieval evidence when possible.

依赖任务：

- V0.4-T06.

是否可并行：

- 可与 T07 after readiness, but avoid sharing mutable test data unless coordinated.

回滚策略：

- Validation-only has no source rollback.
- Test data cleanup requires confirmation.

## V0.4-T09 Final Acceptance Report

目标：

- 汇总 v0.4 implementation acceptance。

范围：

- Docs-only report.

涉及文件：

- `docs/product/v0.4/` report file if requested by user.
- `docs/product/v0.4/OPEN_QUESTIONS.md` if unresolved blockers remain.

实现要求：

- List read set。
- List changed files。
- List verification commands and results。
- Distinguish static checks, runtime smoke, DB/vector verification。
- State PASS / PARTIAL / BLOCKED。

禁止事项：

- 不把 code review 写成 runtime smoke PASS。
- 不把 blocked prerequisites 隐藏为 success。

验收标准：

- Acceptance status is explicit and evidence-backed。

测试要求：

```bash
git diff --check
git diff --stat
```

依赖任务：

- T01-T08 as applicable.

是否可并行：

- No. Final report depends on evidence.

回滚策略：

- Revert final report if incorrect.
