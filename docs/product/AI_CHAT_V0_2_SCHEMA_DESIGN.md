# AI Chat v0.2 Schema Design

本文件是 TASK-004 的固定输出文件。当前状态是 schema design workspace，
不是已确认 schema、不是 migration plan、也不是实现授权。

## 1. 状态

状态：待 TASK-004 填写并等待用户确认。

当前限制：

- 不创建 `packages/db/src/ai.schema.ts`。
- 不修改 `packages/db/src/schema.ts`。
- 不生成 migration。
- 不运行 `db:generate`、`db:migrate`、`db:push`。
- 不把 schema design 写入 `AI_CHAT_V0_2_DEPENDENCY_RESEARCH.md`。

## 2. TASK-004 目标

TASK-004 必须基于 v0.1 minimal AI data model freeze，设计 v0.2 minimal chat
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

## 3. 必须读取

执行 TASK-004 前必须读取：

- `AGENTS.md`
- `packages/AGENTS.md`
- `packages/db/AGENTS.md`
- `packages/ai/AGENTS.md`
- `docs/product/AI_CHAT_V0_2_SCOPE_FREEZE.md`
- `docs/product/AI_CHAT_V0_2_ACCEPTANCE.md`
- `docs/product/AI_CHAT_V0_2_IMPLEMENTATION_PLAN.md`
- `docs/product/AI_CHAT_V0_2_OPEN_QUESTIONS.md`
- `docs/product/AI_CONTRACTS_FOUNDATION_SCOPE_FREEZE.md`
- `docs/product/AI_CONTRACTS_FOUNDATION_ACCEPTANCE.md`
- `docs/architecture/AI_AGENT_INFRASTRUCTURE_BOUNDARIES.md`
- `docs/architecture/AI_RUNTIME_LAYERING.md`
- `docs/architecture/AELOKIT_PACKAGE_BOUNDARIES.md`

## 4. External Docs Gate

如果 schema design 涉及 assistant-ui / Vercel AI SDK message shape、
message parts、tool calls、stream finish metadata、usage metadata 或 persistence
兼容性，必须先查官方最新文档，并在本文件记录：

- 阅读的官方文档 URL。
- 使用的版本。
- 采用的 API / message shape。
- 是否存在 v4/v5/v6 差异。
- 对 schema 字段、JSON shape、索引或 nullable 策略的影响。
- 未确认风险。

## 5. 输出模板

TASK-004 填写时必须使用下列结构。

### 5.1 Design Summary

- Scope:
- Non-goals:
- Confirmed assumptions:
- Open risks:

### 5.2 Table Designs

每张表必须包含：

- Purpose.
- Fields: name, type, nullable, default, enum/check strategy.
- Primary key.
- Foreign keys.
- Indexes.
- Unique constraints.
- Status/lifecycle fields.
- JSON fields and validation ownership.
- Mapping to `packages/ai` v0.1 contracts.
- Mapping to assistant-ui / AI SDK message shape, if relevant.
- Migration impact.

### 5.3 Required Table Checklist

| Table | Status | Notes |
| --- | --- | --- |
| `ai_provider` | 待设计 | Provider metadata only; no secrets. |
| `ai_model` | 待设计 | Model metadata, defaults, pricing reference. |
| `ai_user_model_setting` | 待设计 | User default model reference. |
| `ai_agent` | 待设计 | System/default agent metadata. |
| `ai_thread` | 待设计 | Chat/thread owner and model selection. |
| `ai_message` | 待设计 | User/assistant/system/tool message envelope. |
| `ai_message_part` | 待设计 | Ordered message parts compatible with AI SDK UI messages. |
| `ai_tool_call` | 待设计 | Tool call lifecycle reserve, no full MCP. |
| `ai_usage` | 待设计 | Usage audit only, no credits mutation. |

### 5.4 Model Fallback Mapping

Must document the fallback order:

1. per-chat/per-thread model.
2. user default model.
3. system default model.

### 5.5 Usage / Credits Boundary

Must document:

- `ai_usage` is audit-only in v0.2.
- No `@repo/credits` call.
- No ledger mutation.
- No quota enforcement.
- No billing settlement.
- Required fields for provider/model/tokens/cost estimate/status/failure reason.

### 5.6 Migration Impact

Must document:

- New tables.
- New indexes.
- New foreign keys.
- Existing tables touched, if any.
- Backfill requirement, if any.
- Rollback considerations.
- Why memory/RAG/MCP/credits settlement tables are excluded.

### 5.7 Open Questions Handoff

Any unresolved decision must also be reflected in
`docs/product/AI_CHAT_V0_2_OPEN_QUESTIONS.md`.

## 6. Completion Criteria For TASK-004

TASK-004 is complete only when:

- This file contains concrete table designs for all 9 required tables.
- Every field has a type, nullability, default strategy, and ownership note.
- Indexes and foreign keys are explicit.
- Migration impact is explicit.
- v0.1 contracts mapping is explicit.
- AI SDK / assistant-ui compatibility notes are documented where relevant.
- Open questions are updated.
- No schema/migration/source files are created.

