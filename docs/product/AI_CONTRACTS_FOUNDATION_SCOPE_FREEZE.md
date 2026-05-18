# AI Contracts Foundation Scope Freeze

## 1. 目标

v0.1 的目标是冻结 AeloKit AI 基础设施第一阶段的合同边界：

- 允许后续在明确执行 v0.1 TASK 时创建 `packages/ai`。
- 让 `packages/ai` 只承担跨 app 可复用的 AI contracts、runtime type definitions、errors、permissions、usage/cost types，以及 lightweight adapter type surface。
- 冻结 v0.2 chat persistence 需要的 minimal AI data model 名称、关系和语义，但本期不创建 schema 文件、不生成 migration。
- 给后续 Codex 实现提供可以逐项执行、逐项提交、逐项验证的边界。

本文件不是 v0.2/v0.3 任务说明。v0.2 runtime、UI、route、DB schema、provider wiring、assistant-ui、Vercel AI SDK runtime、Mastra runtime 都不在本期实现范围内。

## 2. 本期必须做

后续进入 v0.1 编码实现时，必须完成：

- 创建 `@repo/ai` package skeleton，并保持 package 边界清晰。
- 定义 provider/model contracts。
- 定义 agent/tool/skill contracts。
- 定义 memory/knowledge/MCP contracts。
- 定义 usage/cost/permission/error contracts。
- 定义 lightweight Vercel AI SDK adapter-compatible types。
- 定义 lightweight Mastra adapter-compatible types。
- 定义 runtime type definitions。
- 定义明确的 package exports。
- 编写 `packages/ai/AGENTS.md`，把本 scope freeze 中的边界转成 package-local 规则。
- 在文档中冻结 minimal AI data model，支撑 v0.2 chat persistence 的 schema 设计。

## 3. 本期不做

v0.1 不允许实现以下内容：

- 真实 AI SDK runtime 调用。
- 真实 Mastra agent 实例。
- provider SDK 初始化。
- DB query。
- schema / migration。
- React UI。
- assistant-ui。
- Next.js route handler。
- app session / cookies / headers。
- credits ledger mutation。
- credits charging。
- worker/gateway/studio split。
- `apps/web` AI runtime wiring。
- `apps/web` AI UI components。
- `/api/chat` 或 `/api/ai/chat` route。
- memory/RAG runtime。
- MCP runtime execution。
- tool execution side effects。
- model pricing admin UI。
- design-system extraction。

## 4. 允许创建的目录 / 文件

后续 v0.1 编码任务允许创建：

```txt
packages/ai/package.json
packages/ai/tsconfig.json
packages/ai/src/index.ts
packages/ai/src/providers/**
packages/ai/src/models/**
packages/ai/src/agents/**
packages/ai/src/tools/**
packages/ai/src/skills/**
packages/ai/src/memory/**
packages/ai/src/knowledge/**
packages/ai/src/mcp/**
packages/ai/src/usage/**
packages/ai/src/permissions/**
packages/ai/src/errors/**
packages/ai/src/adapters/ai-sdk/**
packages/ai/src/adapters/mastra/**
packages/ai/src/runtime-types/**
packages/ai/AGENTS.md
```

允许为保证 package 可验证而创建必要的 package-local TypeScript entry 文件，例如：

```txt
packages/ai/src/providers/index.ts
packages/ai/src/models/index.ts
packages/ai/src/agents/index.ts
packages/ai/src/tools/index.ts
packages/ai/src/skills/index.ts
packages/ai/src/memory/index.ts
packages/ai/src/knowledge/index.ts
packages/ai/src/mcp/index.ts
packages/ai/src/usage/index.ts
packages/ai/src/permissions/index.ts
packages/ai/src/errors/index.ts
packages/ai/src/adapters/ai-sdk/index.ts
packages/ai/src/adapters/mastra/index.ts
packages/ai/src/runtime-types/index.ts
```

如需新增测试文件，必须先确认 `@repo/ai` 已有测试脚本或用户明确批准新增测试框架。默认 v0.1 只要求 format、lint、typecheck 和 package export 检查。

## 5. 禁止创建的目录 / 文件

v0.1 禁止创建：

```txt
apps/web/src/app/api/ai/**
apps/web/src/ai/**
apps/web/src/components/ai/**
packages/db/src/ai.schema.ts
packages/design-system/**
apps/worker/**
apps/gateway/**
apps/studio/**
apps/admin/**
apps/docs/**
apps/landing/**
```

v0.1 也禁止创建：

- `packages/db/src/migrations/**` 中的 AI migration。
- `apps/web/src/app/api/chat/**`。
- `contracts/**`。
- `orchestration/**`。
- `packages/api-client/**`。
- `packages/logger/**`。
- `packages/observability/**`。
- `packages/testing/**`。
- `.env.example`。
- 任何 `.env*` 文件。

## 6. packages/ai 边界

`packages/ai` 是 cross-app AI infrastructure core。

它负责：

- Provider abstraction。
- Model registry contracts。
- Agent contracts。
- Tool registry contracts。
- Skill registry contracts。
- Memory contracts。
- Knowledge contracts。
- MCP contracts。
- Usage and cost contracts。
- Permission contracts。
- Error contracts。
- Runtime type definitions。
- Lightweight Vercel AI SDK adapter-compatible type surface。
- Lightweight Mastra adapter-compatible type surface。

它不负责：

- React UI。
- assistant-ui components。
- Next.js route handlers。
- App pages。
- Dashboard logic。
- Server actions。
- User session lookup。
- `cookies()`。
- `headers()`。
- Direct DB queries。
- DB schema ownership。
- Provider SDK initialization。
- Live AI SDK runtime execution。
- Live Mastra runtime execution。
- Credits ledger mutation。
- Credits charging。
- App-specific billing or entitlement policy。

必须保持以下分层：

```txt
packages/ai = contracts / adapters / runtime types / errors / permissions
apps/web/src/ai = future web app runtime wiring
apps/web/src/components/ai = future app-local AI UI
apps/web/src/app/api/ai = future app API routes
packages/db/src/ai.schema.ts = future DB schema after schema confirmation
```

## 7. minimal AI data model freeze

v0.1 只冻结 minimal AI data model 的名称、关系和语义。它不是 schema 任务，不生成 Drizzle schema，不生成 migration。

v0.2 minimal chat persistence 需要冻结以下实体：

| Future table name | Contract name | 语义 |
| --- | --- | --- |
| `ai_provider` | `AIProvider` | AI provider identity、display name、capabilities、enabled status、default ordering。 |
| `ai_model` | `AIModel` | Provider 下可选模型，包含 model id、capabilities、context window、token/cost metadata reserve。 |
| `ai_user_model_setting` | `AIUserModelSetting` | 用户默认 provider/model 设置。v0.2 只做 user-level default，不做 team policy 或 BYOK。 |
| `ai_agent` | `AIAgent` | Agent profile、instructions、visibility、default model reserve、tool/skill capability references。 |
| `ai_thread` | `AIThread` | Chat thread metadata、owner、agent/model selection、status、title、timestamps。 |
| `ai_message` | `AIMessage` | Thread 内 message envelope，区分 user/assistant/system/tool 等 role。 |
| `ai_message_part` | `AIMessagePart` | Message part，支持 text、tool-call、tool-result、file、reasoning、source/citation reserve。 |
| `ai_tool_call` | `AIToolCall` | Tool call lifecycle audit，记录 tool name、status、arguments/result metadata reserve。 |
| `ai_usage` | `AIUsage` | v0.2 usage audit，不扣 credits，只记录 provider/model/tokens/cost estimate/status/error。 |

必须冻结的关系：

- 一个 `AIProvider` 可以有多个 `AIModel`。
- 一个 user 可以有零或一个 active `AIUserModelSetting`。
- 一个 `AIThread` 属于一个 user，并可引用一个 agent 和一个 selected model。
- 一个 `AIThread` 包含多个 `AIMessage`。
- 一个 `AIMessage` 包含多个 `AIMessagePart`。
- 一个 `AIMessagePart` 可以引用一个 `AIToolCall`。
- 一个 `AIUsage` 可以关联 user、thread、message、provider、model。
- v0.2 中 `AIUsage` 只用于 audit，不触发 credits mutation。

v0.1 不冻结的内容：

- Memory persistence tables。
- Knowledge base tables。
- Embedding tables。
- MCP credential tables。
- Cost event / credit settlement tables。
- Admin audit UI shape。
- Provider secret storage strategy。
- BYOK。
- Team-level model policy。
- Advanced per-agent model policy。

## 8. 依赖边界

默认允许：

- `@repo/config`：仅在 contracts 需要读取静态 config 类型或常量时使用。
- `@repo/env`：仅在类型或 contract 需要表达 env-owned provider key shape 时使用，不读取 runtime secret。
- `@repo/shared`：仅使用纯类型或工具函数。

默认禁止：

- `apps/web` 或 `@/` alias。
- `next`、`next-intl`、`next/headers`、`next/navigation`。
- React UI dependencies。
- assistant-ui runtime。
- Provider SDK package。
- DB client、Drizzle schema、query helper。
- `@repo/db` query/runtime dependency。
- `@repo/auth` session lookup。
- `@repo/payment` runtime。
- `@repo/credits` ledger/service mutation。
- `@repo/storage` runtime upload/download。

待确认后才允许：

- 直接依赖 `ai` package。
- 直接依赖 `@mastra/core`。
- 使用 `zod` 作为 contract schema runtime validator。
- 新增测试框架或测试依赖。

如果未确认以上依赖，v0.1 应使用 TypeScript interface/type 和 adapter-compatible structural types。

## 9. exports 边界

`@repo/ai` 必须使用明确 package exports，不允许消费者 deep import `@repo/ai/src/**`。

建议 v0.1 exports：

```txt
@repo/ai
@repo/ai/providers
@repo/ai/models
@repo/ai/agents
@repo/ai/tools
@repo/ai/skills
@repo/ai/memory
@repo/ai/knowledge
@repo/ai/mcp
@repo/ai/usage
@repo/ai/permissions
@repo/ai/errors
@repo/ai/adapters/ai-sdk
@repo/ai/adapters/mastra
@repo/ai/runtime-types
```

exports 规则：

- `.` 只导出稳定 public surface。
- Domain subpath 只导出该 domain 的 contract/type/error。
- `./adapters/ai-sdk` 只导出 adapter-compatible type surface，不执行 AI SDK runtime。
- `./adapters/mastra` 只导出 adapter-compatible type surface，不创建 Mastra runtime instance。
- `./runtime-types` 只导出 runtime context、request、response、event、stream metadata 等类型。
- 不导出 internal helpers。
- 不导出 app-specific policy。
- 不导出 DB schema。

## 10. v0.1 与 v0.2/v0.3 的边界

v0.1 结束时应该得到：

- `@repo/ai` package skeleton。
- contracts/types/adapters/errors/permissions。
- minimal AI data model freeze。
- 清晰 exports 和 validation。

v0.1 不交付可用 chat。

v0.2 才允许在单独确认后处理：

- assistant-ui。
- Vercel AI SDK runtime。
- Mastra in-process runtime wiring。
- `apps/web/src/ai`。
- `apps/web/src/components/ai`。
- `apps/web/src/app/api/ai/chat/route.ts`。
- minimal chat persistence schema。
- usage audit persistence。

v0.3 才允许在单独 scope freeze 后处理：

- Memory persistence。
- Knowledge base。
- RAG。
- Embeddings。
- Thread summaries。
- Sources / citations persistence。

## 11. 风险与假设

风险：

- `packages/ai` 变成 runtime 杂物包，混入 app session、DB query、provider SDK 初始化或 UI。
- 过早引入 `ai` / `@mastra/core` / `zod` 依赖，导致 v0.1 从 contract foundation 变成 runtime implementation。
- minimal data model 冻结不清，导致 v0.2 schema 反复迁移。
- exports 太宽，消费者开始 deep import 内部实现。
- usage/cost contracts 被误解为 credits charging。

假设：

- `@repo/ai` 是 v0.1 的 package name。
- 当前 `pnpm-workspace.yaml` 的 `packages/*` glob 能识别 `packages/ai`，不需要修改 workspace root config。
- v0.1 默认不新增 runtime dependencies，除非用户在具体 TASK 中确认。
- v0.1 默认不新增测试框架。
- v0.2 的 first route 名称为 `POST /api/ai/chat`，但 v0.1 不创建该 route。

## 12. Open Questions

Open Questions 以 `docs/product/AI_CONTRACTS_FOUNDATION_OPEN_QUESTIONS.md` 为准。进入 v0.1 编码前，必须至少确认：

- `packages/ai` 是否直接依赖 `ai` package。
- `packages/ai` 是否直接依赖 `@mastra/core`。
- contracts 是否使用 `zod` runtime schema。
- minimal data model 是否需要拆成独立文档。
- 是否需要新增测试框架。

## 13. Change Control Rule

任何超出本 scope freeze 的改动都必须先暂停，并按以下格式汇报：

```txt
变更请求：
- 想新增/修改什么：
- 为什么当前 v0.1 scope 不够：
- 是否影响架构、依赖、数据、接口契约或 CI/CD：
- 替代方案：
- 建议是否进入本期：
```

只有用户明确确认后，才能修改 scope。未经确认，不允许把 v0.2/v0.3/v0.4/v0.5 内容提前塞进 v0.1。
