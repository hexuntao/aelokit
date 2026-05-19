# AI Mastra Memory Knowledge v0.3 Open Questions

本文档记录 v0.3 开发前必须确认的问题。未确认问题不得写成已确认事实。

## Q001: v0.3 是否安装 Mastra runtime？

- Status: defaulted
- Default Decision: 安装，但必须由 TASK-002 输出 exact package list，TASK-003 再安装。
- Reason: v0.3 是 Mastra-first；当前 `apps/web/package.json` 未包含 Mastra runtime package。
- Blocks: TASK-003、TASK-004、TASK-005、TASK-007、TASK-008
- Needs User Confirmation Before: exact Mastra packages、修改 package manifest 或 lockfile。

## Q002: Mastra runtime 放在 `apps/web/src/ai/mastra/**` 还是未来 `apps/worker`？

- Status: defaulted
- Default Decision: v0.3 先放 `apps/web/src/ai/mastra/**`，未来 worker 只作为 v0.6+ 评估。
- Reason: v0.3 目标是增强现有 `/api/ai/chat`，当前禁止创建 worker/gateway/studio。
- Blocks: TASK-004
- Needs User Confirmation Before: 创建未来 app 或后台 worker indexing。

## Q003: v0.3 是否先 in-process？

- Status: defaulted
- Default Decision: 先 in-process，不创建 worker。
- Reason: 当前最小闭环是 `/api/ai/chat` memory/retrieval context，不是 long-running indexing platform。
- Blocks: TASK-004、TASK-005、TASK-008
- Needs User Confirmation Before: 引入 worker、queue、long-running workflow。

## Q004: 使用哪些 Mastra packages？

- Status: open
- Default Decision: TASK-002 依据最新官方文档确认，预计至少包含 core/runtime、memory/storage、RAG/document、vector/pg 相关包。
- Reason: Mastra package names and integration APIs must not be guessed.
- Blocks: TASK-003
- Needs User Confirmation Before: 安装依赖。

## Q005: 是否使用 Mastra PostgreSQL Storage？

- Status: defaulted
- Default Decision: 优先使用 Mastra PostgreSQL Storage。
- Reason: AeloKit 已有 PostgreSQL；Mastra 官方提供 PostgreSQL storage。
- Blocks: TASK-002、TASK-005
- Needs User Confirmation Before: storage 表/schema 策略或 DB 权限变更。

## Q006: 是否使用 PgVector？

- Status: defaulted
- Default Decision: 优先使用 PgVector，前提是当前 PostgreSQL 环境支持 `vector` extension。
- Reason: AeloKit 已使用 PostgreSQL，PgVector 可减少额外基础设施。
- Blocks: TASK-002、TASK-007、TASK-008
- Needs User Confirmation Before: 启用 extension、生成 migration、修改 DB provision。

## Q007: 是否需要单独 vector DB？

- Status: defaulted
- Default Decision: v0.3 不引入单独 vector DB。
- Reason: v0.3 是最小闭环，不应增加独立 infra。
- Blocks: TASK-002
- Needs User Confirmation Before: 新增外部 vector DB provider 或 env。

## Q008: 是否使用当前 OpenAI-compatible relay 做 embedding？

- Status: defaulted
- Default Decision: 先检测当前 OpenAI-compatible relay 是否支持 embeddings endpoint。
- Reason: 当前 v0.2 已支持 OpenAI official endpoint 和 OpenAI-compatible relay baseURL，但 chat 可用不代表 embedding 可用。
- Blocks: TASK-002、TASK-007
- Needs User Confirmation Before: 默认 embedding provider/model/env。

## Q009: 如果 relay 不支持 embedding，fallback 是什么？

- Status: defaulted
- Default Decision: 如果 relay 不支持 embedding，则 fallback 到官方 OpenAI embeddings；如果没有官方 OpenAI key，则 Knowledge ingestion 标记为 blocked，不影响 Memory 先做。
- Reason: Knowledge ingestion 需要 embedding；不能在 relay 不支持时静默失败。
- Blocks: TASK-007
- Needs User Confirmation Before: 新增 embedding provider key/env 或 provider dependency。

## Q010: 是否需要新增 embedding model env？

- Status: defaulted
- Default Decision: 需要预留 server-only embedding env，但具体命名由 TASK-002 根据现有 `@repo/env` 风格确认。候选：
  - `AI_EMBEDDING_PROVIDER`
  - `AI_EMBEDDING_MODEL`
  - `AI_EMBEDDING_BASE_URL`
  - `AI_EMBEDDING_API_KEY`
- Reason: embedding model 可能独立于 chat model。
- Blocks: TASK-003、TASK-007
- Needs User Confirmation Before: 修改 `packages/env/src/server.ts` 和 `env.example`。

## Q011: Memory 是否允许 AI 自动建议？

- Status: defaulted
- Default Decision: 允许 AI 建议 memory，但不能自动保存。
- Reason: v0.3 不做自动隐式长期记忆，不默认保存敏感内容。
- Blocks: TASK-005、TASK-006
- Needs User Confirmation Before: 允许自动保存或 automatic consolidation。

## Q012: Durable memory 是否必须用户确认？

- Status: defaulted
- Default Decision: 必须。
- Reason: 用户同意和隐私控制是 AeloKit-owned product boundary。
- Blocks: TASK-005、TASK-006
- Needs User Confirmation Before: 改成自动保存。

## Q013: Memory 删除是删除 Mastra memory，还是 AeloKit sidecar 状态？

- Status: defaulted
- Default Decision: 用户可见删除必须确保后续不再被 recall；底层优先 hard delete。如果 Mastra API 不支持合适 hard delete，则用 AeloKit sidecar disable/tombstone 状态阻断使用。
- Reason: 需要兼顾用户控制、审计、storage API 和 retention policy。
- Blocks: TASK-006
- Needs User Confirmation Before: hard delete、retention、审计保留策略。需确认 Mastra memory delete API 是否满足用户删除语义。

## Q014: Knowledge source metadata 是否需要 AeloKit 自有表？

- Status: defaulted
- Default Decision: 需要 AeloKit 自有 knowledge source metadata，但只保存 source ownership / visibility / mapping / display metadata，不保存 chunk/vector internals。
- Reason: AeloKit owns source ownership and access policy；Mastra owns chunking/retrieval internals。
- Blocks: TASK-007、TASK-008、TASK-009
- Needs User Confirmation Before: schema/migration。

## Q015: Citation 是否持久化在 AeloKit DB，还是只随 message part 存？

- Status: defaulted
- Default Decision: v0.3 最小方案优先把 citation 存到 `ai_message_part` 的 `source` part 或 message metadata；暂不新增独立 citation 表。
- Reason: v0.2 已支持 `ai_message_part.part_type = 'source'`，可作为最小 provenance path。
- Blocks: TASK-008、TASK-009
- Needs User Confirmation Before: 新增 citation 表或 migration。

## Q016: 是否需要上传文件？

- Status: defaulted
- Default Decision: v0.3 不做文件上传，只做 manual knowledge source。
- Reason: 文件上传、storage lifecycle、worker indexing 属于更大范围。
- Blocks: None for minimal v0.3
- Needs User Confirmation Before: 文件上传、storage UI、document lifecycle。

## Q017: 是否需要 worker indexing？

- Status: defaulted
- Default Decision: v0.3 不需要；先 in-process manual ingestion。
- Reason: worker/gateway/studio split 属于 v0.6+，当前禁止创建。
- Blocks: None for minimal v0.3
- Needs User Confirmation Before: 创建 worker、queue、scheduled indexing。

## Q018: 是否需要 Mastra observability？

- Status: defaulted
- Default Decision: 不接完整 Mastra observability，只保留基本 logs/metadata。
- Reason: observability 是后续运维能力，不能扩大 v0.3。
- Blocks: TASK-010 if debugging requires it
- Needs User Confirmation Before: 新增 observability dependency/service。

## Q019: 是否接 Mastra Agent，还是只先接 Memory/RAG？

- Status: defaulted
- Default Decision: v0.3 先不让 Mastra Agent 主导 chat execution，只使用 Mastra Memory/RAG context 增强现有 AI SDK route。
- Reason: v0.3 目标是 Memory + Knowledge，不是复杂 agent workflow。
- Blocks: TASK-004、TASK-005、TASK-008
- Needs User Confirmation Before: 改为 Mastra Agent 主导 chat execution。

## Q020: 是否继续由 Vercel AI SDK 负责 streaming，Mastra 只提供 memory/retrieval context？

- Status: defaulted
- Default Decision: 是。继续由 Vercel AI SDK + assistant-ui 负责 streaming，Mastra 只提供 memory/retrieval context。
- Reason: v0.2 chat 已完成且稳定；v0.3 不应重写主路径。
- Blocks: TASK-005、TASK-008
- Needs User Confirmation Before: 替换 streaming ownership。

## Q021: Mastra 与当前 assistant-ui transport 的边界如何保持稳定？

- Status: defaulted
- Default Decision: 不改 assistant-ui transport，继续 `AssistantChatTransport({ api: '/api/ai/chat' })`。
- Reason: 当前 UI 已通过 `AssistantChatTransport({ api: '/api/ai/chat' })` 接入。
- Blocks: TASK-005、TASK-008、TASK-009
- Needs User Confirmation Before: 改 transport、创建新 endpoint 或改 message protocol。

## Q022: Mastra AI SDK integration 文档与 AeloKit AI SDK v6 主路径如何对齐？

- Status: defaulted
- Default Decision: 不照搬 Mastra 并行 route 示例；以 AeloKit 当前 `/api/ai/chat` + AI SDK v6 + assistant-ui path 为主，Mastra 作为 context provider。
- Reason: Mastra 官方文档提供 Vercel AI SDK integration，但 AeloKit 已有 v0.2 `streamText().toUIMessageStreamResponse()` 路径。
- Blocks: TASK-002、TASK-004、TASK-005、TASK-008
- Needs User Confirmation Before: 把 Mastra route conversion 变成主 streaming path。
