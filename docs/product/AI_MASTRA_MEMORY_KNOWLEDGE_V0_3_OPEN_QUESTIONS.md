# AI Mastra Memory Knowledge v0.3 Open Questions

本文档记录 v0.3 开发前必须确认的问题。未确认问题不得写成已确认事实。

最后更新：2026-05-19（TASK-010 验收后批量更新状态）

## Q001: v0.3 是否安装 Mastra runtime？

- Status: confirmed
- Decision: 已安装 `@mastra/core` ^1.35.0、`@mastra/memory` ^1.18.2、`@mastra/pg` ^1.11.0、`@mastra/rag` ^2.2.1。
- Reason: v0.3 是 Mastra-first；TASK-003 已完成安装。
- Blocks: None (resolved)

## Q002: Mastra runtime 放在 `apps/web/src/ai/mastra/**` 还是未来 `apps/worker`？

- Status: confirmed
- Decision: v0.3 放在 `apps/web/src/ai/mastra/**`，包含 `config.ts`、`instance.ts`、`memory.ts`、`storage.ts`。
- Reason: v0.3 目标是增强现有 `/api/ai/chat`，worker 只作为 v0.6+ 评估。
- Blocks: None (resolved)

## Q003: v0.3 是否先 in-process？

- Status: confirmed
- Decision: in-process，不创建 worker。
- Reason: 当前最小闭环是 `/api/ai/chat` memory/retrieval context，不是 long-running indexing platform。
- Blocks: None (resolved)

## Q004: 使用哪些 Mastra packages？

- Status: confirmed
- Decision: `@mastra/core` ^1.35.0、`@mastra/memory` ^1.18.2、`@mastra/pg` ^1.11.0、`@mastra/rag` ^2.2.1。注意 `@mastra/rag` 已安装但未在主路径使用。
- Reason: TASK-002 依据官方文档确认包名，TASK-003 完成安装。
- Blocks: None (resolved)

## Q005: 是否使用 Mastra PostgreSQL Storage？

- Status: confirmed
- Decision: 使用 Mastra PostgreSQL Storage，独立 `mastra` schema。
- Reason: AeloKit 已有 PostgreSQL；Mastra 官方提供 PostgreSQL storage。Storage 使用 `PostgresStore`，Mastra auto-init 创建 `mastra.mastra_threads` 和 `mastra.mastra_messages`。
- Blocks: None (resolved)

## Q006: 是否使用 PgVector？

- Status: partial
- Decision: `vector.ts` 配置了 `PgVector`（index: `aelokit_knowledge_embeddings`，dimension: 1536），但 ingestion 流程中实际使用 Orama in-memory vector store。需要确认实际运行时走哪条路径。
- Reason: AeloKit 已使用 PostgreSQL，PgVector 可减少额外基础设施。但当前实现存在两条路径未统一。
- Blocks: None for current v0.3 scope
- Needs Resolution Before: 生产部署或向量持久化需求

## Q007: 是否需要单独 vector DB？

- Status: confirmed
- Decision: v0.3 不引入单独 vector DB。
- Reason: v0.3 是最小闭环，不应增加独立 infra。
- Blocks: None (resolved)

## Q008: 是否使用当前 OpenAI-compatible relay 做 embedding？

- Status: confirmed
- Decision: 支持 `AI_EMBEDDING_BASE_URL` 和 `AI_EMBEDDING_API_KEY`，fallback 到 `OPENAI_API_KEY`。
- Reason: 允许用户使用 relay 或直连 OpenAI 做 embedding。
- Blocks: None (resolved)

## Q009: 如果 relay 不支持 embedding，fallback 是什么？

- Status: confirmed
- Decision: fallback 到官方 OpenAI embeddings；如果没有官方 OpenAI key，则 Knowledge ingestion 标记为 blocked，不影响 Memory 先做。
- Reason: Knowledge ingestion 需要 embedding；`isEmbeddingProviderConfigured()` 在无配置时返回 false，knowledge 功能自动禁用。
- Blocks: None (resolved)

## Q010: 是否需要新增 embedding model env？

- Status: confirmed
- Decision: 已添加 `AI_EMBEDDING_PROVIDER`（default: `openai`）、`AI_EMBEDDING_MODEL`（default: `text-embedding-3-small`）、`AI_EMBEDDING_BASE_URL`（optional）、`AI_EMBEDDING_API_KEY`（optional, fallback to `OPENAI_API_KEY`）。
- Reason: embedding model 独立于 chat model，已同步更新 `packages/env/src/server.ts` 和 `env.example`。
- Blocks: None (resolved)

## Q011: Memory 是否允许 AI 自动建议？

- Status: deferred
- Decision: v0.3 不实现 AI 自动建议 memory。允许后续版本评估。
- Reason: v0.3 不做自动隐式长期记忆，不默认保存敏感内容。当前无自动建议 UI 或 API。
- Blocks: None for v0.3 scope

## Q012: Durable memory 是否必须用户确认？

- Status: confirmed
- Decision: 必须。`confirmUserMemoryAction` 存在，需显式确认。
- Reason: 用户同意和隐私控制是 AeloKit-owned product boundary。
- Blocks: None (resolved)

## Q013: Memory 删除是删除 Mastra memory，还是 AeloKit sidecar 状态？

- Status: partial
- Decision: 当前通过 Mastra thread metadata 跟踪 `confirmed`/`disabled` 状态，而非 AeloKit 自有表。`deleteUserMemoryAction` 执行 hard delete，`disableUserMemoryAction` 设置 metadata disabled。未建 AeloKit sidecar disable/tombstone 自有表。
- Reason: Mastra Memory API 支持 delete 和 metadata 更新，当前实现直接操作 Mastra 层。需要评估是否需要 AeloKit 自有表来支持审计保留和 hard delete 后的 tombstone。
- Blocks: None for current v0.3 scope
- Needs Resolution Before: 生产审计需求或 Mastra delete API 不满足场景

## Q014: Knowledge source metadata 是否需要 AeloKit 自有表？

- Status: partial
- Decision: `knowledge.schema.ts` 已创建 4 张表（`knowledge_source`、`knowledge_document`、`knowledge_chunk`、`knowledge_source_access`），但 ingestion 服务未完全 wired 到这些表。当前使用 in-memory Map tracking。
- Reason: AeloKit owns source ownership and access policy；schema 已设计但 runtime wiring 存在 gap。
- Blocks: None for current v0.3 scope
- Needs Resolution Before: 生产部署（向量持久化和 source metadata 持久化）

## Q015: Citation 是否持久化在 AeloKit DB，还是只随 message part 存？

- Status: confirmed
- Decision: v0.3 采用 response-only 方案。Citations 通过 `x-ai-knowledge-citations` response header 和 `messageMetadata` finish part 传递，不持久化到 `ai_message_part`。`SOURCE_CITATION_METADATA_SHAPE` 文档声明 `persistence.mode: 'response-only'`。
- Reason: v0.3 最小方案，减少 schema/migration 复杂度。历史消息中的 citations 不会在重新加载后可见。
- Blocks: None for v0.3 scope
- Needs Resolution Before: 需要历史消息保留 citations 的场景

## Q016: 是否需要上传文件？

- Status: confirmed
- Decision: v0.3 不做文件上传，只做 manual knowledge source。
- Reason: 文件上传、storage lifecycle、worker indexing 属于更大范围。
- Blocks: None (resolved for v0.3)

## Q017: 是否需要 worker indexing？

- Status: confirmed
- Decision: v0.3 不需要；先 in-process manual ingestion。
- Reason: worker/gateway/studio split 属于 v0.6+，当前禁止创建。
- Blocks: None (resolved for v0.3)

## Q018: 是否需要 Mastra observability？

- Status: confirmed
- Decision: 不接完整 Mastra observability，只保留基本 logs/metadata。
- Reason: observability 是后续运维能力，不能扩大 v0.3。
- Blocks: None (resolved)

## Q019: 是否接 Mastra Agent，还是只先接 Memory/RAG？

- Status: confirmed
- Decision: v0.3 不让 Mastra Agent 主导 chat execution，只使用 Mastra Memory/RAG context 增强现有 AI SDK route。
- Reason: v0.3 目标是 Memory + Knowledge，不是复杂 agent workflow。
- Blocks: None (resolved)

## Q020: 是否继续由 Vercel AI SDK 负责 streaming，Mastra 只提供 memory/retrieval context？

- Status: confirmed
- Decision: 是。继续由 Vercel AI SDK + assistant-ui 负责 streaming，Mastra 只提供 memory/retrieval context。
- Reason: v0.2 chat 已完成且稳定；v0.3 不应重写主路径。`streamText().toUIMessageStreamResponse()` 未被替换。
- Blocks: None (resolved)

## Q021: Mastra 与当前 assistant-ui transport 的边界如何保持稳定？

- Status: confirmed
- Decision: 不改 assistant-ui transport，继续 `AssistantChatTransport({ api: '/api/ai/chat' })`。
- Reason: 当前 UI 仍通过 `AssistantChatTransport({ api: '/api/ai/chat' })` 接入，Mastra 只在 server-side 提供上下文。
- Blocks: None (resolved)

## Q022: Mastra AI SDK integration 文档与 AeloKit AI SDK v6 主路径如何对齐？

- Status: confirmed
- Decision: 不照搬 Mastra 并行 route 示例；以 AeloKit 当前 `/api/ai/chat` + AI SDK v6 + assistant-ui path 为主，Mastra 作为 context provider。
- Reason: Mastra 官方文档提供 Vercel AI SDK integration，但 AeloKit 已有 v0.2 `streamText().toUIMessageStreamResponse()` 路径。Mastra memory/retrieval 只在 route handler 内注入上下文，不接管 streaming。
- Blocks: None (resolved)
