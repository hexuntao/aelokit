# AI Chat v0.2 Schema Design

本文件是 TASK-004 的固定输出文件。当前状态是 schema design，等待用户确认后，
才能进入 TASK-005 创建 `packages/db/src/ai.schema.ts` 和 migration。

## 1. 状态

状态：TASK-004 已设计，待用户确认 schema design 和 migration 策略。

当前限制：

- 不创建 `packages/db/src/ai.schema.ts`。
- 不修改 `packages/db/src/schema.ts`。
- 不生成 migration。
- 不运行 `db:generate`、`db:migrate`、`db:push`。
- 不把 schema design 写入 `AI_CHAT_V0_2_DEPENDENCY_RESEARCH.md`。

## 2. TASK-004 目标

TASK-004 基于 v0.1 minimal AI data model freeze，设计 v0.2 minimal chat
persistence schema，并在本文件输出可供 TASK-005 实现的设计。

必须覆盖 9 张表：

- `ai_provider`
- `ai_model`
- `ai_user_model_setting`
- `ai_agent`
- `ai_thread`
- `ai_message`
- `ai_message_part`
- `ai_tool_call`
- `ai_usage`

## 3. 已读取文档

- `AGENTS.md`
- `packages/AGENTS.md`
- `apps/AGENTS.md`
- `apps/web/AGENTS.md`
- `packages/ai/AGENTS.md`
- `packages/db/AGENTS.md`
- `docs/product/AI_CHAT_V0_2_SCOPE_FREEZE.md`
- `docs/product/AI_CHAT_V0_2_ACCEPTANCE.md`
- `docs/product/AI_CHAT_V0_2_IMPLEMENTATION_PLAN.md`
- `docs/product/AI_CHAT_V0_2_SCHEMA_DESIGN.md`
- `docs/product/AI_CHAT_V0_2_OPEN_QUESTIONS.md`
- `docs/product/AI_CONTRACTS_FOUNDATION_SCOPE_FREEZE.md`
- `docs/product/AI_CONTRACTS_FOUNDATION_ACCEPTANCE.md`
- `docs/architecture/AI_AGENT_INFRASTRUCTURE_BOUNDARIES.md`
- `docs/architecture/AI_RUNTIME_LAYERING.md`
- `docs/architecture/AELOKIT_PACKAGE_BOUNDARIES.md`
- `packages/ai/src/providers/index.ts`
- `packages/ai/src/models/index.ts`
- `packages/ai/src/agents/index.ts`
- `packages/ai/src/tools/index.ts`
- `packages/ai/src/usage/index.ts`
- `packages/ai/src/adapters/ai-sdk/index.ts`
- `packages/db/src/auth.schema.ts`
- `packages/db/src/app.schema.ts`
- `packages/db/src/schema.ts`

## 4. External Docs Gate

适用：适用。TASK-004 需要把 `ai_message`、`ai_message_part`、
`ai_tool_call` 和 `ai_usage` 对齐 assistant-ui / Vercel AI SDK v6 的
message persistence、message parts、tool-call state 和 usage metadata。

读取时间：2026-05-18。

官方文档 URL：

- assistant-ui AI SDK v6 runtime:
  <https://www.assistant-ui.com/docs/runtimes/ai-sdk/v6>
- assistant-ui custom thread persistence:
  <https://www.assistant-ui.com/docs/integrations/persistence/custom-adapter>
- assistant-ui persistence adapters:
  <https://www.assistant-ui.com/docs/api-reference/adapters/persistence>
- Vercel AI SDK `UIMessage` reference:
  <https://ai-sdk.dev/docs/reference/ai-sdk-core/ui-message>
- Vercel AI SDK chatbot message persistence:
  <https://ai-sdk.dev/docs/ai-sdk-ui/chatbot-message-persistence>
- Vercel AI SDK streaming custom data:
  <https://ai-sdk.dev/docs/ai-sdk-ui/streaming-data>
- Vercel AI SDK `streamText` reference:
  <https://ai-sdk.dev/docs/reference/ai-sdk-core/stream-text>

版本确认：

```txt
ai: 6.0.184
@ai-sdk/react: 3.0.186
@assistant-ui/react: 0.14.5
@assistant-ui/react-ai-sdk: 1.3.26
```

采用 API / shape：

- assistant-ui 当前 AI SDK v6 runtime 使用 `useChatRuntime`，可通过
  `AssistantChatTransport({ api: '/api/ai/chat' })` 覆盖默认 endpoint。
- assistant-ui history adapter 在 AI SDK path 中必须实现 `withFormat`，并通过
  `fmt.encode` / `fmt.decode` round-trip AI SDK `UIMessage`。
- assistant-ui custom persistence 文档给出的持久化核心列是 `id`、
  `parent_id`、`format`、`content`；本设计拆成 thread/message/part/tool-call
  表，同时在 `ai_message` 保留 `parent_message_id` 和 `runtime_format`。
- AI SDK v6 `UIMessage` 的核心 shape 是 `id`、`role`、`metadata`、
  `parts[]`；`parts` 包括 `text`、`reasoning`、`tool-${name}`、
  `source-url`、`source-document`、`file`、`data-${name}` 等形态。
- AI SDK v6 `streamText` usage metadata 暴露 `inputTokens`、`outputTokens`、
  `totalTokens`、`reasoningTokens`、`cachedInputTokens`、`raw` 和
  `providerMetadata` 等字段；本设计把稳定统计列放入 `ai_usage`，把 provider
  原始扩展放入 `raw_usage` / `provider_metadata`。

v4/v5/v6 差异：

- assistant-ui 文档明确区分 AI SDK v6 / v5 / v4；v6 是 current path。
- v6 message persistence 以 `UIMessage[]`、`validateUIMessages`、
  `originalMessages` 和 stream finish persistence 为核心。
- v6 tool part 类型是 `tool-${toolName}`，不是固定字符串 `tool-call`；本设计用
  `ai_message_part.runtime_part_type` 保存 runtime exact type，用
  `part_type` 保存 AeloKit normalized type。

对 schema 的影响：

- `ai_message.id` 使用 server/UI shared message id，并保留
  `parent_message_id` 和 `runtime_format` 以支持 assistant-ui `withFormat`。
- `ai_message_part` 使用 ordered rows，而不是只保存整条 `UIMessage` JSON；
  `content` 保存 part-specific payload，`runtime_part_type` 保存 AI SDK exact
  part type。
- `ai_tool_call.id` 使用 AI SDK `toolCallId`，便于 message part 和 lifecycle
  audit 对齐。
- `ai_usage` token 字段允许 nullable，因为 provider/SDK 可能不返回某些 usage
  metric；不要用 `0` 伪造未知 usage。

未确认风险：

- TASK-009/TASK-010 实现 persistence 时仍需再次核对 AI SDK v6
  `toUIMessageStreamResponse()` 的 `onFinish`、`messageMetadata`、
  `generateMessageId` 选项形态。
- assistant-ui `withFormat` 可以保存 opaque encoded payload；本设计选择拆表
  加 normalized fields。若后续实现发现 round-trip 有未覆盖字段，应只扩展
  `content`/`metadata` JSON，不新增 v0.3 表。

## 5. TASK-004 输出

### 5.1 Design Summary

- Scope: 设计 v0.2 minimal chat persistence 所需 9 张表，覆盖 provider/model
  seed metadata、user default model、system agent、thread、message、message
  part、tool call lifecycle 和 usage audit。
- Non-goals: 不创建 schema 文件，不生成 migration，不运行 DB 命令，不实现
  route/runtime/UI，不做 memory/RAG/MCP/BYOK/team policy/credits charging。
- Confirmed assumptions: AI schema 所有权在 `packages/db`；provider secret 不入库；
  `packages/ai` 仍只提供 contracts/adapters/runtime types；usage audit 不调用
  `@repo/credits`。
- Open risks: migration 策略、ID column 使用 `text` 还是 `uuid`、JSON validation
  位置、FK cascade 策略、usage retention/partition 策略仍需用户在 TASK-005 前确认。

ID 策略建议：为了匹配现有 `packages/db` 的 `user`、`payment`、`credit_transaction`
等表，TASK-005 建议用 `text` 存储 app-generated UUID/ULID 字符串，而不是混入
Postgres `uuid` column type。语义上仍保持 UUID-like stable id。

时间字段策略：新增表默认使用 `timestamp(...).notNull().defaultNow()`；`updated_at`
由 app/service 层更新。需要数据库 trigger 时必须另行确认。

JSON validation 策略：所有 `jsonb` 字段只保存 contract/runtime payload；结构校验由
`apps/web/src/ai` persistence service 和 `@repo/ai` structural contracts 负责，DB
只做基本 nullable/default 约束。

### 5.2 Table Designs

#### 5.2.1 `ai_provider`

Purpose: 保存 provider registry metadata，不保存 provider secret。

Fields:

| Field | DB type | Nullable | Default | Enum/check strategy and ownership |
| --- | --- | --- | --- | --- |
| `id` | `text` | No | none | Primary key; maps to `AIProviderId`, e.g. `openai`. |
| `display_name` | `text` | No | none | Maps to `AIProvider.display.name`; app validates non-empty. |
| `description` | `text` | Yes | `null` | Maps to `AIProvider.display.description`. |
| `documentation_url` | `text` | Yes | `null` | Maps to `AIProvider.display.documentationUrl`. |
| `capabilities` | `jsonb` | No | `[]` | App validates `AIProviderCapability[]`. |
| `status` | `text` | No | `enabled` | Check: `enabled`, `disabled`, `deprecated`; maps to `AIProviderEnabledStatus`. |
| `sort_order` | `integer` | No | `0` | Maps to `AIProviderOrdering.defaultOrder`. |
| `created_at` | `timestamp` | No | `now()` | DB-owned creation timestamp. |
| `updated_at` | `timestamp` | No | `now()` | App/service updates on mutation. |

Primary key: `id`.

Foreign keys: none.

Indexes:

- `ai_provider_status_idx` on `status`.
- `ai_provider_sort_order_idx` on `sort_order`.

Unique constraints: primary key only.

Status/lifecycle fields: `status`, `created_at`, `updated_at`.

JSON fields and validation ownership: `capabilities` is validated by app/runtime
against `@repo/ai/providers` capability literals.

Mapping to `packages/ai` v0.1 contracts: maps to `AIProvider`,
`AIProviderId`, `AIProviderCapability`, `AIProviderEnabledStatus`.

Mapping to assistant-ui / AI SDK message shape: not directly message-shaped; used
by runtime model/provider resolution before stream execution.

Migration impact: creates provider lookup table; no existing table touched.

#### 5.2.2 `ai_model`

Purpose: 保存 provider 下可选模型、模型能力、context window 和 usage cost audit
所需的静态价格参考。

Fields:

| Field | DB type | Nullable | Default | Enum/check strategy and ownership |
| --- | --- | --- | --- | --- |
| `id` | `text` | No | none | Primary key; AeloKit model id, maps to `AIModelId`. |
| `provider_id` | `text` | No | none | FK to `ai_provider.id`; maps to `AIProviderId`. |
| `provider_model_id` | `text` | No | none | Provider-native id, maps to `AIModel.providerModelId`. |
| `display_name` | `text` | No | none | Maps to `AIModel.display.name`. |
| `description` | `text` | Yes | `null` | Maps to `AIModel.display.description`. |
| `capabilities` | `jsonb` | No | `[]` | App validates `AIModelCapability[]`. |
| `context_window_tokens` | `integer` | Yes | `null` | Maps to `AIModel.contextWindow.contextWindowTokens`; nullable if unknown. |
| `max_output_tokens` | `integer` | Yes | `null` | Maps to `AIModel.contextWindow.maxOutputTokens`. |
| `input_cost_per_million_tokens` | `numeric(12,6)` | Yes | `null` | Audit estimate only; not billing. |
| `output_cost_per_million_tokens` | `numeric(12,6)` | Yes | `null` | Audit estimate only; not billing. |
| `cached_input_cost_per_million_tokens` | `numeric(12,6)` | Yes | `null` | Optional cached token estimate. |
| `cost_currency_code` | `text` | Yes | `null` | Maps to `AICostEstimate.currencyCode`; `USD` may be seeded. |
| `cost_metadata_updated_at` | `timestamp` | Yes | `null` | Maps to `AIModelCostMetadataReserve.updatedAt`. |
| `status` | `text` | No | `enabled` | Check: `enabled`, `disabled`, `deprecated`; maps to `AIModelEnabledStatus`. |
| `is_default` | `boolean` | No | `false` | System fallback marker, scoped per provider. |
| `sort_order` | `integer` | No | `0` | UI/model picker ordering. |
| `created_at` | `timestamp` | No | `now()` | DB-owned creation timestamp. |
| `updated_at` | `timestamp` | No | `now()` | App/service updates on mutation. |

Primary key: `id`.

Foreign keys:

- `provider_id` references `ai_provider.id` with restricted/no-action delete.

Indexes:

- `ai_model_provider_id_idx` on `provider_id`.
- `ai_model_status_idx` on `status`.
- `ai_model_provider_status_idx` on `provider_id`, `status`.
- `ai_model_sort_order_idx` on `sort_order`.

Unique constraints:

- `ai_model_provider_model_id_uidx` on `provider_id`, `provider_model_id`.
- `ai_model_provider_id_id_uidx` on `provider_id`, `id`, so composite FKs can
  prove selected model belongs to selected provider.
- `ai_model_provider_default_uidx` as a partial unique index on `provider_id`
  where `is_default = true`.

Status/lifecycle fields: `status`, `is_default`, `created_at`, `updated_at`.

JSON fields and validation ownership: `capabilities` is validated by app/runtime
against `@repo/ai/models` capability literals.

Mapping to `packages/ai` v0.1 contracts: maps to `AIModel`, `AIModelId`,
`AIModelReference`, `AIModelContextWindow`, `AIModelCostMetadataReserve`,
`AIModelEnabledStatus`.

Mapping to assistant-ui / AI SDK message shape: `provider_model_id` is passed to
the provider SDK in app runtime; no provider secret is stored.

Migration impact: creates model lookup table; no existing table touched.

#### 5.2.3 `ai_user_model_setting`

Purpose: 保存 v0.2 user-level default model reference；不做 team policy 或 BYOK。

Fields:

| Field | DB type | Nullable | Default | Enum/check strategy and ownership |
| --- | --- | --- | --- | --- |
| `id` | `text` | No | app-generated UUID/ULID | Primary key. |
| `user_id` | `text` | No | none | FK to `user.id`; maps to `AIUserDefaultModelReference.userId`. |
| `provider_id` | `text` | No | none | FK to `ai_provider.id`. |
| `model_id` | `text` | No | none | FK to `ai_model.id`. |
| `created_at` | `timestamp` | No | `now()` | DB-owned creation timestamp. |
| `updated_at` | `timestamp` | No | `now()` | App/service updates on mutation. |

Primary key: `id`.

Foreign keys:

- `user_id` references `user.id`, recommended `onDelete: cascade`.
- `provider_id` references `ai_provider.id`, restricted/no-action delete.
- `model_id` references `ai_model.id`, restricted/no-action delete.
- Composite FK `(provider_id, model_id)` references
  `(ai_model.provider_id, ai_model.id)`.

Indexes:

- `ai_user_model_setting_provider_model_idx` on `provider_id`, `model_id`.

Unique constraints:

- `ai_user_model_setting_user_id_uidx` on `user_id`.

Status/lifecycle fields: `created_at`, `updated_at`; effective enablement comes
from referenced provider/model `status`.

JSON fields and validation ownership: none.

Mapping to `packages/ai` v0.1 contracts: maps to
`AIUserDefaultModelReference` and model fallback source `user-default`.

Mapping to assistant-ui / AI SDK message shape: not part of message payload; used
before stream execution to select model.

Migration impact: creates user default settings table; existing `user` table is
only referenced, not modified.

#### 5.2.4 `ai_agent`

Purpose: 保存 system/default agent metadata。v0.2 只 seed system agent，不做用户自定义
agent studio。

Fields:

| Field | DB type | Nullable | Default | Enum/check strategy and ownership |
| --- | --- | --- | --- | --- |
| `id` | `text` | No | app-generated UUID/ULID | Primary key; maps to `AIAgentId`. |
| `slug` | `text` | No | none | Stable unique agent slug. |
| `display_name` | `text` | No | none | Maps to `AIAgent.display.name`. |
| `description` | `text` | Yes | `null` | Maps to `AIAgent.display.description`. |
| `instructions` | `jsonb` | No | `{}` | App validates `AIAgentInstructionContract`. |
| `visibility` | `text` | No | `system` | Check: `system`, `public`, `private`; v0.2 seeds only `system`. |
| `status` | `text` | No | `enabled` | Check: `enabled`, `disabled`, `deprecated`; maps to `AIAgentEnabledStatus`. |
| `default_provider_id` | `text` | Yes | `null` | Optional FK to `ai_provider.id`. |
| `default_model_id` | `text` | Yes | `null` | Optional FK to `ai_model.id`. |
| `tool_ids` | `jsonb` | No | `[]` | Reserve; app validates `AIAgentToolReference[]`. |
| `skill_ids` | `jsonb` | No | `[]` | Reserve; app validates `AIAgentSkillReference[]`. |
| `created_at` | `timestamp` | No | `now()` | DB-owned creation timestamp. |
| `updated_at` | `timestamp` | No | `now()` | App/service updates on mutation. |

Primary key: `id`.

Foreign keys:

- `default_provider_id` references `ai_provider.id`, restricted/no-action delete.
- `default_model_id` references `ai_model.id`, restricted/no-action delete.
- Composite FK `(default_provider_id, default_model_id)` references
  `(ai_model.provider_id, ai_model.id)` when both are set.

Indexes:

- `ai_agent_visibility_status_idx` on `visibility`, `status`.
- `ai_agent_default_model_idx` on `default_provider_id`, `default_model_id`.

Unique constraints:

- `ai_agent_slug_uidx` on `slug`.

Status/lifecycle fields: `visibility`, `status`, `created_at`, `updated_at`.

JSON fields and validation ownership:

- `instructions` is validated in app/runtime against `AIAgentInstructionContract`.
- `tool_ids` / `skill_ids` remain reserve arrays; v0.2 does not create tool/skill
  registry tables.

Mapping to `packages/ai` v0.1 contracts: maps to `AIAgent`,
`AIAgentVisibility`, `AIAgentEnabledStatus`, `AIAgentInstructionContract`,
`AIAgentCapabilityReferences`.

Mapping to assistant-ui / AI SDK message shape: instructions become model/system
messages in app runtime; they are not client-owned.

Migration impact: creates agent metadata table; no user-defined agent tables.

#### 5.2.5 `ai_thread`

Purpose: 保存 chat thread owner、agent/model selection、title 和 lifecycle。

Fields:

| Field | DB type | Nullable | Default | Enum/check strategy and ownership |
| --- | --- | --- | --- | --- |
| `id` | `text` | No | app-generated UUID/ULID | Primary key. |
| `user_id` | `text` | No | none | FK to `user.id`; thread owner. |
| `agent_id` | `text` | Yes | `null` | Optional FK to `ai_agent.id`. |
| `provider_id` | `text` | Yes | `null` | Thread-level selected provider. |
| `model_id` | `text` | Yes | `null` | Thread-level selected model. |
| `title` | `text` | Yes | `null` | User/system generated title. |
| `status` | `text` | No | `active` | Check: `active`, `archived`, `deleted`. |
| `metadata` | `jsonb` | No | `{}` | App-owned thread metadata reserve. |
| `created_at` | `timestamp` | No | `now()` | DB-owned creation timestamp. |
| `updated_at` | `timestamp` | No | `now()` | App/service updates on mutation. |
| `deleted_at` | `timestamp` | Yes | `null` | Set when `status = deleted`; soft-delete marker. |

Primary key: `id`.

Foreign keys:

- `user_id` references `user.id`, recommended `onDelete: cascade`.
- `agent_id` references `ai_agent.id`, recommended `onDelete: set null`.
- `provider_id` references `ai_provider.id`, restricted/no-action delete.
- `model_id` references `ai_model.id`, restricted/no-action delete.
- Composite FK `(provider_id, model_id)` references
  `(ai_model.provider_id, ai_model.id)` when both are set.

Indexes:

- `ai_thread_user_status_updated_idx` on `user_id`, `status`, `updated_at`.
- `ai_thread_user_created_idx` on `user_id`, `created_at`.
- `ai_thread_agent_id_idx` on `agent_id`.
- `ai_thread_model_idx` on `provider_id`, `model_id`.

Unique constraints: primary key only.

Status/lifecycle fields: `status`, `created_at`, `updated_at`, `deleted_at`.

JSON fields and validation ownership: `metadata` is app-owned; v0.2 should avoid
storing sensitive raw prompt content here.

Mapping to `packages/ai` v0.1 contracts: maps to `AIThreadModelReference`,
`AIAgentSelectionReference`, runtime model fallback source `thread`.

Mapping to assistant-ui / AI SDK message shape: thread id scopes
`UIMessage[]` persistence and assistant-ui thread list loading.

Migration impact: creates thread table; existing `user` table is only referenced,
not modified.

#### 5.2.6 `ai_message`

Purpose: 保存 thread 内 message envelope，兼容 AI SDK `UIMessage` 和 assistant-ui
history adapter 的 message row identity。

Fields:

| Field | DB type | Nullable | Default | Enum/check strategy and ownership |
| --- | --- | --- | --- | --- |
| `id` | `text` | No | server/UI generated id | Primary key; maps to AI SDK `UIMessage.id`. |
| `thread_id` | `text` | No | none | FK to `ai_thread.id`. |
| `parent_message_id` | `text` | Yes | `null` | Self FK; maps to assistant-ui `parent_id` for branches. |
| `role` | `text` | No | none | Check: `system`, `user`, `assistant`, `tool`; maps to `UIMessage.role`. |
| `runtime_format` | `text` | No | `aisdk-v6` | Records encoded runtime format for round-trip compatibility. |
| `status` | `text` | No | `complete` | Check: `streaming`, `complete`, `error`, `aborted`. |
| `sort_order` | `integer` | No | none | Stable order inside thread. |
| `metadata` | `jsonb` | No | `{}` | Maps to `UIMessage.metadata`; app validates shape. |
| `created_at` | `timestamp` | No | `now()` | Message creation timestamp. |
| `completed_at` | `timestamp` | Yes | `null` | Set when stream/message is complete or failed. |

Primary key: `id`.

Foreign keys:

- `thread_id` references `ai_thread.id`, recommended `onDelete: cascade`.
- `parent_message_id` references `ai_message.id`, recommended `onDelete: set null`.

Indexes:

- `ai_message_thread_sort_idx` on `thread_id`, `sort_order`.
- `ai_message_thread_created_idx` on `thread_id`, `created_at`.
- `ai_message_parent_id_idx` on `parent_message_id`.
- `ai_message_status_idx` on `status`.

Unique constraints:

- `ai_message_thread_sort_uidx` on `thread_id`, `sort_order`.

Status/lifecycle fields: `status`, `created_at`, `completed_at`.

JSON fields and validation ownership: `metadata` is validated by
`apps/web/src/ai` persistence service; provider-specific metadata should be
minimal and non-secret.

Mapping to `packages/ai` v0.1 contracts: maps to
`AIVercelAISDKUIMessage`, `AIVercelAISDKMessageId`,
`AIVercelAISDKMessageRole`.

Mapping to assistant-ui / AI SDK message shape:

- `id` maps to `UIMessage.id` and assistant-ui `fmt.getId(item.message)`.
- `parent_message_id` maps to assistant-ui `parent_id`.
- `runtime_format` maps to assistant-ui `fmt.format`, expected `aisdk-v6`.
- `metadata` maps to `UIMessage.metadata`.

Migration impact: creates message envelope table; message content lives in
`ai_message_part`.

#### 5.2.7 `ai_message_part`

Purpose: 保存 ordered message parts，兼容 AI SDK v6 `UIMessage.parts` 和 AeloKit
normalized part model。

Fields:

| Field | DB type | Nullable | Default | Enum/check strategy and ownership |
| --- | --- | --- | --- | --- |
| `id` | `text` | No | app-generated UUID/ULID | Primary key. |
| `message_id` | `text` | No | none | FK to `ai_message.id`. |
| `part_type` | `text` | No | none | Check normalized values: `text`, `reasoning`, `tool-call`, `tool-result`, `file`, `image`, `source`, `data`. |
| `runtime_part_type` | `text` | No | none | Exact AI SDK part type, e.g. `text`, `tool-search`, `source-url`. |
| `content` | `jsonb` | No | `{}` | Part-specific payload. |
| `tool_call_id` | `text` | Yes | `null` | Optional FK to `ai_tool_call.id`. |
| `sort_order` | `integer` | No | none | Stable order inside message. |
| `created_at` | `timestamp` | No | `now()` | DB-owned creation timestamp. |

Primary key: `id`.

Foreign keys:

- `message_id` references `ai_message.id`, recommended `onDelete: cascade`.
- `tool_call_id` references `ai_tool_call.id`, recommended `onDelete: set null`.

Indexes:

- `ai_message_part_message_sort_idx` on `message_id`, `sort_order`.
- `ai_message_part_type_idx` on `part_type`.
- `ai_message_part_tool_call_id_idx` on `tool_call_id`.

Unique constraints:

- `ai_message_part_message_sort_uidx` on `message_id`, `sort_order`.

Status/lifecycle fields: no separate lifecycle; lifecycle comes from parent
message or linked tool call.

JSON fields and validation ownership:

- `content` is validated by app/runtime based on `part_type` and
  `runtime_part_type`.
- Suggested payloads:
  - `text`: `{ "text": string, "state"?: "streaming" | "done" }`.
  - `reasoning`: `{ "text": string, "state"?: "streaming" | "done", "providerMetadata"?: object }`.
  - `tool-call`: `{ "toolCallId": string, "toolName": string, "state": string, "input"?: unknown, "providerExecuted"?: boolean }`.
  - `tool-result`: `{ "toolCallId": string, "toolName": string, "output"?: unknown, "errorText"?: string }`.
  - `file` / `image`: file metadata or storage references; no binary blobs.
  - `source`: source metadata reserve; no v0.3 knowledge tables.
  - `data`: custom persistent data part payload; transient data is not persisted.

Mapping to `packages/ai` v0.1 contracts: maps to
`AIVercelAISDKUIMessagePart`, `AIVercelAISDKTextPart`,
`AIVercelAISDKReasoningPart`, `AIVercelAISDKToolCallPart`,
`AIVercelAISDKFilePart`, `AIVercelAISDKSourcePart`.

Mapping to assistant-ui / AI SDK message shape:

- Ordered rows reconstruct `UIMessage.parts`.
- `runtime_part_type` preserves v6 exact types like `tool-${name}` and
  `data-${name}`.
- Persistent data parts can be stored; transient parts are not saved because AI
  SDK docs state they do not enter message history.

Migration impact: creates message part table; no attachment/storage tables.

#### 5.2.8 `ai_tool_call`

Purpose: 保存 tool call lifecycle audit reserve。v0.2 不创建 full MCP 或 tool registry
tables。

Fields:

| Field | DB type | Nullable | Default | Enum/check strategy and ownership |
| --- | --- | --- | --- | --- |
| `id` | `text` | No | AI SDK `toolCallId` or app-generated id | Primary key; maps to `toolCallId`. |
| `thread_id` | `text` | No | none | FK to `ai_thread.id`. |
| `message_id` | `text` | No | none | FK to triggering `ai_message.id`. |
| `tool_name` | `text` | No | none | Runtime tool name; maps to AI SDK tool part. |
| `tool_id` | `text` | Yes | `null` | Optional `AIToolDefinitionId` if known. |
| `status` | `text` | No | `pending` | Check: `pending`, `running`, `success`, `error`, `timeout`. |
| `input` | `jsonb` | Yes | `null` | Tool input; app validates per tool schema. |
| `output` | `jsonb` | Yes | `null` | Tool output; app validates per tool schema. |
| `provider_executed` | `boolean` | No | `false` | Maps to AI SDK tool part `providerExecuted` when present. |
| `error_code` | `text` | Yes | `null` | Optional stable error code. |
| `error_message` | `text` | Yes | `null` | Human-readable failure reason. |
| `started_at` | `timestamp` | Yes | `null` | Runtime sets when execution starts. |
| `completed_at` | `timestamp` | Yes | `null` | Runtime sets when execution ends. |
| `created_at` | `timestamp` | No | `now()` | DB-owned creation timestamp. |

Primary key: `id`.

Foreign keys:

- `thread_id` references `ai_thread.id`, recommended `onDelete: cascade`.
- `message_id` references `ai_message.id`, recommended `onDelete: cascade`.

Indexes:

- `ai_tool_call_thread_created_idx` on `thread_id`, `created_at`.
- `ai_tool_call_message_id_idx` on `message_id`.
- `ai_tool_call_status_idx` on `status`.
- `ai_tool_call_tool_name_idx` on `tool_name`.

Unique constraints: primary key only.

Status/lifecycle fields: `status`, `started_at`, `completed_at`, `created_at`.

JSON fields and validation ownership: `input` and `output` stay `unknown` until
app/runtime validates against the selected tool schema. DB should not attempt
tool-specific JSON constraints in v0.2.

Mapping to `packages/ai` v0.1 contracts: maps to `AIToolCallStatus`,
`AIToolCallLifecycleReference`, `AIVercelAISDKToolCallPart`,
`AIVercelAISDKToolCallStreamState`.

Mapping to assistant-ui / AI SDK message shape:

- `id` maps to AI SDK `toolCallId`.
- `status` maps from AI SDK v6 states:
  - `input-streaming` -> `running`
  - `input-available` -> `pending` or `running`
  - `output-available` -> `success`
  - `output-error` -> `error`

Migration impact: creates tool-call lifecycle table only; no MCP credential or
tool registry tables.

#### 5.2.9 `ai_usage`

Purpose: 保存 v0.2 usage audit。它不是 credits ledger、不是扣费事实来源。

Fields:

| Field | DB type | Nullable | Default | Enum/check strategy and ownership |
| --- | --- | --- | --- | --- |
| `id` | `text` | No | app-generated UUID/ULID | Primary key; maps to `AIUsageRecordId`. |
| `user_id` | `text` | No | none | FK to `user.id`; maps to `AIUsageSubjectReference.userId`. |
| `thread_id` | `text` | Yes | `null` | FK to `ai_thread.id`; nullable for failed pre-thread calls. |
| `message_id` | `text` | Yes | `null` | FK to `ai_message.id`; nullable for failures before assistant message. |
| `provider_id` | `text` | No | none | FK to `ai_provider.id`. |
| `model_id` | `text` | No | none | FK to `ai_model.id`. |
| `provider_model_id` | `text` | Yes | `null` | Runtime/provider actual model id if reported. |
| `input_tokens` | `integer` | Yes | `null` | Nullable when provider does not report. |
| `output_tokens` | `integer` | Yes | `null` | Nullable when provider does not report. |
| `total_tokens` | `integer` | Yes | `null` | Nullable; provider total may differ from sum. |
| `cached_input_tokens` | `integer` | Yes | `null` | Optional AI SDK usage detail. |
| `reasoning_tokens` | `integer` | Yes | `null` | Optional AI SDK usage detail. |
| `estimated_cost_usd` | `numeric(12,6)` | Yes | `null` | Audit estimate only; never credits mutation. |
| `cost_currency_code` | `text` | Yes | `null` | Usually `USD` if estimated. |
| `cost_estimate_source` | `text` | Yes | `null` | Check: `model-metadata`, `provider-reported`, `manual-estimate`, `unknown`. |
| `status` | `text` | No | none | Check: `success`, `error`, `timeout`, `rate_limited`. |
| `failure_reason` | `text` | Yes | `null` | Check app-side against `AIUsageFailureReason`. |
| `error_code` | `text` | Yes | `null` | Optional stable error code. |
| `error_message` | `text` | Yes | `null` | Optional failure message. |
| `request_duration_ms` | `integer` | Yes | `null` | Measured in app runtime. |
| `raw_usage` | `jsonb` | Yes | `null` | Provider/AI SDK raw usage object. |
| `provider_metadata` | `jsonb` | Yes | `null` | Provider metadata; must not include secrets. |
| `requested_at` | `timestamp` | No | `now()` | Request received time. |
| `started_at` | `timestamp` | Yes | `null` | Provider call start time. |
| `completed_at` | `timestamp` | Yes | `null` | Provider call completion/failure time. |
| `created_at` | `timestamp` | No | `now()` | DB-owned insertion timestamp. |

Primary key: `id`.

Foreign keys:

- `user_id` references `user.id`, recommended `onDelete: cascade`.
- `thread_id` references `ai_thread.id`, recommended `onDelete: set null`.
- `message_id` references `ai_message.id`, recommended `onDelete: set null`.
- `provider_id` references `ai_provider.id`, restricted/no-action delete.
- `model_id` references `ai_model.id`, restricted/no-action delete.
- Composite FK `(provider_id, model_id)` references
  `(ai_model.provider_id, ai_model.id)`.

Indexes:

- `ai_usage_user_created_idx` on `user_id`, `created_at`.
- `ai_usage_thread_created_idx` on `thread_id`, `created_at`.
- `ai_usage_message_id_idx` on `message_id`.
- `ai_usage_provider_model_created_idx` on `provider_id`, `model_id`, `created_at`.
- `ai_usage_status_created_idx` on `status`, `created_at`.

Unique constraints: primary key only.

Status/lifecycle fields: `status`, `failure_reason`, `requested_at`,
`started_at`, `completed_at`, `created_at`.

JSON fields and validation ownership:

- `raw_usage` stores provider/SDK raw usage for audit/debugging only.
- `provider_metadata` stores provider metadata that is explicitly non-secret.
- App/runtime owns redaction before insert.

Mapping to `packages/ai` v0.1 contracts: maps to `AIUsageRecord`,
`AIUsageSubjectReference`, `AIUsageModelReference`, `AIUsageTokenUsage`,
`AICostEstimate`, `AIUsageStatus`, `AIUsageFailure`, `AIUsageTiming`.

Mapping to assistant-ui / AI SDK message shape:

- AI SDK `LanguageModelUsage.inputTokens` -> `input_tokens`.
- AI SDK `LanguageModelUsage.outputTokens` -> `output_tokens`.
- AI SDK `LanguageModelUsage.totalTokens` -> `total_tokens`.
- AI SDK `reasoningTokens` / `cachedInputTokens` -> matching nullable columns.
- AI SDK `raw` -> `raw_usage`.
- AI SDK `providerMetadata` -> `provider_metadata`.

Migration impact: creates usage audit table only; no credits ledger or settlement
tables.

### 5.3 Required Table Checklist

| Table | Status | Notes |
| --- | --- | --- |
| `ai_provider` | 已设计 | Provider metadata only; no secrets. |
| `ai_model` | 已设计 | Model metadata, defaults, pricing reference for audit estimate only. |
| `ai_user_model_setting` | 已设计 | User default model reference, no team policy or BYOK. |
| `ai_agent` | 已设计 | System/default agent metadata, no user-defined studio. |
| `ai_thread` | 已设计 | Chat/thread owner and thread-level model selection. |
| `ai_message` | 已设计 | AI SDK `UIMessage` envelope with assistant-ui parent/format support. |
| `ai_message_part` | 已设计 | Ordered message parts compatible with AI SDK v6 UI messages. |
| `ai_tool_call` | 已设计 | Tool call lifecycle reserve, no full MCP. |
| `ai_usage` | 已设计 | Usage audit only, no credits mutation. |

### 5.4 Model Fallback Mapping

v0.2 model fallback order:

1. per-chat/per-thread model: `ai_thread.provider_id` + `ai_thread.model_id`.
2. user default model: `ai_user_model_setting.provider_id` +
   `ai_user_model_setting.model_id`.
3. system default model: `ai_model.is_default = true` with enabled
   `ai_provider.status` and enabled `ai_model.status`.

Implementation notes for TASK-005+:

- Composite FK `(provider_id, model_id)` ensures a selected model belongs to the
  selected provider.
- Runtime must still verify provider/model `status = enabled` before use.
- Agent default model is stored as reserve in `ai_agent`; v0.2 fallback does not
  place agent default ahead of thread/user/system unless a later TASK explicitly
  changes the product rule.

### 5.5 Usage / Credits Boundary

- `ai_usage` is audit-only in v0.2.
- No `@repo/credits` call.
- No ledger mutation.
- No quota enforcement.
- No billing settlement.
- `estimated_cost_usd` is a non-final estimate and may be `null`.
- Unknown token metrics must remain `null`; do not write `0` unless the provider
  explicitly reports zero.
- Required audit dimensions are represented: `user_id`, `thread_id`,
  `message_id`, `provider_id`, `model_id`, `input_tokens`, `output_tokens`,
  `estimated_cost_usd`, `status`, `failure_reason`, `created_at`.

### 5.6 Migration Impact

New tables:

- `ai_provider`
- `ai_model`
- `ai_user_model_setting`
- `ai_agent`
- `ai_thread`
- `ai_message`
- `ai_message_part`
- `ai_tool_call`
- `ai_usage`

New indexes:

- Provider/model lookup and enabled/default selection indexes.
- User thread listing indexes.
- Message and message part ordering indexes.
- Tool-call lifecycle lookup indexes.
- Usage audit query indexes by user/thread/message/provider/model/status/time.

New foreign keys:

- AI tables reference `user.id`, `ai_provider.id`, `ai_model.id`,
  `ai_agent.id`, `ai_thread.id`, `ai_message.id`, and `ai_tool_call.id`.
- Composite FKs ensure `(provider_id, model_id)` pairs are valid.

Existing tables touched:

- No existing table structure changes.
- Existing `user` table is referenced only.
- `packages/db/src/schema.ts` will need to export `ai.schema.ts` in TASK-005, but
  TASK-004 does not modify it.

Backfill requirement:

- None for existing user/payment/credits data.
- TASK-006 must seed at least one provider, one model, and one system agent
  before runtime can rely on fallback model resolution.

Rollback considerations:

- Migration rollback can drop the 9 AI tables if no production chat data must be
  preserved.
- Once production chat data exists, rollback should first disable AI routes/UI,
  export or archive AI data if needed, then drop tables.
- Provider secrets are not stored, so rollback does not involve secret rotation.

Why excluded:

- Memory/RAG tables are v0.3 and not required for first chat persistence.
- MCP credential tables are v0.4 and would expand security scope.
- Credits settlement/cost event tables are v0.5 and would turn audit into billing
  before semantics are stable.
- Tool/skill registry tables are excluded; v0.2 stores only tool call lifecycle
  audit reserve.

### 5.7 Open Questions Handoff

The following unresolved decisions are reflected in
`docs/product/AI_CHAT_V0_2_OPEN_QUESTIONS.md`:

- TASK-005 migration strategy: `db:generate` vs manual SQL vs push.
- Whether TASK-005 creates all 9 tables in one migration.
- Whether ID columns should use existing repo-style `text` ids or Postgres
  `uuid`.
- FK cascade/delete strategy.
- JSON validation ownership and whether DB check constraints are needed.
- Usage retention/partition strategy.
- Partial unique index support for default model constraints.

## 6. Completion Criteria For TASK-004

- This file contains concrete table designs for all 9 required tables.
- Every field has a type, nullability, default strategy, and ownership note.
- Indexes and foreign keys are explicit.
- Migration impact is explicit.
- v0.1 contracts mapping is explicit.
- AI SDK / assistant-ui compatibility notes are documented where relevant.
- Open questions are updated.
- No schema/migration/source files are created.
