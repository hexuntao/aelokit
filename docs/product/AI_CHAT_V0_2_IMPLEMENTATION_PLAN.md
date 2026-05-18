# AI Chat v0.2 Implementation Plan

本计划只覆盖 AeloKit v0.2：第一个可工作的 AI chat path。每次后续执行只能选择
一个 TASK，不允许一次性执行全部任务。

执行规则：

- 每个 TASK 独立执行、独立验证、独立提交。
- 每个 TASK 开始前必须重新读取本 TASK 指定文档。
- 涉及外部依赖/API 的 TASK 必须先执行 External Docs Gate。
- 涉及安装依赖、schema、migration、DB 命令、CI/CD 的 TASK 必须先等待用户确认。
- 只有 TASK-003B 允许实际安装 v0.2 AI dependencies；其他 TASK 不允许顺手安装依赖。
- 本文档不授权越过 `AI_CHAT_V0_2_SCOPE_FREEZE.md`。

默认必须读取：

- `AGENTS.md`
- `docs/product/AI_CHAT_V0_2_SCOPE_FREEZE.md`
- `docs/product/AI_CHAT_V0_2_ACCEPTANCE.md`
- `docs/product/AI_CHAT_V0_2_IMPLEMENTATION_PLAN.md`
- `docs/product/AI_CHAT_V0_2_OPEN_QUESTIONS.md`

## TASK-001：生成 v0.2 planning docs

### 目标

创建本次要求的 v0.2 文档包。

### 范围

- 只修改 `docs/product/AI_CHAT_V0_2_*.md`。

### 非目标

- 不写代码。
- 不安装依赖。
- 不创建 schema/migration/route/UI。

### 前置条件

- 用户已明确要求生成 v0.2 文档规划。
- 当前分支为 `dev`。

### 必须读取的文档

- 默认必须读取清单。
- `packages/AGENTS.md`
- `apps/AGENTS.md`
- `apps/web/AGENTS.md`
- `packages/ai/AGENTS.md`
- `packages/db/AGENTS.md`
- `docs/product/AI_AGENT_INFRASTRUCTURE_ROADMAP.md`
- `docs/product/AI_CONTRACTS_FOUNDATION_SCOPE_FREEZE.md`
- `docs/product/AI_CONTRACTS_FOUNDATION_ACCEPTANCE.md`
- `docs/product/AI_CONTRACTS_FOUNDATION_OPEN_QUESTIONS.md`
- `docs/architecture/AI_AGENT_INFRASTRUCTURE_BOUNDARIES.md`
- `docs/architecture/AI_RUNTIME_LAYERING.md`
- `docs/architecture/AELOKIT_PACKAGE_BOUNDARIES.md`

### External Docs Gate

Required because planning includes assistant-ui, Vercel AI SDK, Mastra, and
provider SDK dependency decisions. Must read official docs and record URLs in
`AI_CHAT_V0_2_DEPENDENCY_RESEARCH.md`.

### 允许修改文件

- `docs/product/AI_CHAT_V0_2_SCOPE_FREEZE.md`
- `docs/product/AI_CHAT_V0_2_ACCEPTANCE.md`
- `docs/product/AI_CHAT_V0_2_IMPLEMENTATION_PLAN.md`
- `docs/product/AI_CHAT_V0_2_DEPENDENCY_RESEARCH.md`
- `docs/product/AI_CHAT_V0_2_SCHEMA_DESIGN.md`
- `docs/product/AI_CHAT_V0_2_OPEN_QUESTIONS.md`
- `docs/product/AI_CHAT_V0_2_CODEX_PROMPT.md`

### 禁止修改文件

- `apps/web/**`
- `packages/db/**`
- `packages/ai/**`
- `package.json`
- `pnpm-lock.yaml`
- `pnpm-workspace.yaml`
- `.env*`
- migration files
- route files
- UI files
- runtime files

### 实现要求

- 文档必须可作为后续 TASK 的执行入口。
- 文档必须把依赖、schema、migration、runtime、UI 阶段拆开授权。
- 文档必须明确 External Docs Gate。
- 文档必须列出 open questions 和默认建议。

### 验收标准

- 7 个目标文档存在。
- 只修改目标文档。
- 没有代码、依赖、schema、migration、route、UI 改动。

### 验证命令

```bash
git diff --name-only
git diff --check -- docs/product/AI_CHAT_V0_2_*.md
```


### Git 提交要求

建议提交：

```txt
docs(ai): add v0.2 chat implementation task plan
```

### blocker handling

如果必读文件不存在，记录为 blocker，不伪造内容。若官方文档不可访问，记录 URL、
失败原因和受影响 TASK。

## TASK-002：External Docs & Dependency Compatibility Research

### 目标

查阅 assistant-ui、Vercel AI SDK、Mastra、provider SDK 最新官方文档，输出依赖清单和兼容方案，不安装依赖。

### 范围

- 更新 dependency research。
- 更新 open questions 中和依赖有关的状态。

### 非目标

- 不安装依赖。
- 不修改 package files。
- 不写 runtime/UI/route。

### 前置条件

- TASK-001 已完成。
- 用户指定执行 TASK-002。

### 必须读取的文档

- 默认必须读取清单。
- `docs/product/AI_CHAT_V0_2_DEPENDENCY_RESEARCH.md`
- `apps/web/package.json`
- `packages/ai/package.json`

### External Docs Gate

Required. Must read official latest docs for assistant-ui, AI SDK v6, Mastra,
and provider SDK. Must record URLs, version choice, API choice, and risks.

### 允许修改文件

- `docs/product/AI_CHAT_V0_2_DEPENDENCY_RESEARCH.md`
- `docs/product/AI_CHAT_V0_2_OPEN_QUESTIONS.md`

### 禁止修改文件

- `package.json`
- `apps/web/package.json`
- `pnpm-lock.yaml`
- `apps/web/**`
- `packages/db/**`
- `packages/ai/**`
- `.env*`

### 实现要求

- 明确推荐安装哪些包。
- 明确 assistant-ui 与 AI SDK 的兼容版本。
- 明确 `/api/ai/chat` 如何覆盖默认 `/api/chat`。
- 明确 simple chat 是否必须经过 Mastra。
- 明确 provider SDK 初始化应留在 app runtime layer。
- 明确不确定项。

### 验收标准

- dependency research 包含官方 URL、版本范围、API 选择和风险。
- 没有安装依赖。
- 没有 package lock 改动。

### 验证命令

```bash
git diff --name-only
git diff --check -- docs/product/AI_CHAT_V0_2_DEPENDENCY_RESEARCH.md docs/product/AI_CHAT_V0_2_OPEN_QUESTIONS.md
```


### Git 提交要求

建议提交：

```txt
docs(ai): research v0.2 chat dependencies
```

### blocker handling

如果官方文档和 registry 元数据冲突，暂停并列出冲突。不要猜版本，不要安装。

## TASK-003：Dependency Install Plan

### 目标

基于 TASK-002 输出 exact install plan。

### 范围

- 文档化 exact package list。
- 文档化 package manager command。
- 文档化影响哪些 package.json。

### 非目标

- 不安装依赖。
- 不修改 package files。
- 不修改 lockfile。

### 前置条件

- TASK-002 已完成。
- 用户指定执行 TASK-003。

### 必须读取的文档

- 默认必须读取清单。
- `docs/product/AI_CHAT_V0_2_DEPENDENCY_RESEARCH.md`
- `apps/web/package.json`
- root `package.json`

### External Docs Gate

Required. Re-check official docs and package registry before finalizing exact
install command.

### 允许修改文件

- `docs/product/AI_CHAT_V0_2_DEPENDENCY_RESEARCH.md`
- `docs/product/AI_CHAT_V0_2_OPEN_QUESTIONS.md`

### 禁止修改文件

- `apps/web/package.json`
- root `package.json`
- `pnpm-lock.yaml`
- `pnpm-workspace.yaml`
- `apps/web/**`
- `packages/**`
- `.env*`

### 实现要求

- 输出 exact package list。
- 输出 package manager command。
- 输出影响哪些 package.json。
- 标注 whether `zod` is already satisfied。
- 等待用户确认后才能执行安装。

### 验收标准

- install plan 可复制执行。
- 标清 first thin chat path 和 optional Mastra path。
- 标清是否需要 root package 改动。

### 验证命令

```bash
git diff --check -- docs/product/AI_CHAT_V0_2_DEPENDENCY_RESEARCH.md docs/product/AI_CHAT_V0_2_OPEN_QUESTIONS.md
```


### Git 提交要求

建议提交：

```txt
docs(ai): add v0.2 dependency install plan
```

### blocker handling

如果 exact versions 无法确认，记录 registry/doc 查询失败，并停止在文档里伪造版本。

## TASK-003B：Install Confirmed Dependencies

### 目标

执行用户已确认的 v0.2 AI dependency install plan。

### 范围

- 运行 TASK-003 中用户已确认的 install command。
- 只让 package manager 更新 `apps/web/package.json` 和 `pnpm-lock.yaml`。
- 执行安装后的最小验证。

### 非目标

- 不写 runtime。
- 不创建 route。
- 不创建 UI。
- 不创建 schema。
- 不生成 migration。
- 不修改 `.env*`。
- 不顺手新增 TASK-003 未确认的依赖。

### 前置条件

- TASK-002 已完成。
- TASK-003 已输出 exact dependency install plan。
- 用户已明确确认 TASK-003 dependency install plan 和 install command。
- 用户指定执行 TASK-003B。

### 必须读取的文档

- 默认必须读取清单。
- `docs/product/AI_CHAT_V0_2_DEPENDENCY_RESEARCH.md`
- `apps/web/package.json`
- root `package.json`
- `pnpm-lock.yaml`

### External Docs Gate

Required. Before installing, re-check the exact versions and compatibility notes
from TASK-003 if any external dependency changed since the plan was written.
If docs or registry metadata conflicts with TASK-003, pause and update the plan
instead of installing.

### 允许修改文件

- `apps/web/package.json`
- `pnpm-lock.yaml`

### 禁止修改文件

- runtime。
- route。
- UI。
- schema。
- migration。
- `.env*`。
- root `package.json`。
- `apps/web/src/**`
- `packages/db/**`
- `packages/ai/**`

### 实现要求

- 执行用户确认的 install command。
- 安装后检查 diff，确认只出现允许的 package/lockfile 变更。
- 不安装 TASK-003 未确认的 package。
- 不创建任何 source file。
- 不修改 env/schema/migration/route/UI/runtime。

### 验收标准

- `apps/web/package.json` 包含用户确认的 direct dependencies。
- `pnpm-lock.yaml` 只反映这些确认依赖的安装结果。
- 没有 source/runtime/route/UI/schema/migration/env 改动。
- required validation commands pass or blockers are recorded.

### 验证命令

```bash
pnpm --filter @repo/web typecheck
pnpm check:package-exports
git diff --name-only
git diff --check -- apps/web/package.json pnpm-lock.yaml
```

### Git 提交要求

建议提交：

```txt
build(web): install ai chat dependencies
```

### blocker handling

如果 install command 会修改未授权文件，暂停并报告 diff，不继续实现代码。如果
typecheck 或 package exports 失败，只修复 dependency-install 范围内的问题；需要代码
改动时停止并请求新的 TASK。

## TASK-004：Minimal AI Schema Design

### 目标

基于 v0.1 minimal AI data model freeze，设计 v0.2 schema。

### 范围

- 文档化 9 张表的 schema design。
- 文档化字段、类型、索引、外键、默认值、migration impact。
- 固定输出到 `docs/product/AI_CHAT_V0_2_SCHEMA_DESIGN.md`。

### 非目标

- 不创建 schema。
- 不生成 migration。
- 不运行 DB 命令。

### 前置条件

- TASK-001 已完成。
- 用户指定执行 TASK-004。
- v0.1 minimal data model freeze 已被接受。

### 必须读取的文档

- 默认必须读取清单。
- `packages/AGENTS.md`
- `packages/db/AGENTS.md`
- `docs/product/AI_CONTRACTS_FOUNDATION_SCOPE_FREEZE.md`
- `docs/product/AI_CONTRACTS_FOUNDATION_ACCEPTANCE.md`
- `docs/architecture/AI_AGENT_INFRASTRUCTURE_BOUNDARIES.md`
- `docs/product/AI_CHAT_V0_2_SCHEMA_DESIGN.md`

### External Docs Gate

Required only for message shape / persistence compatibility with assistant-ui and
AI SDK. Schema field names must also align with v0.1 contracts.

### 允许修改文件

- `docs/product/AI_CHAT_V0_2_SCHEMA_DESIGN.md`
- `docs/product/AI_CHAT_V0_2_OPEN_QUESTIONS.md`

### 禁止修改文件

- `docs/product/AI_CHAT_V0_2_DEPENDENCY_RESEARCH.md`
- `packages/db/src/ai.schema.ts`
- `packages/db/src/schema.ts`
- `packages/db/src/migrations/**`
- `apps/web/src/db/**`
- `apps/web/**`
- `packages/ai/**`

### 实现要求

- 列出所有表、字段、类型、索引、外键、默认值。
- 说明和 v0.1 contracts 的映射。
- 说明 migration 影响。
- 明确 thread/message/message part/tool call/usage audit persistence path。
- 不允许把 schema design 写到 dependency research 里。
- 等待用户确认。

### 验收标准

- `docs/product/AI_CHAT_V0_2_SCHEMA_DESIGN.md` 足以让 TASK-005 创建 Drizzle schema。
- 未确认项进入 open questions。
- 没有 schema/migration 文件变更。

### 验证命令

```bash
git diff --name-only
git diff --check -- docs/product/AI_CHAT_V0_2_SCHEMA_DESIGN.md docs/product/AI_CHAT_V0_2_OPEN_QUESTIONS.md
```


### Git 提交要求

建议提交：

```txt
docs(ai): design minimal chat persistence schema
```

### blocker handling

如果 v0.1 frozen model 与 AI SDK/assistant-ui message shape 冲突，暂停并列出
冲突，不创建 schema。

## TASK-005：Create Minimal AI Schema + Migration

### 目标

创建 `packages/db/src/ai.schema.ts`，更新 schema export，并生成 migration。

### 范围

- 9 张 v0.2 minimal AI tables。
- DB package schema aggregation。
- Migration file after confirmation。

### 非目标

- 不运行 db push。
- 不修改 credits/payment。
- 不加入 v0.3 memory/knowledge/RAG tables。

### 前置条件

- 用户已确认 TASK-004 schema design。
- 用户已确认 migration 策略。
- 用户已确认允许创建 schema/migration。

### 必须读取的文档

- 默认必须读取清单。
- `packages/AGENTS.md`
- `packages/db/AGENTS.md`
- `docs/product/AI_CONTRACTS_FOUNDATION_SCOPE_FREEZE.md`
- `docs/product/AI_CHAT_V0_2_SCHEMA_DESIGN.md`

### External Docs Gate

Not required for Drizzle syntax unless Drizzle API uncertainty appears. If
uncertain, check official Drizzle docs before editing.

### 允许修改文件

- `packages/db/src/ai.schema.ts`
- `packages/db/src/schema.ts`
- `packages/db/src/migrations/**`
- `packages/db/package.json` only if a confirmed direct dependency is required.

### 禁止修改文件

- `apps/web/src/db/**`
- `apps/web/**`
- `packages/ai/**`
- `packages/credits/**`
- `packages/payment/**`
- `.env*`

### 实现要求

- Implement frozen 9-table schema only.
- Add indexes and FKs approved in TASK-004.
- Add schema export so drizzle-kit can discover tables.
- Do not add memory/RAG/MCP/credits settlement tables.

### 验收标准

- `packages/db` typecheck passes.
- DB shim boundary remains valid.
- Migration reflects only approved AI schema.

### 验证命令

```bash
pnpm --filter @repo/db format
pnpm --filter @repo/db lint
pnpm --filter @repo/db typecheck
pnpm check:db-shims
pnpm check:package-exports
```

DB generation command requires prior confirmation:

```bash
pnpm --filter @repo/db db:generate
```


### Git 提交要求

建议提交：

```txt
feat(db): add minimal ai chat schema
```

### blocker handling

如果 migration generator 输出超出批准范围，暂停并报告 diff；不要手动推送 DB。

## TASK-006：Seed Provider / Model / System Agent

### 目标

添加最小 seed，支持 OpenAI provider、默认 model、system agent。

### 范围

- seed provider/model/system agent。
- 可重复执行或去重策略。

### 非目标

- 不保存 provider secret。
- 不做 admin provider/model UI。
- 不做 BYOK。

### 前置条件

- TASK-005 schema/migration 已确认并完成。
- 用户确认 seed 位置和执行方式。

### 必须读取的文档

- 默认必须读取清单。
- `packages/db/AGENTS.md`
- Existing seed scripts or DB scripts in repo。

### External Docs Gate

Required for provider/model ID recommendations if seed uses external model IDs.
Must check provider docs or AI SDK provider docs before freezing default model.

### 允许修改文件

- Confirmed seed file path only.
- Related package script only if user confirms.

### 禁止修改文件

- `.env*`
- provider secret storage。
- `packages/ai/**`
- credits/payment files。

### 实现要求

- 不暴露 secret。
- provider key 从 server env 读取，但不进入 DB seed。
- seed 数据可重复执行或有去重策略。
- Default model must match confirmed provider package capability.

### 验收标准

- Seed can create baseline provider/model/system agent.
- Re-running seed does not duplicate rows.
- No secret is persisted.

### 验证命令

```bash
pnpm --filter @repo/db format
pnpm --filter @repo/db lint
pnpm --filter @repo/db typecheck
```

Any seed execution command must be confirmed before running.


### Git 提交要求

建议提交：

```txt
feat(db): seed ai provider model and system agent
```

### blocker handling

如果 default model ID 未确认，暂停并要求确认，不用猜测。

## TASK-007：App-local AI Runtime Wiring Skeleton

### 目标

创建 `apps/web/src/ai/**` runtime wiring skeleton。

### 范围

- Provider/model resolver skeleton。
- Server-only provider registry skeleton。
- Request context and auth-aware runtime boundary skeleton。
- Optional Mastra integration plan files only if confirmed.

### 非目标

- 不创建 UI。
- 不创建 route。
- 不执行 live provider call unless task explicitly includes a verified path。

### 前置条件

- Dependency install has been confirmed and executed via TASK-003B if runtime imports external packages.
- `@repo/web` can import `@repo/ai` via declared direct dependency.

### 必须读取的文档

- 默认必须读取清单。
- `apps/AGENTS.md`
- `apps/web/AGENTS.md`
- `packages/ai/AGENTS.md`
- `docs/architecture/AI_RUNTIME_LAYERING.md`
- `docs/architecture/AI_AGENT_INFRASTRUCTURE_BOUNDARIES.md`

### External Docs Gate

Required for provider SDK initialization and Mastra runtime if used.

### 允许修改文件

- `apps/web/src/ai/**`

### 禁止修改文件

- `apps/web/package.json`
- `pnpm-lock.yaml`
- `packages/ai/**`
- `packages/db/**`
- `apps/web/src/components/ai/**`
- `apps/web/src/app/api/ai/chat/route.ts`
- `.env*`

### 实现要求

- 使用 `packages/ai` contracts。
- provider SDK 初始化只在 server/app runtime layer。
- 不把 runtime 逻辑放进 `packages/ai`。
- 不创建 UI。
- Use server-only boundaries for provider secret access.

### 验收标准

- Runtime skeleton typechecks.
- `packages/ai` remains contract-only.
- No provider secret is client-reachable.

### 验证命令

```bash
pnpm --filter @repo/web format
pnpm --filter @repo/web lint
pnpm --filter @repo/web typecheck
pnpm --filter @repo/ai format
pnpm --filter @repo/ai lint
pnpm --filter @repo/ai typecheck
pnpm check:package-exports
```


### Git 提交要求

建议提交：

```txt
feat(web): add ai runtime wiring skeleton
```

### blocker handling

如果 env schema lacks required provider key, pause and request confirmation for
schema + `env.example` update.

## TASK-008：Implement `/api/ai/chat` Streaming Route

### 目标

创建 `apps/web/src/app/api/ai/chat/route.ts`。

### 范围

- Authenticated POST route。
- AI SDK v6 streaming response。
- Provider/model resolution。
- Structured error boundary。
- Usage audit hook skeleton。

### 非目标

- 不创建 `/api/chat`。
- 不扣 credits。
- 不做 full persistence beyond route handoff unless TASK-009 is already complete.

### 前置条件

- TASK-007 runtime skeleton complete.
- Dependencies installed and confirmed via TASK-003B.
- Auth access pattern confirmed from existing app.

### 必须读取的文档

- 默认必须读取清单。
- `apps/AGENTS.md`
- `apps/web/AGENTS.md`
- `packages/ai/AGENTS.md`
- `docs/product/AI_CHAT_V0_2_DEPENDENCY_RESEARCH.md`
- Existing auth/API route patterns in `apps/web/src/app/api/**`。

### External Docs Gate

Required. Must verify AI SDK v6 `streamText`, `UIMessage`,
`convertToModelMessages`, transport compatibility, and
`toUIMessageStreamResponse()` before implementing.

### 允许修改文件

- `apps/web/src/app/api/ai/chat/route.ts`
- Supporting files under `apps/web/src/ai/**`
- Tests if existing pattern supports them and TASK scope confirms.

### 禁止修改文件

- `apps/web/src/app/api/chat/**`
- `packages/ai/**`
- `packages/db/**` unless a prior persistence TASK explicitly authorized service changes.
- `@repo/credits` ledger/service files。
- `.env*`

### 实现要求

- 使用 Vercel AI SDK 当前官方推荐写法。
- endpoint 是 `/api/ai/chat`。
- 不创建 `/api/chat`。
- 必须有 auth check。
- provider secret server-only。
- 错误有结构化返回。
- usage audit hook 可以先接 skeleton，但不能扣 credits。
- request body validation must not trust client-provided user/provider secrets.

### 验收标准

- 未登录请求被拒绝。
- 登录请求 can stream a response in the configured environment.
- route returns current AI SDK UI stream response format.
- No provider secret exposed to client bundle.

### 验证命令

```bash
pnpm --filter @repo/web format
pnpm --filter @repo/web lint
pnpm --filter @repo/web typecheck
```


### Git 提交要求

建议提交：

```txt
feat(web): add ai chat streaming route
```

### blocker handling

如果 AI SDK route response API 与 dependency research 不一致，暂停并更新
research，不硬写旧示例。

## TASK-009：Chat Persistence Service

### 目标

实现 thread/message/message part/tool call persistence。

### 范围

- Save user input message。
- Save assistant message。
- Save message parts。
- Reserve tool call lifecycle persistence。
- Track failure state。

### 非目标

- 不实现 memory/RAG。
- 不实现 MCP credential persistence。
- 不做 credits。

### 前置条件

- TASK-005 schema complete.
- TASK-008 route exists or route integration plan confirmed.
- AI SDK message shape mapping confirmed.

### 必须读取的文档

- 默认必须读取清单。
- `apps/web/AGENTS.md`
- `packages/db/AGENTS.md`
- `docs/product/AI_CONTRACTS_FOUNDATION_SCOPE_FREEZE.md`
- `docs/product/AI_CHAT_V0_2_DEPENDENCY_RESEARCH.md`

### External Docs Gate

Required for AI SDK `UIMessage`, message parts, persistence hooks, and
assistant-ui history adapter compatibility.

### 允许修改文件

- `apps/web/src/ai/**`
- Existing app-local repository/service files if TASK explicitly names them.
- Tests near changed services if existing test runner supports them.

### 禁止修改文件

- `packages/ai/**`
- `packages/db/src/ai.schema.ts` unless schema fix is separately confirmed.
- Memory/RAG/MCP/credits tables。
- `.env*`

### 实现要求

- 保存用户输入消息。
- 保存 assistant message。
- 保存 message parts。
- 保存 tool call lifecycle reserve。
- 失败时状态可追踪。
- 不实现 memory/RAG。
- Persist server-generated IDs consistently where AI SDK recommends it.

### 验收标准

- A chat can round-trip persisted thread/messages.
- Message parts preserve order.
- Failed stream can leave inspectable failure status.
- Tool call reserve does not execute unapproved tools.

### 验证命令

```bash
pnpm --filter @repo/web format
pnpm --filter @repo/web lint
pnpm --filter @repo/web typecheck
pnpm --filter @repo/db format
pnpm --filter @repo/db lint
pnpm --filter @repo/db typecheck
```


### Git 提交要求

建议提交：

```txt
feat(web): persist ai chat messages
```

### blocker handling

如果 AI SDK UIMessage cannot map cleanly to frozen schema, pause and propose the
minimal schema adjustment before editing DB files.

## TASK-010：Usage Audit Service

### 目标

保存 `ai_usage` audit record。

### 范围

- Usage audit service。
- Route/runtime integration。
- Failure reason mapping。

### 非目标

- 不调用 credits。
- 不扣费。
- 不做 quota enforcement。

### 前置条件

- TASK-005 schema complete.
- TASK-008 route available.
- TASK-009 message IDs available, or nullable message ID strategy confirmed.

### 必须读取的文档

- 默认必须读取清单。
- `packages/ai/AGENTS.md`
- `packages/db/AGENTS.md`
- `docs/product/AI_CONTRACTS_FOUNDATION_SCOPE_FREEZE.md`
- `docs/product/AI_CHAT_V0_2_DEPENDENCY_RESEARCH.md`

### External Docs Gate

Required for AI SDK usage metadata and provider metadata shape.

### 允许修改文件

- `apps/web/src/ai/**`
- `apps/web/src/app/api/ai/chat/route.ts` if route integration is needed.
- Tests near changed service if existing test runner supports them.

### 禁止修改文件

- `packages/credits/**`
- `packages/payment/**`
- credits ledger tables/services。
- `packages/ai/**`
- `.env*`

### 实现要求

- 记录 provider/model/tokens/estimated cost/status/failure reason。
- 不调用 credits。
- 不扣费。
- 不做 quota enforcement。
- Use nullable/unknown usage values when provider does not return a metric; do
  not fabricate token counts.

### 验收标准

- Successful request writes success audit when usage is available.
- Failed request writes failure audit when possible.
- No credits mutation occurs.

### 验证命令

```bash
pnpm --filter @repo/web format
pnpm --filter @repo/web lint
pnpm --filter @repo/web typecheck
pnpm --filter @repo/db format
pnpm --filter @repo/db lint
pnpm --filter @repo/db typecheck
```


### Git 提交要求

建议提交：

```txt
feat(web): add ai usage audit service
```

### blocker handling

If provider usage metadata is unavailable, store null fields with clear status
instead of defaulting to zero.

## TASK-011：assistant-ui App-local Components

### 目标

在 `apps/web/src/components/ai/**` 创建 app-local AI UI。

### 范围

- Assistant runtime provider wiring。
- Thread/composer/message components。
- Loading/error/empty states。
- Model selector integration point if TASK-013 is ready.

### 非目标

- 不抽到 design system。
- 不初始化 provider SDK。
- 不写 DB schema。

### 前置条件

- Dependencies installed and confirmed via TASK-003B.
- TASK-008 route available.
- Design guidance read.

### 必须读取的文档

- 默认必须读取清单。
- `apps/AGENTS.md`
- `apps/web/AGENTS.md`
- `apps/web/DESIGN.md`
- `docs/product/AI_CHAT_V0_2_DEPENDENCY_RESEARCH.md`

### External Docs Gate

Required. Must verify assistant-ui current components/runtime API and AI SDK
runtime integration before implementing.

### 允许修改文件

- `apps/web/src/components/ai/**`
- Supporting app-local AI UI hook files if TASK explicitly allows.

### 禁止修改文件

- `packages/design-system/**`
- `packages/ai/**`
- `packages/db/**`
- provider SDK/runtime files except approved imports from `apps/web/src/ai/**`
- `.env*`

### 实现要求

- 使用 assistant-ui 当前官方推荐接入方式。
- 与 `/api/ai/chat` 对接。
- 覆盖默认 `/api/chat` endpoint。
- 支持 thread/composer/message/loading/error/empty state。
- 不抽到 design system。
- Follow AeloKit calm developer workspace visual direction.

### 验收标准

- UI points at `/api/ai/chat` via custom transport.
- User can send message from UI when authenticated.
- Empty/loading/error states are visible.
- No provider secret or server env import in client components.

### 验证命令

```bash
pnpm --filter @repo/web format
pnpm --filter @repo/web lint
pnpm --filter @repo/web typecheck
```


### Git 提交要求

建议提交：

```txt
feat(web): add assistant ui chat components
```

### blocker handling

If assistant-ui API changed, update dependency research and pause before coding
around guessed component names.

## TASK-012：AI Workspace Page Entry

### 目标

添加可访问的 AI workspace 页面入口。

### 范围

- A single v0.2 chat page entry.
- Auth-aware access boundary.
- App-local layout composition.

### 非目标

- 不做 admin/studio。
- 不做 multi-agent workspace。
- 不做 app split。

### 前置条件

- TASK-011 components complete.
- Existing route/nav conventions inspected.

### 必须读取的文档

- 默认必须读取清单。
- `apps/AGENTS.md`
- `apps/web/AGENTS.md`
- `apps/web/DESIGN.md`
- Existing localized page and navigation patterns.

### External Docs Gate

Not required unless page wiring touches assistant-ui runtime not already covered
by TASK-011.

### 允许修改文件

- Corresponding AI workspace page entry under `apps/web/src/app/[locale]/**`.
- Existing navigation config only if TASK explicitly authorizes it.

### 禁止修改文件

- `apps/admin/**`
- `apps/studio/**`
- `packages/design-system/**`
- unrelated marketing/docs pages。
- `.env*`

### 实现要求

- 遵循 `apps/web/DESIGN.md`。
- 只做 v0.2 chat 页面。
- 不做 admin/studio。
- 未登录用户跳转或显示登录要求。

### 验收标准

- Authenticated user can reach AI chat page.
- Unauthenticated user cannot use chat.
- Page uses app-local AI components.

### 验证命令

```bash
pnpm --filter @repo/web format
pnpm --filter @repo/web lint
pnpm --filter @repo/web typecheck
```


### Git 提交要求

建议提交：

```txt
feat(web): add ai workspace chat page
```

### blocker handling

If auth redirect pattern is unclear, inspect existing protected routes before
editing; do not invent a parallel auth pattern.

## TASK-013：Model Selector + Fallback

### 目标

实现基础 model selection。

### 范围

- System default。
- User default reference。
- Per-chat/per-thread model id。
- Runtime fallback resolution。
- Minimal UI or route param support as confirmed.

### 非目标

- 不做完整 admin model management UI。
- 不做 BYOK。
- 不做 team policy。

### 前置条件

- Provider/model seed exists.
- Runtime wiring exists.
- User default storage strategy confirmed.

### 必须读取的文档

- 默认必须读取清单。
- `packages/ai/AGENTS.md`
- `packages/db/AGENTS.md`
- `docs/product/AI_CONTRACTS_FOUNDATION_SCOPE_FREEZE.md`

### External Docs Gate

Required only for provider/model ID and provider SDK model factory behavior.

### 允许修改文件

- `apps/web/src/ai/**`
- `apps/web/src/components/ai/**` only if selector UI is confirmed.
- `apps/web/src/app/api/ai/chat/route.ts` if route param/model selection is needed.

### 禁止修改文件

- Admin provider/model UI.
- `packages/ai/**`
- `packages/design-system/**`
- `packages/credits/**`

### 实现要求

- 支持 system default。
- 支持 user default reference。
- 支持 per-chat/per-thread model id。
- fallback 顺序符合文档。
- 不做完整 admin model management UI。
- Disabled provider/model must fail closed.

### 验收标准

- Fallback order is deterministic.
- Invalid model selection returns structured error.
- Usage audit records resolved provider/model.

### 验证命令

```bash
pnpm --filter @repo/web format
pnpm --filter @repo/web lint
pnpm --filter @repo/web typecheck
pnpm --filter @repo/db format
pnpm --filter @repo/db lint
pnpm --filter @repo/db typecheck
```


### Git 提交要求

建议提交：

```txt
feat(web): add ai model selection fallback
```

### blocker handling

If user default UI is not confirmed, implement route/runtime support only and
record UI as open question.

## TASK-014：Auth / Entitlement Boundary

### 目标

给 route/runtime 增加最小 auth/entitlement boundary。

### 范围

- Auth check.
- Minimal allow/deny entitlement skeleton.
- Structured auth/entitlement error.

### 非目标

- 不接 credits quota。
- 不扣 credits。
- 不做 billing settlement。

### 前置条件

- TASK-008 route exists.
- Existing auth/session pattern inspected.

### 必须读取的文档

- 默认必须读取清单。
- `apps/web/AGENTS.md`
- Existing auth package usage and protected routes.
- `docs/architecture/AI_AGENT_INFRASTRUCTURE_BOUNDARIES.md`

### External Docs Gate

Not required unless external rate-limit or entitlement library is introduced.

### 允许修改文件

- `apps/web/src/ai/**`
- `apps/web/src/app/api/ai/chat/route.ts`
- Existing tests near route/runtime if applicable.

### 禁止修改文件

- `packages/credits/**`
- `packages/payment/**`
- `.env*`
- auth schema/migration unless separate confirmation.

### 实现要求

- 未登录不可调用。
- entitlement 可以先是 allow/deny skeleton。
- 不接 credits quota。
- 不扣 credits。
- Deny by default when user/session is missing or malformed.

### 验收标准

- Unauthenticated route call fails.
- Authenticated allowed user can proceed.
- Entitlement denial returns structured error.
- No credits ledger mutation.

### 验证命令

```bash
pnpm --filter @repo/web format
pnpm --filter @repo/web lint
pnpm --filter @repo/web typecheck
```


### Git 提交要求

建议提交：

```txt
feat(web): guard ai chat route with auth
```

### blocker handling

If existing auth helper cannot be used in route handlers, pause and report the
actual auth boundary conflict.

## TASK-015：Error / Loading / Empty State Polish

### 目标

补齐用户可见状态和错误处理。

### 范围

- Empty state.
- Loading state.
- Stream error.
- Provider error.
- Auth error.
- Rate limit reserve.
- Retry guidance.

### 非目标

- 不做 broad UI redesign。
- 不做 design-system extraction。
- 不做 provider admin UI。

### 前置条件

- TASK-011 and TASK-012 complete.
- Route error shape is stable.

### 必须读取的文档

- 默认必须读取清单。
- `apps/web/DESIGN.md`
- `docs/product/AI_CHAT_V0_2_ACCEPTANCE.md`

### External Docs Gate

Required if assistant-ui exposes specific current error/loading APIs not already
confirmed in TASK-011.

### 允许修改文件

- `apps/web/src/components/ai/**`
- AI workspace page entry if needed.
- Route error mapping only if TASK explicitly includes it.

### 禁止修改文件

- `packages/design-system/**`
- unrelated page redesign.
- provider SDK setup files unless needed for error mapping.

### 实现要求

- 空状态。
- loading state。
- stream error。
- provider error。
- auth error。
- rate limit reserve。
- retry guidance。
- Keep copy concise and engineering-oriented.

### 验收标准

- User sees a stable empty state before first message.
- Streaming/pending state is visible.
- Common error classes have clear recovery guidance.
- Text does not overrun responsive containers.

### 验证命令

```bash
pnpm --filter @repo/web format
pnpm --filter @repo/web lint
pnpm --filter @repo/web typecheck
```


### Git 提交要求

建议提交：

```txt
feat(web): polish ai chat states
```

### blocker handling

If rendered UI cannot be verified because auth/dev server is unavailable, report
the blocker separately from typecheck/lint result.

## TASK-016：Final Integration Validation

### 目标

按 Acceptance 完成最终验收。

### 范围

- Run required validation commands.
- Produce acceptance table.
- Record remaining gaps.
- Decide merge recommendation.

### 非目标

- 不新增 feature。
- 不引入 dependency。
- 不生成 migration。

### 前置条件

- TASK-001 through TASK-015 complete or explicitly deferred, including TASK-003B
  when dependency installation is required.
- Working tree contains only intended v0.2 changes.

### 必须读取的文档

- 默认必须读取清单。
- `docs/product/AI_CHAT_V0_2_ACCEPTANCE.md`
- `docs/product/AI_CHAT_V0_2_OPEN_QUESTIONS.md`
- `docs/product/AI_CHAT_V0_2_DEPENDENCY_RESEARCH.md`

### External Docs Gate

Required only if validation discovers dependency/API mismatch.

### 允许修改文件

- v0.2 implementation files touched by previous TASKs, only for minimal fixes.
- v0.2 docs for final validation notes, if desired.

### 禁止修改文件

- New dependencies.
- New schema/migration.
- v0.3+ memory/RAG/MCP/credits settlement.
- CI/CD config unless separately confirmed.

### 实现要求

- 执行 lint/typecheck/build/package exports。
- 输出完整验收表。
- 明确未完成事项。
- 明确是否可以合并。

### 验收标准

- All required commands pass or have classified blockers.
- Acceptance table maps every criterion to pass/fail/blocker.
- Merge recommendation is explicit.

### 验证命令

```bash
pnpm --filter @repo/web format
pnpm --filter @repo/web lint
pnpm --filter @repo/web typecheck
pnpm --filter @repo/db format
pnpm --filter @repo/db lint
pnpm --filter @repo/db typecheck
pnpm --filter @repo/ai format
pnpm --filter @repo/ai lint
pnpm --filter @repo/ai typecheck
pnpm check:package-exports
pnpm typecheck
pnpm build
```


### Git 提交要求

建议提交：

```txt
chore(ai): validate v0.2 chat integration
```

### blocker handling

If a command cannot run, record command, reason, whether it blocks merge, and the
minimal next step. Do not label unrun checks as passed.
