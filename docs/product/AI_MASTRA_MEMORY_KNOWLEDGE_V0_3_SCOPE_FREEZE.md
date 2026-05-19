# AI Mastra Memory Knowledge v0.3 Scope Freeze

本文档冻结 AeloKit v0.3：Mastra-first Memory + Knowledge Integration 的范围。

状态：Planning only，等待 review 和 open questions 确认后才允许进入单个 TASK 实现。

## 1. v0.3 核心原则

v0.3 的目标是把 Mastra-owned Memory 和 Knowledge/RAG 能力接入现有 `POST /api/ai/chat` 主路径。

v0.3 不自研完整 memory engine，不自研完整 RAG pipeline，不自研 vector abstraction，不自研 reranker，不自研 workflow engine。

AeloKit 只负责产品边界、权限、同意、UI、来源归属、引用展示、usage audit、v0.2 persistence 和 future credits boundary。

## 2. Mastra owns

Mastra owns:

- memory runtime
- threads/resources
- conversation history
- working memory
- semantic recall
- memory processors
- memory storage adapter usage
- document chunking
- embedding
- vector retrieval
- rerank / RAG pipeline
- future agent/workflow/tool orchestration

实现任务必须优先复用 Mastra 官方能力。如果某一步需要 AeloKit 自建 runtime engine，默认视为 scope conflict，必须先进入 Open Questions。

## 3. AeloKit owns

AeloKit owns:

- auth/session/user identity
- route access control
- user consent
- memory enable/disable policy
- knowledge source ownership metadata
- source visibility/access policy
- UI entry and display
- citation/source rendering
- usage audit
- v0.2 thread/message/message_part persistence
- future credits boundary

AeloKit 可以保存必要的 product metadata、consent、enable/disable、ownership、mapping 和 citation rendering metadata。AeloKit 不复制 Mastra memory internals、chunk internals、embedding internals、vector index internals 或 rerank internals。

## 4. Current Baseline

v0.3 以当前 v0.2 chat 为主路径基线：

- Route：`apps/web/src/app/api/ai/chat/route.ts`
- Runtime：`apps/web/src/ai/**`
- UI：`apps/web/src/components/ai/**`
- DB：`packages/db/src/ai.schema.ts`
- Contracts：`packages/ai/src/memory/**`、`packages/ai/src/knowledge/**`、`packages/ai/src/adapters/mastra/**`

后续 TASK 必须增强这些真实路径，不能创建并行 `/api/chat`，不能把 Mastra runtime 放进 `packages/ai`。

## 5. Memory 最小范围

v0.3 memory 只做最小闭环：

- 用户可以启用/禁用 memory。
- 用户可以手动创建或确认保存一条 durable memory。
- 用户可以删除/禁用 memory。
- `/api/ai/chat` 可以通过 Mastra memory 使用可用 memory/context。
- UI 或 response metadata 能证明 memory 被使用。
- 不自动私自保存敏感内容。
- 不做复杂 automatic memory consolidation。
- 不做完整 admin memory audit。

必须明确：

- 如果 Mastra Memory 自带 storage，需要判断是否直接使用。
- AeloKit 只保存必要 metadata、consent、enable-disable、ownership、mapping。
- 不复制 Mastra memory internals。
- Durable memory 默认需要用户确认。
- 删除/禁用行为必须区分 Mastra-side deletion 和 AeloKit-side disable/mapping state。
- 管理员默认不读取用户原始私密 memory 内容。

## 6. Knowledge 最小范围

v0.3 knowledge 只做最小闭环：

- 用户可以创建 minimal manual knowledge source。
- 使用 Mastra RAG、`MDocument` 或官方推荐方式 chunk。
- 使用 embedding + vector store 做 retrieval。
- `/api/ai/chat` 可以检索相关 chunk。
- AI response 可以展示 citation/source。
- AeloKit 只保存 source ownership metadata、citation rendering metadata、mapping。
- 不做完整文件上传系统。
- 不做复杂知识库后台。
- 不做 worker indexing。
- 不做 full document lifecycle。

Knowledge 必须保持 provenance：

- source id
- source title
- source URI 或 storage reference
- chunk/document reference
- retrieval score/rank if available
- citation metadata that UI can render

如果 citation 只通过 AI SDK message part 持久化，必须能从 `ai_message_part` 验证 provenance 没有丢失。

## 7. Dependency Gate

v0.3 不默认授权安装依赖。

任何 Mastra package、storage package、vector package、embedding package 或 provider package 变更必须先由 TASK-002 输出 dependency/runtime placement plan，并等待用户确认。

未经确认，禁止修改：

- `apps/web/package.json`
- root `package.json`
- `pnpm-lock.yaml`
- `packages/ai/package.json`
- `packages/db/package.json`

## 8. Env Gate

如果 v0.3 需要新增 embedding model env、Mastra storage env、vector DB env 或 provider env，必须：

- 使用 `@repo/env/server`。
- 同步更新 `packages/env/src/server.ts`。
- 同步更新 `env.example`。
- 运行 `pnpm check:env`。
- 确认没有 client component import server env。

未经确认，不允许修改 `.env` 或真实 secret。

## 9. Schema / Migration Gate

v0.3 不默认授权 schema 或 migration。

如果需要 AeloKit-owned metadata tables，只允许保存：

- memory consent state
- memory enable/disable policy state
- memory ownership/mapping state
- knowledge source ownership metadata
- knowledge source visibility/access policy
- citation/source rendering metadata
- v0.2 thread/message/message_part 与 Mastra resources 的 mapping

禁止保存：

- Mastra memory internals mirror
- self-built chunk table as complete RAG engine
- self-built embedding/vector abstraction
- reranker internals
- workflow engine state
- MCP credential/server/tool tables
- credits charging/settlement tables

任何 schema/migration 都必须单独确认，不能在 dependency/runtime/UI TASK 中顺手完成。

## 10. v0.3 非目标

v0.3 明确不做：

- 不接 credits charging。
- 不接 MCP。
- 不做 full tool registry。
- 不做 worker/gateway/studio。
- 不做 full admin audit。
- 不做 team/workspace policy。
- 不做 BYOK。
- 不做 local stdio MCP。
- 不做复杂 agent workflow。
- 不做自动隐式长期记忆。
- 不默认保存敏感内容。
- 不默认让管理员读取用户原始私密内容。
- 不破坏 `/api/ai/chat`。
- 不创建 `/api/chat`。
- 不绕过 v0.2 usage audit。
- 不新增未经确认的依赖。
- 不把 Mastra runtime 放进 `packages/ai`。
- 不提前抽 `packages/design-system`。
- 不把业务组件迁移出 `apps/web/src/components/ai`。

## 11. Completion Boundary

v0.3 完成时只能说明：

- Memory 最小闭环通过。
- Knowledge 最小闭环通过。
- Citations/source rendering 可见。
- `POST /api/ai/chat` 仍是唯一 chat stream route。
- v0.2 persistence 和 usage audit 继续工作。
- credits ledger 无变化。

v0.3 完成不能声明：

- 完整长期记忆系统完成。
- 完整知识库后台完成。
- 完整文件上传/indexing lifecycle 完成。
- 完整 agent workflow 平台完成。
- MCP/tools/credits/admin audit 已完成。
