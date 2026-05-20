# v0.4 Official Docs Research

日期：2026-05-20

本文件只记录和 v0.4 planning 相关的官方文档结论。它不是 v0.5-v0.8 roadmap，不授权实现真实 MCP、Assistant Cloud、migration、依赖变更或 runtime 改写。

## 1. Research Scope

本轮按用户要求优先查询官方文档，并围绕已确认的 v0.4 方向收敛结论：

- AI Stack Decision Record。
- Runtime Boundary Hardening。
- assistant-ui runtime / transport / message metadata。
- Vercel AI SDK streaming / `UIMessage` / metadata / tool calling boundary。
- Mastra memory / storage / RAG / tools / MCP / eval 的边界判断。
- Citation persistence design。
- Runtime smoke / DB/vector verification。

## 2. Queried Official Sources

### Mastra

用户要求的以下入口在当前站点上多数已变为 404 或目录入口，实际内容从官方 docs 导航解析到对应 overview 页面：

| requested URL | resolved official page used |
| --- | --- |
| `https://mastra.ai/docs` | `https://mastra.ai/docs` |
| `https://mastra.ai/docs/agents` | `https://mastra.ai/docs/agents/overview` |
| `https://mastra.ai/docs/workflows` | `https://mastra.ai/docs/workflows/overview` |
| `https://mastra.ai/docs/tools` | `https://mastra.ai/docs/agents/using-tools` |
| `https://mastra.ai/docs/memory` | `https://mastra.ai/docs/memory/overview` |
| `https://mastra.ai/docs/mcp` | `https://mastra.ai/docs/mcp/overview` |
| `https://mastra.ai/docs/evals` | `https://mastra.ai/docs/evals/overview` |
| `https://mastra.ai/docs/deployment` | `https://mastra.ai/docs/deployment/overview` |

Additional Mastra pages used for v0.4 verification design:

- `https://mastra.ai/docs/memory/storage`
- `https://mastra.ai/docs/rag/overview`
- `https://mastra.ai/docs/rag/vector-databases`
- `https://mastra.ai/docs/rag/retrieval`

### assistant-ui

| requested URL | resolved official page used |
| --- | --- |
| `https://www.assistant-ui.com/docs` | `https://www.assistant-ui.com/docs` |
| `https://www.assistant-ui.com/docs/architecture` | `https://www.assistant-ui.com/docs/architecture` |
| `https://www.assistant-ui.com/docs/runtimes` | 404; used `https://www.assistant-ui.com/docs/runtimes/pick-a-runtime` and runtime pages |
| `https://www.assistant-ui.com/docs/runtimes/concepts/architecture` | `https://www.assistant-ui.com/docs/runtimes/concepts/architecture` |
| `https://www.assistant-ui.com/docs/components` | 404; used `https://www.assistant-ui.com/docs/ui/thread` and primitives/components pages |
| `https://www.assistant-ui.com/docs/guides` | `https://www.assistant-ui.com/docs/guides` |

Additional assistant-ui pages used:

- `https://www.assistant-ui.com/docs/runtimes/ai-sdk/overview`
- `https://www.assistant-ui.com/docs/runtimes/ai-sdk/v6`
- `https://www.assistant-ui.com/docs/primitives`
- `https://www.assistant-ui.com/docs/primitives/thread`
- `https://www.assistant-ui.com/docs/primitives/message`

### Vercel AI SDK

Required entry:

- `https://ai-sdk.dev/docs` resolved to `https://ai-sdk.dev/docs/introduction`

Additional official AI SDK pages used:

- `https://ai-sdk.dev/docs/ai-sdk-ui/overview`
- `https://ai-sdk.dev/docs/ai-sdk-ui/chatbot`
- `https://ai-sdk.dev/docs/ai-sdk-ui/message-metadata`
- `https://ai-sdk.dev/docs/ai-sdk-ui/streaming-data`
- `https://ai-sdk.dev/docs/ai-sdk-ui/stream-protocol`
- `https://ai-sdk.dev/docs/ai-sdk-ui/chatbot-tool-usage`
- `https://ai-sdk.dev/docs/reference/ai-sdk-core/ui-message`
- `https://ai-sdk.dev/docs/ai-sdk-core/tools-and-tool-calling`

## 3. Stack Conclusions for v0.4

### assistant-ui

- assistant-ui 官方架构把系统分为 components、runtime、Assistant Cloud 三个支柱。AeloKit v0.4 应继续使用 components + runtime，并明确不默认启用 Assistant Cloud。
- 当前 AeloKit 使用 `@assistant-ui/react-ai-sdk`，和官方建议的新项目组合一致：AI SDK v6 + `@ai-sdk/react` v3 + `@assistant-ui/react-ai-sdk` latest line。
- `useChatRuntime` 是 assistant-ui 的推荐 AI SDK runtime 封装。AeloKit 当前使用 `AssistantChatTransport({ api: '/api/ai/chat' })` 的方向是合理的，因为它保留 assistant-ui 对 system messages 和 frontend tools 的默认转发行为。
- 如果后续 runtime 不继承 `AssistantChatTransport`，就必须显式承担 system message、frontend tool forwarding、headers、body、error/cancel handling 的边界；v0.4 不应默认切到自定义 transport。
- assistant-ui primitives/components 适合 UI rendering、thread/composer/message/action states，不应承担 provider SDK、DB schema、credits ledger、auth session 或 Mastra runtime。
- assistant-ui 文档包含 `Unstable_` composer trigger primitives 和实验性 message timing 等能力。v0.4 不使用 unstable API；如必须使用，必须单独写 blocker 并等待人工确认。

### Vercel AI SDK

- AI SDK 当前官方文档是 v6 latest；AeloKit 当前 `ai@^6`, `@ai-sdk/react@^3`, `@ai-sdk/openai@^3` 与官方 v6 方向一致。
- `UIMessage` 是 UI 层完整 message state，包含 metadata、data parts 和 tools typing；`ModelMessage` 才是发给模型的上下文。v0.4 应把 `UIMessage` 作为 stream/UI contract，而不是把 route persistence shape 直接暴露给 UI。
- `messageMetadata` 适合 message-level 信息，例如 `threadId`, `messageId`, model, usage, finish metadata。动态引用、工具状态、source/document/file 更适合 source parts 或 data parts。
- AI SDK data stream protocol 基于 SSE，支持 text、reasoning、source-url、source-document、file、data-*、tool input/output、step parts。v0.4 citation persistence design 应优先评估 source parts / data parts 与现有 `ai_message_part.partType='source'` 的兼容性。
- `TextStreamChatTransport` 会丢失 tool calls、usage 和 finish reason，不适合作为 AeloKit v0.4 的 chat transport。
- AI SDK tool calling 默认会执行带 `execute` 的 server-side tools；敏感工具可以使用 approval flow。v0.4 不实现真实工具执行，但 boundary hardening 必须把 future tool execution 默认设为 permissioned / approval-aware。
- `activeTools` 可用于限制一次模型调用可见的工具集。v0.4 的工具边界设计应把 allowed tool set 视为 request/session policy 的结果，而不是 client 任意传入后直接信任。

### Mastra

- Mastra agents 适合开放式任务；workflows 适合步骤已知、控制流明确的任务。AeloKit v0.4 不应把所有 chat 强制迁入 Mastra Agent；薄 chat 继续使用 AI SDK direct stream 是合理边界。
- Mastra tools 使用 schema + execute 结构，也支持把 agents/workflows 作为 tools 暴露。v0.4 不启用真实外部工具执行，但 contracts 必须预留 tool identity、input/output schema、permission、audit 和 safe display shape。
- Mastra tools 文档强调 `transform` 可把 raw payload 转成 display/transcript 安全形态。v0.4 的 runtime boundary hardening 应把 browser-facing tool/citation payload 视为经过 redaction/transform 的显示数据，而不是 raw tool result。
- Mastra memory 依赖 storage provider，并使用 `resource` 与 `thread` 标识 owner 和 conversation scope。当前 AeloKit 的 `ai_memory_draft` sidecar + confirmed-only recall 与官方 owner/thread 语义兼容。
- Mastra storage 可在 instance-level 或 agent-level 配置；semantic recall 需要 vector database。AeloKit v0.4 应继续把 Mastra storage/vector wiring 放在 `apps/web/src/ai`，不放入 `packages/ai`。
- Mastra RAG 提供 document chunking、embedding、vector store、retrieval。PgVector index dimension 必须匹配 embedding model，且 index dimension 不能原地更改。AeloKit v0.4 smoke/vector plan 必须验证 `vector` extension、`aelokit_knowledge_embeddings` index、embedding dimension 与 actual provider model。
- Mastra MCP 支持 remote MCP server 和 registry discovery，并要求 MCP URLs / tokens 按 secret 处理。v0.4 不接真实 third-party MCP、不默认 local stdio MCP；只允许 contracts/design/local mock 或安全边界文档。
- Mastra deployment 支持独立 Mastra server、web framework integration、cloud/platform。v0.4 不创建 worker/gateway/studio split，也不默认启用 Mastra platform。
- Mastra evals/scorers可用于非确定性 AI 输出评价，但需要 `@mastra/evals`。v0.4 不新增 eval dependency；可以在设计中记录未来 eval boundary。

## 4. v0.4 Planning Decisions Derived from Docs

- Stack baseline: assistant-ui + Vercel AI SDK v6 remains the chat UI/streaming path; Mastra remains app-local deeper runtime for memory/knowledge and future agent/workflow/tool/MCP orchestration.
- Route baseline: `POST /api/ai/chat` remains the only AI chat stream route. Do not create `/api/chat`.
- Runtime boundary: `apps/web/src/ai` owns provider/Mastra/runtime wiring; `packages/ai` owns contracts/runtime-types only; `packages/db` owns schema/migration; `apps/web/src/components/ai` owns UI only.
- Citation design: v0.4 must design replayable citation persistence. The preferred no-migration direction to evaluate is AI SDK source/data parts persisted through existing `ai_message_part` support. A dedicated citation table remains a future migration option requiring separate confirmation.
- Tool/MCP design: official docs prove the capabilities exist, but capability existence does not make them v0.4 scope. Real third-party MCP, local stdio MCP, and arbitrary tool execution remain non-goals.
- Smoke/vector acceptance: v0.4 implementation acceptance must include authenticated browser smoke and DB/vector verification; static checks alone cannot mark runtime smoke PASS.

## 5. Unstable / Not Adopted

The following official capabilities are explicitly not adopted by v0.4 default scope:

- assistant-ui `Unstable_` primitives.
- assistant-ui Assistant Cloud persistence.
- assistant-ui MCP app templates as implementation scope.
- AI SDK experimental / RSC generative UI paths.
- Mastra alpha/deprecated features such as Signals Alpha and deprecated Networks.
- Mastra platform/server deployment as a new app split.
- Real remote MCP registry/provider integrations.
- Local stdio MCP.
- New eval dependency or CI integration.

## 6. Conflicts and Open Questions

No official-document conflict requires blocking v0.4 planning. The official docs confirm that current top-level docs URLs may redirect or 404 into more specific overview pages; this is a docs URL drift, not a product-scope blocker.

Internal repo doc conflicts were found during required reading and are recorded in `docs/product/v0.4/OPEN_QUESTIONS.md`:

- `packages/AGENTS.md` still describes `packages/ai` as future planning even though current repo contains `packages/ai`.
- `apps/web/AGENTS.md` still has v0.2 current-task wording even though v0.3 is accepted with notes.
