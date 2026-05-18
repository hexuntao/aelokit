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

**重要：v0.2 schema 创建前必须再次确认 schema/migration，并获得用户明确授权。**

### 7.1 冻结实体清单

v0.2 minimal chat persistence 需要冻结以下实体：

| Future table name | Contract name | Owner | 语义 |
| --- | --- | --- | --- |
| `ai_provider` | `AIProvider` | `packages/db` | AI provider identity、display name、capabilities、enabled status、default ordering。 |
| `ai_model` | `AIModel` | `packages/db` | Provider 下可选模型，包含 model id、capabilities、context window、token/cost metadata reserve。 |
| `ai_user_model_setting` | `AIUserModelSetting` | `packages/db` | 用户默认 provider/model 设置。v0.2 只做 user-level default，不做 team policy 或 BYOK。 |
| `ai_agent` | `AIAgent` | `packages/db` | Agent profile、instructions、visibility、default model reserve、tool/skill capability references。 |
| `ai_thread` | `AIThread` | `packages/db` | Chat thread metadata、owner、agent/model selection、status、title、timestamps。 |
| `ai_message` | `AIMessage` | `packages/db` | Thread 内 message envelope，区分 user/assistant/system/tool 等 role。 |
| `ai_message_part` | `AIMessagePart` | `packages/db` | Message part，支持 text、tool-call、tool-result、file、reasoning、source/citation reserve。 |
| `ai_tool_call` | `AIToolCall` | `packages/db` | Tool call lifecycle audit，记录 tool name、status、arguments/result metadata reserve。 |
| `ai_usage` | `AIUsage` | `packages/db` | v0.2 usage audit，不扣 credits，只记录 provider/model/tokens/cost estimate/status/error。 |

### 7.2 实体字段语义冻结

#### 7.2.1 `ai_provider`

| 字段名 | 类型 | 必填 | 语义 |
| --- | --- | --- | --- |
| `id` | `text` (primary key) | Y | Provider 唯一标识，如 `openai`、`anthropic`、`google`。 |
| `display_name` | `text` | Y | 用户可见名称，如 `OpenAI`、`Anthropic`。 |
| `capabilities` | `jsonb` | N | Provider 能力位图，如 `streaming`、`function_calling`、`vision`。 |
| `is_enabled` | `boolean` | Y | 是否启用。disabled provider 不可被选择。 |
| `sort_order` | `integer` | N | UI 排序权重。 |
| `created_at` | `timestamp` | Y | 创建时间。 |
| `updated_at` | `timestamp` | Y | 更新时间。 |

**约束：**
- `id` 必须全局唯一。
- `is_enabled` 默认为 `true`。
- `display_name` 不能为空。

#### 7.2.2 `ai_model`

| 字段名 | 类型 | 必填 | 语义 |
| --- | --- | --- | --- |
| `id` | `text` (primary key) | Y | Model 唯一标识，如 `gpt-4o`、`claude-3-5-sonnet`。 |
| `provider_id` | `text` (FK → `ai_provider.id`) | Y | 所属 Provider。 |
| `display_name` | `text` | Y | 用户可见名称。 |
| `capabilities` | `jsonb` | N | Model 能力位图，如 `streaming`、`function_calling`、`vision`、`reasoning`。 |
| `context_window` | `integer` | N | 上下文窗口大小（tokens）。 |
| `max_output_tokens` | `integer` | N | 最大输出 tokens。 |
| `input_cost_per_million` | `decimal` | N | 输入 token 成本（每百万 tokens）。v0.2 reserve，不用于实际计费。 |
| `output_cost_per_million` | `decimal` | N | 输出 token 成本（每百万 tokens）。v0.2 reserve，不用于实际计费。 |
| `is_enabled` | `boolean` | Y | 是否启用。 |
| `is_default` | `boolean` | N | 是否为该 Provider 的默认模型。 |
| `sort_order` | `integer` | N | UI 排序权重。 |
| `created_at` | `timestamp` | Y | 创建时间。 |
| `updated_at` | `timestamp` | Y | 更新时间。 |

**约束：**
- `id` 必须全局唯一。
- `provider_id` 必须引用有效的 `ai_provider`。
- `is_enabled` 默认为 `true`。
- 每个 `provider_id` 下最多一个 `is_default = true` 的模型。

#### 7.2.3 `ai_user_model_setting`

| 字段名 | 类型 | 必填 | 语义 |
| --- | --- | --- | --- |
| `id` | `uuid` (primary key) | Y | 主键。 |
| `user_id` | `text` (FK → auth user) | Y | 用户 ID。 |
| `provider_id` | `text` (FK → `ai_provider.id`) | Y | 用户选择的 Provider。 |
| `model_id` | `text` (FK → `ai_model.id`) | Y | 用户选择的 Model。 |
| `created_at` | `timestamp` | Y | 创建时间。 |
| `updated_at` | `timestamp` | Y | 更新时间。 |

**约束：**
- `user_id` 必须唯一（每个用户最多一条记录）。
- `provider_id` 和 `model_id` 必须引用有效且启用的记录。
- `model_id` 必须属于 `provider_id` 对应的 Provider。

**v0.2 边界：**
- 只支持 user-level default，不支持 team policy。
- 不支持 BYOK（Bring Your Own Key）。

#### 7.2.4 `ai_agent`

| 字段名 | 类型 | 必填 | 语义 |
| --- | --- | --- | --- |
| `id` | `uuid` (primary key) | Y | Agent 唯一标识。 |
| `name` | `text` | Y | Agent 名称。 |
| `slug` | `text` | Y | URL 友好标识，唯一。 |
| `description` | `text` | N | Agent 描述。 |
| `instructions` | `text` | N | Agent 系统指令/提示词。 |
| `visibility` | `enum` | Y | 可见性：`system`（系统预置）、`public`（所有用户可见）、`private`（仅创建者可见）。v0.2 只支持 `system`。 |
| `default_provider_id` | `text` (FK → `ai_provider.id`) | N | Agent 默认 Provider。 |
| `default_model_id` | `text` (FK → `ai_model.id`) | N | Agent 默认 Model。 |
| `tool_ids` | `jsonb` | N | Agent 可用工具 ID 列表。v0.2 reserve。 |
| `skill_ids` | `jsonb` | N | Agent 可用技能 ID 列表。v0.2 reserve。 |
| `created_at` | `timestamp` | Y | 创建时间。 |
| `updated_at` | `timestamp` | Y | 更新时间。 |

**约束：**
- `slug` 必须全局唯一。
- `visibility` 默认为 `system`。
- v0.2 只支持 `visibility = 'system'` 的预置 Agent。

**v0.2 边界：**
- 不支持用户自定义 Agent。
- 不支持 Studio Agent 编辑。
- 不支持 per-agent model policy（使用 user default 或 system default）。

#### 7.2.5 `ai_thread`

| 字段名 | 类型 | 必填 | 语义 |
| --- | --- | --- | --- |
| `id` | `uuid` (primary key) | Y | Thread 唯一标识。 |
| `user_id` | `text` (FK → auth user) | Y | Thread 所有者。 |
| `agent_id` | `uuid` (FK → `ai_agent.id`) | N | 关联的 Agent。 |
| `provider_id` | `text` (FK → `ai_provider.id`) | N | 本次 Thread 选择的 Provider。 |
| `model_id` | `text` (FK → `ai_model.id`) | N | 本次 Thread 选择的 Model。 |
| `title` | `text` | N | Thread 标题，可由系统自动生成或用户编辑。 |
| `status` | `enum` | Y | Thread 状态：`active`、`archived`、`deleted`。 |
| `created_at` | `timestamp` | Y | 创建时间。 |
| `updated_at` | `timestamp` | Y | 更新时间。 |

**约束：**
- `user_id` 必须引用有效用户。
- `status` 默认为 `active`。
- 如果 `provider_id` 和 `model_id` 都设置，`model_id` 必须属于 `provider_id`。

**Model selection 优先级（v0.2）：**
1. Thread 级别 `model_id`（如果设置）。
2. User default `ai_user_model_setting.model_id`（如果存在）。
3. System default（`ai_model.is_default = true` 且 Provider enabled）。

#### 7.2.6 `ai_message`

| 字段名 | 类型 | 必填 | 语义 |
| --- | --- | --- | --- |
| `id` | `uuid` (primary key) | Y | Message 唯一标识。 |
| `thread_id` | `uuid` (FK → `ai_thread.id`) | Y | 所属 Thread。 |
| `role` | `enum` | Y | Message 角色：`user`、`assistant`、`system`、`tool`。 |
| `created_at` | `timestamp` | Y | 创建时间。 |

**约束：**
- `thread_id` 必须引用有效 Thread。
- `role` 必须为枚举值之一。
- Message 按 `created_at` 在 Thread 内排序。

#### 7.2.7 `ai_message_part`

| 字段名 | 类型 | 必填 | 语义 |
| --- | --- | --- | --- |
| `id` | `uuid` (primary key) | Y | Part 唯一标识。 |
| `message_id` | `uuid` (FK → `ai_message.id`) | Y | 所属 Message。 |
| `part_type` | `enum` | Y | Part 类型：`text`、`tool-call`、`tool-result`、`file`、`image`、`reasoning`、`source`。 |
| `content` | `jsonb` | N | Part 内容，结构取决于 `part_type`。 |
| `tool_call_id` | `uuid` (FK → `ai_tool_call.id`) | N | 关联的 Tool Call（仅 `tool-call` 和 `tool-result` 类型）。 |
| `sort_order` | `integer` | Y | 在 Message 内的排序。 |
| `created_at` | `timestamp` | Y | 创建时间。 |

**约束：**
- `message_id` 必须引用有效 Message。
- `part_type` 必须为枚举值之一。
- `sort_order` 在同一 Message 内必须唯一。

**Part type 语义：**
- `text`：普通文本内容。
- `tool-call`：工具调用请求，关联 `ai_tool_call`。
- `tool-result`：工具调用结果，关联 `ai_tool_call`。
- `file`：文件附件引用。v0.2 reserve。
- `image`：图片附件引用。v0.2 reserve。
- `reasoning`：推理过程片段。v0.2 reserve。
- `source`：引用来源/引用。v0.2 reserve。

#### 7.2.8 `ai_tool_call`

| 字段名 | 类型 | 必填 | 语义 |
| --- | --- | --- | --- |
| `id` | `uuid` (primary key) | Y | Tool Call 唯一标识。 |
| `thread_id` | `uuid` (FK → `ai_thread.id`) | Y | 所属 Thread（便于查询）。 |
| `message_id` | `uuid` (FK → `ai_message.id`) | Y | 触发该调用的 Message。 |
| `tool_name` | `text` | Y | 工具名称。 |
| `status` | `enum` | Y | 调用状态：`pending`、`running`、`success`、`error`、`timeout`。 |
| `arguments` | `jsonb` | N | 调用参数（结构取决于工具）。 |
| `result` | `jsonb` | N | 调用结果。 |
| `error_message` | `text` | N | 错误信息（如果失败）。 |
| `started_at` | `timestamp` | N | 开始执行时间。 |
| `completed_at` | `timestamp` | N | 完成时间。 |
| `created_at` | `timestamp` | Y | 创建时间。 |

**约束：**
- `thread_id` 必须引用有效 Thread。
- `message_id` 必须引用有效 Message。
- `tool_name` 不能为空。
- `status` 默认为 `pending`。

#### 7.2.9 `ai_usage`

| 字段名 | 类型 | 必填 | 语义 |
| --- | --- | --- | --- |
| `id` | `uuid` (primary key) | Y | Usage 记录唯一标识。 |
| `user_id` | `text` (FK → auth user) | Y | 用户 ID。 |
| `thread_id` | `uuid` (FK → `ai_thread.id`) | N | 关联的 Thread。 |
| `message_id` | `uuid` (FK → `ai_message.id`) | N | 关联的 Message。 |
| `provider_id` | `text` (FK → `ai_provider.id`) | Y | 使用的 Provider。 |
| `model_id` | `text` (FK → `ai_model.id`) | Y | 使用的 Model。 |
| `input_tokens` | `integer` | N | 输入 tokens 数。 |
| `output_tokens` | `integer` | N | 输出 tokens 数。 |
| `total_tokens` | `integer` | N | 总 tokens 数。 |
| `estimated_cost_usd` | `decimal` | N | 估算成本（美元）。v0.2 仅用于审计，不触发扣费。 |
| `status` | `enum` | Y | 请求状态：`success`、`error`、`timeout`、`rate_limited`。 |
| `error_code` | `text` | N | 错误代码（如果失败）。 |
| `error_message` | `text` | N | 错误信息（如果失败）。 |
| `request_duration_ms` | `integer` | N | 请求耗时（毫秒）。 |
| `created_at` | `timestamp` | Y | 创建时间。 |

**约束：**
- `user_id` 必须引用有效用户。
- `provider_id` 和 `model_id` 必须引用有效记录。
- `status` 必须为枚举值之一。

**v0.2 边界：**
- `ai_usage` 仅用于审计，不触发 credits mutation。
- 不实现 credits preflight、reservation、settlement。
- 不实现 quota enforcement。

### 7.3 实体关系冻结

```
ai_provider (1) ───< (N) ai_model
                     │
                     │ (referenced by)
                     ▼
ai_user_model_setting ─── ai_provider
                      └── ai_model

ai_agent ─── ai_provider (optional default)
         └── ai_model (optional default)

ai_thread ─── auth.user (owner)
          ├── ai_agent (optional)
          ├── ai_provider (optional selection)
          └── ai_model (optional selection)

ai_thread (1) ───< (N) ai_message
                     │
                     │ (1)
                     ▼
                ai_message (1) ───< (N) ai_message_part
                                           │
                                           │ (optional FK)
                                           ▼
                                      ai_tool_call

ai_tool_call ─── ai_thread
             └── ai_message (triggering message)

ai_usage ─── auth.user
          ├── ai_thread (optional)
          ├── ai_message (optional)
          ├── ai_provider
          └── ai_model
```

### 7.4 v0.2 schema 创建前置条件

在创建 v0.2 schema 前，必须确认：

1. **Schema 所有权确认**：所有 AI schema 文件位于 `packages/db/src/ai.schema.ts`，通过 `packages/db/src/schema.ts` re-export。
2. **Migration 策略确认**：确认使用 Drizzle migration 还是 push，并获得用户授权。
3. **索引策略确认**：确认高频查询路径和索引需求。
4. **外键约束确认**：确认是否启用数据库级外键约束。
5. **软删除策略确认**：确认 `ai_thread`、`ai_message` 是否需要软删除。
6. **JSON 字段验证确认**：确认 `jsonb` 字段是否需要应用层验证或数据库约束。

### 7.5 v0.2 明确不包含的内容

以下内容不在 v0.2 minimal schema 范围内：

- **Memory persistence tables**：属于 v0.3。
- **Knowledge base tables**：属于 v0.3。
- **Embedding tables**：属于 v0.3。
- **MCP credential tables**：属于 v0.4。
- **Cost event / credit settlement tables**：属于 v0.5。
- **Admin audit UI shape**：不属于 schema 范畴。
- **Provider secret storage strategy**：属于 app layer 配置。
- **BYOK (Bring Your Own Key)**：未来规划。
- **Team-level model policy**：未来规划。
- **Advanced per-agent model policy**：未来规划。
- **User-defined Agent tables**：未来规划。
- **Tool/Skill registry tables**：v0.2 reserve，使用代码定义。

### 7.6 v0.2 usage audit 与 credits charging 的边界

**v0.2 usage audit：**
- 只记录，不扣费。
- 不调用 `@repo/credits`。
- 不实现 quota enforcement。
- `estimated_cost_usd` 仅用于审计分析，不触发 billing。

**v0.5 credits integration（未来）：**
- Credits preflight：请求前检查额度。
- Credits reservation：请求时预留额度。
- Credits settlement：请求后结算。
- Credits refund：失败请求退款。
- Failed request handling：失败不扣费或退款。

### 7.7 未冻结的 Open Questions

以下问题在 v0.1 中未冻结，需要在 v0.2 schema 设计前确认：

1. **索引策略**：哪些字段需要索引？
2. **软删除策略**：`ai_thread` 和 `ai_message` 是否需要 `deleted_at`？
3. **JSON 字段验证**：`jsonb` 字段是否需要 schema 验证？
4. **外键级联策略**：删除 Thread 时是否级联删除 Message？
5. **Partition 策略**：大表是否需要分区？
6. **Retention 策略**：Usage 数据保留策略？

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
