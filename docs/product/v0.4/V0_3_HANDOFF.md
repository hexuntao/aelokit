# v0.3 to v0.4 Handoff

本文件是 v0.3 到 v0.4 的交接文档，不是 v0.4 计划。

## 1. v0.3 Accepted State

### confirmed in code

- `apps/web/src/app/api/ai/chat/route.ts` 是当前唯一 AI chat stream route；未发现 `apps/web/src/app/api/chat/route.ts`。
- `apps/web/src/components/ai/ChatProvider.tsx` 使用 `AssistantChatTransport({ api: '/api/ai/chat' })`，并传递 `threadId`, `modelId`, `memoryEnabled`, `knowledgeEnabled`。
- `/api/ai/chat` route 保留 auth/session、entitlement、model fallback、thread/message persistence、streaming response 和 usage audit。
- v0.3 memory recall 已通过 `getMemoryContextForChat()` 接入 `/api/ai/chat`，并由 request `memoryEnabled` 控制，默认 false。
- durable memory metadata 使用 `ai_memory_draft`，包含 pending/confirmed/deleted、disabled、Mastra thread/message mapping。
- knowledge ingestion/retrieval 使用 `knowledge_source`, `knowledge_document`, `knowledge_chunk`, `knowledge_source_access`。
- knowledge retrieval 已接入 `/api/ai/chat`，命中后将 retrieval context 注入 system prompt。
- citation/source 通过 response header 和 AI SDK `messageMetadata.citations` 传递到 UI，`CitationList.tsx` 渲染 sources。
- `apps/web/src/ai/mastra/**` 和 `apps/web/src/ai/knowledge/**` 包含 live Mastra/Postgres/PgVector/embedding runtime wiring。
- `packages/ai` 仅暴露 contracts/adapters/runtime-types 等 exports，没有 route、React UI、DB query 或 live provider/Mastra runtime。
- `packages/db/src/ai.schema.ts` 和 `packages/db/src/knowledge.schema.ts` 是真实 schema 所有权位置。
- `@repo/env/server` 管理 `OPENAI_API_KEY`, `OPENAI_BASE_URL`, `AI_EMBEDDING_PROVIDER`, `AI_EMBEDDING_MODEL`, `AI_EMBEDDING_BASE_URL`, `AI_EMBEDDING_API_KEY`。
- AI runtime/package 中未发现 `@repo/credits` import。

### confirmed by static checks

根据 `docs/product/AI_MASTRA_MEMORY_KNOWLEDGE_V0_3_VALIDATION_REPORT.md`，v0.3 TASK-010 已运行并通过：

- `pnpm check:env`
- `pnpm check:package-exports`
- `pnpm --filter @repo/ai typecheck`
- `pnpm --filter @repo/db typecheck`
- `pnpm --filter @repo/web typecheck`
- `pnpm --filter @repo/web build`

本轮文档治理未重新运行 full build/typecheck，因为没有修改 runtime/package/schema/lockfile。

### accepted with notes

- v0.3 最终决定是 `ACCEPTED WITH NOTES`。
- v0.3 主路径已接入，不是 `PARTIAL UNTIL WIRED`。
- v0.3 notes 包括 runtime E2E smoke、DB/vector verification、response-only citations。

### partial / blocked by environment

- 完整 authenticated browser runtime smoke 未执行。
- Knowledge ingestion/retrieval 真实验证需要 `DATABASE_URL` 指向可用 PostgreSQL。
- PgVector 真实验证需要 PostgreSQL `vector` extension 已启用。
- Knowledge embedding 真实验证需要 `AI_EMBEDDING_API_KEY` 或 `OPENAI_API_KEY`。
- 未获授权运行会修改 DB 状态的 `db:enable-pgvector` 或 seed/migration 类命令。

### not implemented by design

- Mastra Agent runtime 未接管 chat execution。
- Mastra Workflow 未使用。
- Mastra Vector Query Tool / rerank 未使用。
- Semantic Recall 未启用。
- v0.3 不接 MCP。
- v0.3 不接 credits charging。
- v0.3 不创建 worker/gateway/studio split。
- v0.3 不启用 local stdio MCP。
- v0.3 不默认使用 Assistant Cloud。
- Citation 不持久化到 `ai_message_part` source part。

## 2. v0.3 Remaining Notes

- Runtime smoke: 仍需在具备 authenticated browser session、DB、embedding key 的环境中执行真实 E2E。
- DB/vector verification: 仍需验证 `mastra` schema tables、`vector` extension、PgVector index `aelokit_knowledge_embeddings` 和 vector count。
- Citation: 当前是 response-only，通过 headers 和 `messageMetadata` 到 UI；历史消息 reload 不能从 `ai_message_part` 恢复 citation。
- Mastra capability: 当前使用 Memory, PostgresStore, MDocument, PgVector；未启用 Agent, Workflow, rerank, Vector Query Tool, Semantic Recall。
- Knowledge source: v0.3 支持 minimal manual source；uploaded file、URL crawl、integration 是未来。
- Credits: usage audit 继续写 `ai_usage`，不触碰 credits ledger。
- Scope: MCP/tools、credits charging、worker/gateway/studio、full admin audit 都不是 v0.3 范围。

## 3. Current AI Runtime Boundary

- `packages/ai` 的职责：provider/model/agent/tool/skill/memory/knowledge/MCP/usage/permission/error/runtime type contracts、lightweight AI SDK/Mastra adapter-compatible types、runtime type definitions。不得放 React UI、Next route、DB query、provider SDK initialization 或 live Mastra runtime。
- `apps/web/src/ai` 的职责：web app runtime wiring，包括 provider 初始化、model selection、auth/session/context 注入、Mastra storage/memory/knowledge wiring、usage audit、policy 和 app-level integration。
- `apps/web/src/components/ai` 的职责：app-local AI UI，包括 assistant-ui provider/composer/message/thread、memory controls、knowledge toggle、citation rendering。不得拥有 provider SDK 初始化、DB schema 或 credits ledger mutation。
- `apps/web/src/app/api/ai/chat/route.ts` 的职责：HTTP boundary、auth/session、entitlement、runtime request validation、model fallback、memory/knowledge context injection、streaming response、persistence、usage audit。
- `packages/db` 的职责：Drizzle schema、migrations、DB exports。AI schema 和 knowledge schema 都归 `packages/db/src`，不是 `apps/web/src/db` 或 `packages/ai`。
- `@repo/credits` 的边界：credits ledger/preflight/reservation/settlement/refund 归 credits domain；v0.3 AI runtime 不调用它。v0.5 前不得把 usage audit 当成扣费事实。
- `@repo/env` 的边界：server secrets 和 embedding/provider env 通过 `@repo/env/server`；client 只能使用 `NEXT_PUBLIC_*`，provider secret/embedding secret 不进入 browser payload。

## 4. Must Not Regress in v0.4

- `/api/ai/chat` 主路径不能被替换或绕过。
- Provider secret 和 embedding secret 必须 server-only。
- Usage audit 不直接扣 credits。
- `packages/ai` 不变成 runtime、route、UI、DB query、schema、migration 或 provider SDK 初始化层。
- `apps/web/src/db` 不写真实 schema。
- 不创建 `/api/chat` 作为 AI chat route。
- 没有 v0.4 Scope Freeze 和人工确认，不创建 worker/gateway/studio split。
- 不执行 destructive migration。
- 不默认使用 Assistant Cloud。
- 不默认启用真实 third-party MCP。
- 不默认启用 local stdio MCP。
- Citation/source provenance 不能丢失；如果仍 response-only，必须明确历史回放限制。
- Knowledge access policy 不能绕过 owner/public/shared access。
- Memory durable write 必须保留用户确认或明确策略，不允许静默保存敏感 durable memory。

## 5. v0.4 Candidate Areas

以下仅为候选方向，不是最终计划：

- contracts cleanup
- AI stack decision record
- runtime boundary hardening
- usage / audit consistency
- chat workspace readiness
- tool call contract readiness
- credits preflight design
- eval / observability design
- permissioned tools and skills design
- remote MCP security boundary design
- citation persistence decision
- authenticated runtime smoke environment plan

## 6. Blockers Before v0.4 Planning

- 人工确认文档治理输出是否接受。
- 人工确认是否执行 `docs/DOCUMENTATION_REORG_PLAN.md` 的归档/重写计划。
- 人工确认 `AGENTS.md` / `CLAUDE.md` 是否进入收敛任务。
- 人工确认 v0.4 是否以 Skills / Tools / MCP 为主题，或是否先处理 v0.3 notes。
- 人工确认 response-only citation 是否可接受，还是 v0.4 前必须设计持久化。
- 人工确认 v0.4 是否需要真实 runtime smoke 环境作为 planning 前置。
- 人工确认 v0.4 是否允许引入 MCP credential/server/tool persistence，或只做 contracts/design。
