# v0.4 Scope Freeze

状态：READY_FOR_REVIEW

本文件定义 v0.4 的产品和工程范围。它不代表当前回合开始实现；当前回合只生成 planning 文档。v0.4 implementation 必须等用户确认本文件、`ACCEPTANCE_CRITERIA.md` 和 `IMPLEMENTATION_PLAN.md` 后才能开始。

## 1. Scope Summary

v0.4 scope 是 AI Stack Decision + Runtime Boundary Hardening。

v0.4 允许：

- 冻结 assistant-ui / Vercel AI SDK / Mastra / AeloKit app/package/db 的 stack decision。
- 加固现有 `POST /api/ai/chat` runtime boundary。
- 把 v0.3 accepted-with-notes 中的 runtime smoke 和 DB/vector verification 变成 implementation acceptance gate。
- 设计 citation persistence，但不立即执行 migration。
- 为 future tools/MCP 做安全边界和 contract readiness，但不接真实 third-party MCP。

## 2. In Scope

### S-01 AI Stack Decision Record

- 确认 assistant-ui 是 UI/runtime state layer。
- 确认 Vercel AI SDK v6 是 streaming / `UIMessage` / metadata / tool stream protocol layer。
- 确认 Mastra 是 app-wired memory/knowledge and future agent/workflow/tool/MCP runtime。
- 确认 `packages/ai` 只放 contracts/runtime-types/adapters type surface。
- 确认 `apps/web/src/ai` 放 provider/Mastra/runtime wiring。
- 确认 `packages/db` 放 schema/migration ownership。

### S-02 Runtime Boundary Hardening

- 审计并必要时加固 `/api/ai/chat` route boundary。
- 审计 provider/embedding secret server-only boundary。
- 审计 `packages/ai` 是否仍无 live runtime side effects。
- 审计 `apps/web/src/components/ai` 是否仍只做 UI。
- 审计 usage audit 与 credits ledger 分离。
- 审计 citation/source metadata 在 stream/header/UI/persistence 间的边界。

### S-03 v0.3 Notes Acceptance Gate

- runtime smoke 必须在 authenticated browser session 中验证。
- DB/vector verification 必须验证真实 PostgreSQL、`vector` extension、knowledge tables、PgVector index 和 vector count。
- 无法执行时只能标记 BLOCKED 或 PARTIAL，不能标记 PASS。

### S-04 Citation Persistence Design

- 设计 citation replay semantics。
- 设计 no-migration source/data part persistence 方案。
- 设计 future dedicated citation table 方案。
- 明确 migration gate 和人工确认条件。

### S-05 Tool/MCP Boundary Readiness

- 只做 contract/security boundary readiness。
- 可以定义未来工具权限、approval、audit、credential reference 的设计要求。
- 不接真实 third-party MCP。
- 不默认启用 local stdio MCP。

## 3. Out of Scope

- real third-party MCP provider integration。
- local stdio MCP。
- Assistant Cloud。
- Mastra platform/server deployment。
- worker/gateway/studio/design-system split。
- credits charging / reservation / settlement。
- payment entitlement rewrite。
- admin audit UI expansion。
- schema file modification。
- migration generation or execution。
- destructive DB operation。
- dependency install or manifest update。
- `package.json` / `pnpm-lock.yaml` changes。
- `.env` changes or secret rotation。
- CI/CD config changes。
- replacing `/api/ai/chat` with a new route.
- creating `/api/chat`。

## 4. Allowed Current Planning Writes

当前 planning 回合只允许写：

- `docs/product/v0.4/OFFICIAL_DOCS_RESEARCH.md`
- `docs/product/v0.4/PRODUCT_PRD.md`
- `docs/product/v0.4/SCOPE_FREEZE.md`
- `docs/product/v0.4/ACCEPTANCE_CRITERIA.md`
- `docs/product/v0.4/IMPLEMENTATION_PLAN.md`
- `docs/product/v0.4/AI_STACK_DECISION_RECORD.md`
- `docs/product/v0.4/RUNTIME_BOUNDARY_HARDENING_PLAN.md`
- `docs/product/v0.4/CITATION_PERSISTENCE_DESIGN.md`
- `docs/product/v0.4/SMOKE_AND_VECTOR_VERIFICATION_PLAN.md`
- `docs/product/v0.4/ALLOWED_PATHS.md`
- `docs/product/v0.4/CODEX_GOAL_PROMPT.md`
- `docs/product/v0.4/OPEN_QUESTIONS.md` only for conflicts discovered during planning.

## 5. Future Implementation Gates

Future v0.4 implementation must satisfy all gates:

- User confirms this Scope Freeze.
- User confirms Acceptance Criteria.
- User confirms Implementation Plan.
- Each `/goal` executes exactly one v0.4 task.
- Any DB-mutating command requires explicit user confirmation at that time.
- Any dependency change requires a separate exact package/version/install plan and user confirmation.
- Any schema/migration work requires a separate Scope Freeze update and user confirmation.

## 6. Non-Regression Guardrails

v0.4 must not regress:

- `POST /api/ai/chat` remains the only AI chat stream route.
- Memory create/confirm boundary remains intact: Create does not write durable Mastra memory; Confirm does.
- Chat recall only reads confirmed and not-disabled memory belonging to the user.
- Knowledge retrieval keeps owner/public/shared access policy.
- Knowledge retrieval can overfetch before access filtering, but cannot widen access policy.
- Provider and embedding secrets remain server-only.
- Usage audit remains separate from credits ledger.
- `packages/ai` remains free of live runtime, DB query, route handler and UI ownership.

## 7. Scope Change Process

If a future task needs to add MCP runtime, schema/migration, dependency changes, app split, design-system extraction, Assistant Cloud or credits charging, it must:

- Add or update `docs/product/v0.4/OPEN_QUESTIONS.md`.
- Produce a focused scope update.
- Wait for user confirmation.
- Only then modify implementation files.
