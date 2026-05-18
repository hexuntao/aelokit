# AI Chat v0.2 Scope Freeze

本文件冻结 AeloKit v0.2：AI chat path 的执行范围。v0.2 不是广义 AI
platform 全量实现；它只交付第一个可工作的 authenticated chat path、AI SDK
streaming、assistant-ui app-local UI、minimal persistence 和 usage audit。

## 1. 目标

v0.2 的目标是实现第一个可工作的 AI chat path：

- 登录用户可以发起 chat。
- 系统通过 `/api/ai/chat` 返回 streamed response。
- UI 使用 assistant-ui。
- streaming/message protocol 使用 Vercel AI SDK。
- app runtime 使用 `packages/ai` contracts。
- minimal persistence 能保存 thread/message/message part/tool call/usage audit。
- usage audit 只记录，不扣 credits。

## 2. 本期必须做

v0.2 必做范围：

- app-local AI UI under `apps/web/src/components/ai`。
- app-local AI runtime wiring under `apps/web/src/ai`。
- first route under `apps/web/src/app/api/ai/chat/route.ts`。
- assistant-ui integration。
- Vercel AI SDK streaming integration。
- provider/model selection。
- system default model fallback。
- user default model reference。
- per-chat/per-thread model selection。
- minimal AI schema after confirmation。
- minimal migration after confirmation。
- seed provider/model/system agent。
- chat persistence service。
- usage audit service。
- auth boundary。
- basic error/loading/empty states。

## 3. 本期明确不做

v0.2 明确不做：

- 不做 credits charging。
- 不做 credits reservation。
- 不做 credits settlement。
- 不做 refund handling。
- 不做 plan quota enforcement。
- 不做 full memory/RAG。
- 不做 full MCP。
- 不做 BYOK。
- 不做 team-level model policy。
- 不做 user-defined agent studio。
- 不做 admin provider/model UI。
- 不做 worker/gateway/studio split。
- 不做 design-system extraction。
- 不做 CopilotKit / AG-UI。
- 不创建 `/api/chat`。
- 不让 provider secret 进入 client。
- 不绕过 auth。
- 不把 DB query 放进 `packages/ai`。

## 4. 允许创建/修改的路径

本文件不一次性授权所有路径。每个阶段必须按阶段边界执行。

### 4.1 Dependency Research 阶段

允许：

- `docs/product/AI_CHAT_V0_2_DEPENDENCY_RESEARCH.md`
- `docs/product/AI_CHAT_V0_2_OPEN_QUESTIONS.md`
- `docs/product/AI_CHAT_V0_2_IMPLEMENTATION_PLAN.md`

禁止：

- 安装依赖。
- 修改 `package.json`。
- 修改 `pnpm-lock.yaml`。
- 创建 runtime、route、UI、schema、migration。

### 4.2 Dependency Install Plan 阶段

允许：

- 文档文件。
- 输出 exact package list、版本范围、安装命令和影响范围。

禁止：

- 未经用户确认直接安装。
- 未经用户确认修改 `apps/web/package.json`、root `package.json` 或
  `pnpm-lock.yaml`。

### 4.3 Schema Design 阶段

允许：

- 文档文件。
- 输出 schema design，包括表结构、字段、索引、外键、迁移影响。

禁止：

- 创建 `packages/db/src/ai.schema.ts`。
- 修改 `packages/db/src/schema.ts`。
- 生成 migration。
- 运行 `db:generate`、`db:migrate`、`db:push`。

### 4.4 Schema Implementation 阶段

仅在用户确认 schema design 和 migration 策略后允许：

- `packages/db/src/ai.schema.ts`
- `packages/db/src/schema.ts`
- `packages/db/src/migrations/**`
- 必要的 DB package exports 或 type files，前提是 TASK 明确授权。

禁止：

- `apps/web/src/db/**` 写真实 schema。
- 未确认运行 db generate / migrate / push。
- 添加 v0.3 memory/knowledge/RAG tables。
- 添加 v0.4 MCP credential tables。
- 添加 v0.5 credits settlement tables。

### 4.5 Runtime 阶段

仅在依赖清单和版本经用户确认后允许：

- `apps/web/src/ai/**`
- `apps/web/src/app/api/ai/chat/route.ts`
- `apps/web/package.json`，仅用于已确认 dependency plan。
- `pnpm-lock.yaml`，仅由已确认安装产生。

禁止：

- 创建 `/api/chat`。
- provider secret 进入 client。
- runtime 逻辑进入 `packages/ai`。
- usage audit 调用 `@repo/credits` 或修改 credits ledger。

### 4.6 UI 阶段

仅在依赖清单和版本经用户确认后允许：

- `apps/web/src/components/ai/**`
- 对应 AI workspace 页面入口。
- 必要的 app-local route/page wiring，前提是 TASK 明确授权。

禁止：

- 抽到 `packages/design-system`。
- 创建 `packages/design-system/src/ai`。
- 创建 admin/studio UI。
- provider SDK 初始化放入 UI component。

### 4.7 Final Integration 阶段

允许：

- 修复 v0.2 范围内的 route/runtime/UI/persistence/usage audit 问题。
- 更新本组 v0.2 文档中的验收记录。

禁止：

- 借 final validation 扩展到 v0.3+。
- 新增未确认依赖、schema、migration、CI/CD。

## 5. 禁止路径

v0.2 禁止：

- `packages/ai` import `apps/web`。
- `packages/ai` 引入 route/UI/session/cookies/headers/DB query。
- 创建 `apps/worker`。
- 创建 `apps/gateway`。
- 创建 `apps/studio`。
- 创建 `apps/admin`。
- 创建 `packages/design-system/src/ai`。
- 创建 `/api/chat`。
- 创建 memory/knowledge/RAG tables。
- 创建 MCP credential tables。
- 创建 credits settlement tables。

## 6. 依赖安装规则

- 必须先做 dependency research。
- 必须输出 exact package list。
- 必须输出版本范围。
- 必须输出兼容关系。
- 必须等待用户确认后才能安装。
- 不允许私自安装 `assistant-ui`、`ai`、`@ai-sdk/openai`、`@mastra/core`
  或其他 provider SDK。
- assistant-ui 与 AI SDK 必须确认兼容版本后再安装。
- 如果官方文档存在 v4/v5/v6 差异，必须明确选择版本并说明原因。
- 如果 npm registry 最新版本与官方文档建议冲突，必须暂停说明冲突点。

## 7. Schema / Migration 规则

- 必须先做 schema design 文档。
- schema design 必须列出表结构、字段、索引、外键、默认值、迁移影响。
- 必须等待用户确认后才能创建 schema。
- 必须等待用户确认后才能生成 migration。
- 不允许直接运行 db generate / migrate / push。
- 如果需要运行 DB 命令，必须先输出命令和影响，等待确认。
- 所有真实 AI schema 所有权在 `packages/db/src/ai.schema.ts`。
- 所有 schema 聚合必须经过 `packages/db/src/schema.ts`。
- 不允许让任何 schema generate 写入 `apps/web/src/db/**`。

## 8. Usage / Credits 边界

- v0.2 usage 只做 audit。
- 不调用 `@repo/credits`。
- 不做 ledger mutation。
- 不做 quota enforcement。
- 不做 billing settlement。
- 只记录 provider/model/tokens/cost estimate/status/failure reason。
- `ai_usage` 在 v0.2 不能成为扣费事实来源；它只是后续 v0.5 billing
  设计的审计输入。

## 9. Mastra 边界

- Mastra 只在 agent orchestration 真实需要时使用。
- simple chat 不强制经过 Mastra。
- 如果 v0.2 第一版只用 Vercel AI SDK direct provider path，也必须保留
  Mastra integration plan。
- 不创建 long-running workflow。
- 不创建 worker。
- 不创建 Studio。
- 不把 Mastra 作为所有 chat 的强制路径，除非某个 TASK 明确要求且官方文档已确认。

## 10. External Docs Gate

凡是 TASK 涉及以下内容，必须先查阅官方最新文档：

- 安装依赖和版本选择。
- assistant-ui runtime / components / provider 接入。
- Vercel AI SDK `useChat` / `streamText` / transport / stream protocol。
- `/api/ai/chat` route 返回格式。
- Mastra agent / workflow / tool / runtime 接入。
- provider SDK 初始化方式。
- streaming response 格式。
- tool call / message part / usage metadata 映射。
- persistence 与 assistant-ui / AI SDK message shape 的兼容。

每个涉及外部依赖的 TASK 完成报告必须包含：

- 阅读了哪些官方文档。
- 采用的 API / 版本。
- 为什么这样接入。
- 与 AeloKit 当前边界如何对齐。
- 是否存在未确认风险。

