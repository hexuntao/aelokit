# AI Mastra Memory Knowledge v0.3 Entry Point

本文档是 AeloKit v0.3：Mastra-first Memory + Knowledge Integration 的唯一执行入口。

状态：Planning only。

v0.3 不能直接开始开发。任何实现前必须先 review：

1. `docs/product/AI_MASTRA_MEMORY_KNOWLEDGE_V0_3_SCOPE_FREEZE.md`
2. `docs/product/AI_MASTRA_MEMORY_KNOWLEDGE_V0_3_OPEN_QUESTIONS.md`
3. `docs/product/AI_MASTRA_MEMORY_KNOWLEDGE_V0_3_ACCEPTANCE.md`
4. `docs/product/AI_MASTRA_MEMORY_KNOWLEDGE_V0_3_TASKS.md`

如果 review 后存在 open question 影响依赖、schema、migration、runtime placement、vector storage、embedding provider、user consent 或 `/api/ai/chat` 主路径，必须先暂停并等待用户确认。

## 1. v0.3 唯一入口

后续所有 v0.3 工作都必须从本文档进入。

不允许把 `AI_AGENT_INFRASTRUCTURE_ROADMAP.md`、v0.2 chat 文档或单个代码文件当作 v0.3 执行入口直接开工。Roadmap 只定义阶段方向；v0.3 的任务边界、禁区、验收和 open questions 以本组 `AI_MASTRA_MEMORY_KNOWLEDGE_V0_3_*` 文档为准。

## 2. v0.3 名称和目标

名称：Mastra-first Memory + Knowledge Integration。

目标：在不破坏 v0.2 assistant-ui + Vercel AI SDK chat 主路径的前提下，把 Mastra-owned Memory 和 RAG/Knowledge retrieval 接入现有 `POST /api/ai/chat`。

v0.3 不是：

- 完整自研 memory engine。
- 完整自研 RAG pipeline。
- 完整自研 vector abstraction。
- 完整自研 reranker。
- 完整自研 workflow engine。
- v0.4 MCP/tool registry。
- v0.5 credits charging。

## 3. 当前真实基线

截至本规划文档创建时，真实代码基线是：

- `packages/ai` 已存在，职责是 contracts、adapter-compatible types 和 runtime type definitions。
- `packages/ai/src/adapters/mastra/index.ts` 只包含 Mastra bridge type surface，不包含 live Mastra runtime。
- `packages/ai/src/memory/index.ts` 定义 memory contracts。
- `packages/ai/src/knowledge/index.ts` 定义 knowledge/citation contracts。
- `apps/web/src/app/api/ai/chat/route.ts` 已是现有 chat stream route。
- `apps/web/src/ai/**` 已包含 provider/model/context/runtime/persistence/usage/entitlement wiring。
- `apps/web/src/components/ai/**` 已包含 assistant-ui app-local chat UI。
- `packages/db/src/ai.schema.ts` 已包含 v0.2 minimal AI tables：provider、model、user model setting、agent、thread、message、message part、tool call、usage audit。
- `apps/web/package.json` 和 `pnpm-lock.yaml` 已包含 v0.2 AI SDK / assistant-ui / OpenAI provider 依赖。
- `apps/web/package.json` 和 `pnpm-lock.yaml` 当前未包含 Mastra runtime package。

任何后续 TASK 开始前必须重新验证以上状态，因为它们可能已经变化。

## 4. 每个 TASK 开始前必须读取

每个 v0.3 TASK 开始前必须读取：

1. `AGENTS.md`
2. `docs/product/AELOKIT_AI_SAAS_PLATFORM_PRD.md`
3. `docs/product/AI_AGENT_INFRASTRUCTURE_ROADMAP.md`
4. `docs/architecture/AI_RUNTIME_LAYERING.md`
5. `docs/architecture/AI_AGENT_INFRASTRUCTURE_BOUNDARIES.md`
6. `docs/architecture/AELOKIT_PACKAGE_BOUNDARIES.md`
7. `docs/product/AI_MASTRA_MEMORY_KNOWLEDGE_V0_3_ENTRYPOINT.md`
8. `docs/product/AI_MASTRA_MEMORY_KNOWLEDGE_V0_3_SCOPE_FREEZE.md`
9. `docs/product/AI_MASTRA_MEMORY_KNOWLEDGE_V0_3_ACCEPTANCE.md`
10. `docs/product/AI_MASTRA_MEMORY_KNOWLEDGE_V0_3_OPEN_QUESTIONS.md`
11. `docs/product/AI_MASTRA_MEMORY_KNOWLEDGE_V0_3_TASKS.md`
12. `docs/product/AI_CHAT_V0_2_SCOPE_FREEZE.md`
13. `docs/product/AI_CHAT_V0_2_SCHEMA_DESIGN.md`
14. `docs/product/AI_CHAT_V0_2_IMPLEMENTATION_PLAN.md`

如果 TASK 涉及 `apps/web/**`，还必须读取：

1. `apps/AGENTS.md`
2. `apps/web/AGENTS.md`

如果 TASK 涉及 `packages/db/**`，还必须读取：

1. `packages/AGENTS.md`
2. `packages/db/AGENTS.md`

如果 TASK 涉及 `packages/ai/**`，还必须读取：

1. `packages/AGENTS.md`
2. `packages/ai/AGENTS.md`

## 5. External Docs Gate

任何涉及 Mastra、Vercel AI SDK、assistant-ui、provider SDK、embedding、vector store、streaming metadata、message shape、tool call、storage 或 deployment 的 TASK，都必须先核对最新官方文档。

本规划已核对的 Mastra 官方文档主题包括：

- Memory Overview: <https://mastra.ai/docs/memory/overview>
- Threads and Resources / Memory Storage: <https://mastra.ai/docs/memory/storage>
- Conversation History: <https://mastra.ai/docs/memory/message-history>
- Working Memory: <https://mastra.ai/docs/memory/working-memory>
- Semantic Recall: <https://mastra.ai/docs/memory/semantic-recall>
- Memory Processors: <https://mastra.ai/docs/memory/memory-processors>
- PostgreSQL Storage: <https://mastra.ai/en/reference/storage/postgresql>
- RAG Overview: <https://mastra.ai/docs/rag/overview>
- Chunking and Embedding: <https://mastra.ai/docs/rag/chunking-and-embedding>
- Vector Databases: <https://mastra.ai/docs/rag/vector-databases>
- Retrieval: <https://mastra.ai/docs/rag/retrieval>
- PgVector: <https://mastra.ai/reference/rag/pg>
- Vercel AI SDK Integration: <https://mastra.ai/docs/frameworks/ai-sdk>
- Deployment / Monorepo: <https://mastra.ai/docs/deployment/monorepo>

后续执行时不得只复用本快照。每个 implementation TASK 必须再次确认对应 API、package、imports、storage constructor、vector API 和 framework integration。

如果 Mastra 官方文档与当前 AeloKit 文档或代码冲突：

- 不要直接改代码。
- 在 `OPEN_QUESTIONS` 或 TASK completion report 中记录冲突。
- 给出默认建议。
- 标记需要用户确认的点。

## 6. TASK 完成报告格式

每个 TASK 完成后必须输出以下报告：

```md
## 修改文件列表

## 实现摘要

## Mastra 能力使用说明

## AeloKit 产品边界说明

## 主路径接入证明

## v0.2 chat regression 结果

## Static Checks

## Runtime Smoke

## Storage / DB / Vector Verification

## 未完成事项

## Open Questions 更新

## 是否满足本 TASK 验收标准

## 是否有 blocker

## 建议 commit message
```

其中 “主路径接入证明” 必须明确说明本 TASK 是否接入真实 `POST /api/ai/chat` 或真实 UI。如果 TASK 只创建 helper、service、runtime skeleton、schema 或文档，必须写：

```txt
PARTIAL UNTIL WIRED
```

不能把 helper/service/skeleton 的存在当作主路径完成。

## 7. 每个 TASK 必须证明

每个 TASK 必须证明：

- 使用了哪些 Mastra 能力。
- AeloKit 负责了哪些产品边界。
- 是否接入真实主路径。
- 是否破坏 v0.2 chat。
- 是否创建或修改了依赖、env、schema、migration、lockfile。
- 是否触碰 credits ledger。
- 是否引入 v0.4/v0.5 范围。

## 8. 强制禁止

v0.3 TASK 禁止：

- 一次性开发全部 v0.3。
- 跳到 v0.4/v0.5。
- 自研完整 memory/RAG/vector/reranker/workflow。
- 把 Mastra runtime 放进 `packages/ai`。
- 创建 `/api/chat`。
- 替换 `POST /api/ai/chat`。
- 破坏 v0.2 assistant-ui + Vercel AI SDK chat。
- 绕过 v0.2 usage audit。
- 让 provider secret 或 embedding secret 进入 client。
- 未经确认安装依赖。
- 未经确认改 schema。
- 未经确认生成 migration。
- 未经确认改 lockfile。
- 接 MCP。
- 接 credits charging。
- 创建 worker/gateway/studio/design-system split。
