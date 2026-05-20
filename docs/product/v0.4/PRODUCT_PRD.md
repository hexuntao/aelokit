# v0.4 Product PRD

## 1. Product Stage

v0.4 名称：AI Stack Decision + Runtime Boundary Hardening。

v0.4 不是直接实现 roadmap 旧段落中的 Skills / Tools / MCP。根据 Documentation Governance Confirmation，v0.4 先完成：

- AI Stack Decision Record。
- Runtime Boundary Hardening。
- v0.3 accepted-with-notes 的验收前置。
- Citation persistence design，不立即执行 migration。
- Runtime smoke / DB/vector verification planning and acceptance gate。

## 2. Problem

v0.3 已经把 Memory + Knowledge 接入 `POST /api/ai/chat`，并达到 `ACCEPTED WITH NOTES`。但后续继续扩展 tools/MCP/credits/admin audit 前，当前 AI stack 仍有几个必须先冻结或加固的问题：

- assistant-ui、Vercel AI SDK、Mastra 三者的职责容易被重叠解释。
- `/api/ai/chat` 已成为核心路径，但未来 tools/MCP 可能诱导新 route、new transport 或 Mastra-only rewrite。
- Citation 当前主要通过 response header 和 `messageMetadata` 传递，历史消息 replay 不能稳定恢复 sources。
- v0.3 的 authenticated runtime smoke、DB/vector verification 仍是验收 notes，不能在 v0.4 implementation 中继续被静态检查替代。
- 官方文档显示 MCP、tools、evals、Assistant Cloud 能力都存在，但这些能力不能仅因为存在就进入 v0.4 scope。

## 3. Product Goal

v0.4 的目标是让 AeloKit 的 AI workspace 具备可继续演进的工程确定性：明确 stack ownership，硬化 runtime 边界，设计可回放 citation 语义，并把真实 runtime / DB / vector 验证变成 implementation acceptance 的硬门槛。

## 4. Users

- Developer：需要知道 UI、streaming、runtime、contracts、schema、usage audit、memory/knowledge 分别放在哪里。
- Maintainer：需要在后续 tools/MCP/credits 前确认没有 route、secret、DB、package 边界漂移。
- Product operator：需要 citation provenance 和 runtime smoke evidence 支撑“AI workspace 可用”的验收判断。
- Future /goal executor：需要明确的 task boundary、allowed paths、rollback 和验证命令。

## 5. User Stories

1. 作为 developer，我想看到一份 AI stack decision record，从而知道 assistant-ui、AI SDK、Mastra、`packages/ai` 和 `apps/web/src/ai` 的职责边界。
2. 作为 maintainer，我想确保 AI chat 仍走 `POST /api/ai/chat`，从而避免出现 `/api/chat` 或 parallel runtime。
3. 作为 developer，我想明确 citations 是 response-only、source part persistence 还是 future citation table，从而避免历史消息 replay 丢失 provenance。
4. 作为 operator，我想有一份 runtime smoke plan，从而知道哪些证据才算 authenticated smoke PASS。
5. 作为 maintainer，我想 DB/vector verification 有明确前置条件和禁止事项，从而避免未授权执行 `db:enable-pgvector`、migration 或 destructive DB 操作。
6. 作为 future implementer，我想每个 v0.4 task 都可执行、可验证、可回滚，从而可以直接进入单任务 `/goal implementation`。

## 6. Product Requirements

### PRD-01 Stack Decision

v0.4 必须明确：

- assistant-ui 是 AI workspace UI/runtime state layer。
- Vercel AI SDK v6 是 streaming、`UIMessage`、metadata、tool stream protocol layer。
- `POST /api/ai/chat` 是 web app HTTP boundary。
- `apps/web/src/ai` 是 app-local runtime wiring。
- `packages/ai` 是 contracts/runtime-types/adapters type surface，不拥有 live runtime。
- Mastra 是 app-wired deeper runtime for memory/knowledge and future agent/workflow/tool/MCP orchestration。
- `packages/db` 是 schema/migration ownership。

### PRD-02 Runtime Boundary Hardening

v0.4 必须防止：

- 新增 `/api/chat`。
- provider secret / embedding secret 进入 client。
- `packages/ai` 导入 provider SDK runtime、Mastra runtime、DB query、Next route、React UI。
- `apps/web/src/components/ai` 初始化 provider、写 DB schema、调用 credits ledger。
- usage audit 被当作 credits charging。
- Assistant Cloud、real third-party MCP、local stdio MCP 被默认启用。

### PRD-03 Citation Persistence Design

v0.4 必须输出 citation persistence design，至少比较：

- no-migration source/data part persistence using existing `ai_message_part` support。
- future dedicated citation table requiring separate schema/migration confirmation。

设计必须明确：

- replay semantics。
- source/chunk provenance。
- access policy snapshot。
- raw content minimization。
- migration gate。
- rollback。

### PRD-04 Smoke and Vector Verification

v0.4 implementation acceptance 必须包含：

- authenticated browser runtime smoke。
- DB schema/table/read evidence。
- PostgreSQL `vector` extension evidence。
- PgVector index / vector count evidence。
- embedding/provider key readiness evidence without exposing secrets。
- citation response/replay limitation or persistence evidence。

## 7. Non-Goals

- 不实现真实 third-party MCP。
- 不默认启用 local stdio MCP。
- 不默认启用 Assistant Cloud。
- 不创建 worker/gateway/studio/design-system split。
- 不执行 destructive migration。
- 不执行 schema/migration，除非后续独立 Scope Freeze 和用户确认。
- 不修改 `package.json` 或 `pnpm-lock.yaml`，除非后续独立 dependency task 明确打开。
- 不把 roadmap v0.4 段落直接转换成 task list。
- 不继承旧 v0.2/v0.3 TASK 编号。
- 不把 v0.3 validation notes 自动变成实现任务。
- 不把 Mastra 用成所有 chat 的强制路径。
- 不把 usage audit 接入 credits ledger。

## 8. Success Criteria

- v0.4 planning docs 完整生成并互相引用一致。
- AI Stack Decision Record 可被 future implementer 直接执行或审查。
- Runtime Boundary Hardening Plan 明确现有边界、允许文件、禁止事项和验证命令。
- Citation Persistence Design 明确当前限制和下一步方案，但没有 migration。
- Smoke and Vector Verification Plan 能区分 static checks、runtime smoke、DB/vector verification。
- `OPEN_QUESTIONS.md` 记录文档冲突，不靠猜测填补。
- 当前回合没有业务代码、runtime、UI、DB schema、migration、dependency 或 lockfile 改动。

## 9. Implementation Readiness

v0.4 可以在这些 planning docs 被人工确认后进入 `/goal implementation`。首个 implementation goal 必须从 `IMPLEMENTATION_PLAN.md` 的第一个未完成 task 开始，且每次只执行一个 task。
