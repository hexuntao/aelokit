# Claude Code 规则摘要

本文件是 Claude Code 的短摘要入口，不是 AeloKit 的最高规则源。

最后更新：2026-05-20

## 1. 读取顺序

Claude Code 执行任务前必须读取：

1. 当前用户 prompt。
2. root `AGENTS.md`。
3. 目标路径上的 nearest `AGENTS.md`。
4. `docs/INDEX.md`。
5. 当前版本 `DOCUMENT_INPUTS.md`，如果任务属于某个版本规划或实现。
6. 当前版本 Scope Freeze / Acceptance Criteria / Implementation Plan，如果已经存在。

Claude Code 专属细则见 `docs/agents/CLAUDE_RULES.md`。

## 2. 冲突规则

- 当前用户 prompt 优先于仓库历史 Prompt。
- 当前版本 Scope Freeze 优先于历史版本文档。
- `AGENTS.md` 和 nearest `AGENTS.md` 优先于本文件。
- `docs/INDEX.md` 优先于本文件。
- 本文件不能覆盖当前版本 `DOCUMENT_INPUTS.md`。
- 如果文档冲突，写入或报告当前版本 `OPEN_QUESTIONS.md`，不要猜。

## 3. Scope 边界

- 本文件不定义 v0.4 或任何未来版本 scope。
- 当前版本 scope 只能由 `docs/product/v0.x/SCOPE_FREEZE.md` 定义。
- 旧 Prompt、旧 Implementation Plan、旧 Scope Freeze、旧 task list 和旧 Validation Report 不能作为当前需求。
- 历史版本 gate 只能作为 regression guardrail，不能定义当前 scope。

## 4. 永久工程边界摘要

- `apps/web` 是当前完整 SaaS 单体应用。
- `packages/*` 是跨 app 共享领域包；package 不允许 import app。
- `packages/db/src` 拥有真实 Drizzle schema 和 migration。
- `apps/web/src/db/*` 只是兼容 shim。
- `packages/ai` 只放 AI contracts/types/adapters/runtime-types，不放 runtime、route、UI、DB query、schema、migration 或 provider SDK initialization。
- `apps/web/src/ai` 负责 web app AI runtime wiring。
- 当前 AI chat route 是 `POST /api/ai/chat`；不要创建 `/api/chat`。
- `@repo/env` 管理 env schema；provider secret 和 embedding secret 必须 server-only。
- Usage audit 不等于 credits charging；AI usage 不得直接调用 credits ledger。
- 不要提前创建 future apps/packages，例如 worker、gateway、studio、design-system。

## 5. 常用轻量验证

```bash
pnpm check:env
pnpm check:package-exports
pnpm check:db-shims
```

根据改动范围，再运行目标 workspace 的 typecheck、lint、content 或 build。
