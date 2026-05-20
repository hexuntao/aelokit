# AI Mastra Memory Knowledge v0.3 Validation Report

本文档是 TASK-010: v0.3 Integration Acceptance 的最终验收报告。

验证日期：2026-05-19

分支：dev

最终决定：**`ACCEPTED WITH NOTES`**

## 1. 修改文件列表

- `docs/product/AI_MASTRA_MEMORY_KNOWLEDGE_V0_3_VALIDATION_REPORT.md`

本 TASK 是 validation/report only，不修改 runtime、UI、schema、migration、依赖或 lockfile。

## 2. 实现摘要

TASK-010 验证 v0.3 Mastra-first Memory + Knowledge Integration 是否满足验收标准，不开发新功能。

当前真实代码状态：

- v0.2 chat 主路径仍是 `POST /api/ai/chat`。
- assistant-ui 仍通过 `AssistantChatTransport({ api: '/api/ai/chat' })` 接入。
- v0.3 memory recall 已接入 chat route，并由用户显式 `memoryEnabled` 控制。
- durable memory 使用 `ai_memory_draft` 保存 AeloKit-owned consent/disable/mapping metadata，确认后写入 Mastra Memory / PostgreSQL Storage。
- v0.3 knowledge ingestion 已写入 `knowledge_source`、`knowledge_document`、`knowledge_chunk`。
- knowledge chunking 使用 `@mastra/rag` 的 `MDocument`。
- knowledge vector store 使用 `@mastra/pg` 的 `PgVector`，index 为 `aelokit_knowledge_embeddings`。
- knowledge retrieval 已接入 chat route，并把检索上下文注入 system prompt。
- citation/source 通过 response header 和 AI SDK `messageMetadata` 传递到 UI，但不持久化到 `ai_message_part`。
- usage audit 继续通过 `recordUsageAudit` 写入 `ai_usage`。
- credits ledger 未被 AI runtime 触碰。
- Static Checks 6 项全部通过。

External Docs Gate 已复核官方文档：

- Mastra Memory requires a persistent storage provider for durable message history and uses `resource` / `thread` to scope recall.
- Mastra PostgreSQL Storage supports `PostgresStore` with `connectionString` and `schemaName`.
- Mastra RAG retrieval supports `PgVector.query({ indexName, queryVector, topK })` and source metadata.
- AI SDK v6 `toUIMessageStreamResponse()` supports `messageMetadata`, `sendSources`, and UI message stream responses.
- assistant-ui AI SDK v6 path supports `AssistantChatTransport({ api })` and token/metadata via `messageMetadata`.

## 3. Mastra 能力使用说明

| Mastra 能力 | Package | 使用方式 | 位置 |
|---|---|---|---|
| Memory runtime | `@mastra/memory` ^1.18.2 | `new Memory({ storage, options })`，`listThreads`、`createThread`、`saveMessages`、`deleteThread`、`recall` | `apps/web/src/ai/memory-service.ts`、`apps/web/src/ai/memory/index.ts` |
| PostgreSQL Storage | `@mastra/pg` ^1.11.0 | `new PostgresStore({ id, connectionString, schemaName: 'mastra' })` | `apps/web/src/ai/mastra/storage.ts` |
| RAG document chunking | `@mastra/rag` ^2.2.1 | `MDocument.fromText()` / `MDocument.fromMarkdown()` + `doc.chunk()` | `apps/web/src/ai/knowledge/chunking.ts` |
| PgVector | `@mastra/pg` ^1.11.0 | `new PgVector({ connectionString })`，`createIndex`、`upsert`、`query` | `apps/web/src/ai/knowledge/vector.ts`、`ingestion.ts`、`retrieval.ts` |

未使用或明确不启用：

- Mastra Agent runtime 未接管 chat execution。
- Mastra Workflow 未使用。
- Mastra Vector Query Tool / rerank 未使用。
- Semantic Recall 未启用（`semanticRecall: false`）。

## 4. AeloKit 产品边界说明

| AeloKit 负责的边界 | 验证状态 |
|---|---|
| auth/session/user identity | PASS — chat route 通过 `auth.api.getSession` 验证身份 |
| route access control | PASS — `enforceEntitlement` 在 chat route 中执行 |
| user consent / memory confirmation | PASS — `ai_memory_draft` 先保存 pending，`confirmMemoryThread` 后写入 Mastra Memory |
| memory enable/disable policy | PASS — request `memoryEnabled` 默认 false；disable 状态保存在 AeloKit metadata 与 Mastra thread metadata |
| knowledge source ownership metadata | PASS — `knowledge_source.userId`、`visibility`、`status` |
| source visibility/access policy | PASS — retrieval 时检查 owner、public、shared access |
| UI entry and display | PASS — `/chat`、`/knowledge`、Memory controls、Citation UI |
| citation/source rendering | PASS — `CitationList.tsx` 渲染 title/provenance/score |
| usage audit | PASS — `recordUsageAudit` 写入 `ai_usage`，无 credits 调用 |
| v0.2 persistence | PASS — `ensureThread`、`createMessage`、`saveMessageParts` 保留 |
| future credits boundary | PASS — AI runtime/package 中没有 `@repo/credits` import |
| Mastra runtime placement | PASS — live runtime 在 `apps/web/src/ai/**`，不在 `packages/ai` |

## 5. 主路径接入证明

### assistant-ui 主路径

- `apps/web/src/components/ai/ChatProvider.tsx` 使用 `API_URL = '/api/ai/chat'`。
- `AssistantChatTransport` 的 request body 带上 `threadId`、`modelId`、`memoryEnabled`、`knowledgeEnabled`。

### `/api/ai/chat` route

- `apps/web/src/app/api/ai/chat/route.ts` 是唯一 AI chat stream route。
- build 输出包含 `ƒ /api/ai/chat`，没有 `/api/chat` route。
- route 保留 auth、entitlement、model fallback、thread/message persistence、streaming response、usage audit。

### Memory 接入

- route import `getMemoryContextForChat` / `isMemoryEnabledForRequest`。
- route 在 `streamText()` 前调用 `getMemoryContextForChat()`。
- memory context 被转换为 UIMessage 后 prepend 到 `messagesForModel`。
- `memoryEnabled` 默认 false，用户未启用时等同 v0.2 行为。

### Knowledge 接入

- route import `retrieveKnowledgeContext` / `formatRetrievalContextForPrompt` / `isKnowledgeRetrievalEnabled`。
- route 在 `streamText()` 前按最后一条用户消息执行 retrieval。
- retrieval 命中后将 `Relevant Knowledge Sources` 注入 system prompt。
- response headers 输出 `x-ai-knowledge-enabled`、`x-ai-knowledge-chunk-count`、`x-ai-knowledge-citations`。
- `messageMetadata` finish part 输出 `citations`。

结论：主路径已接入，**不是 `PARTIAL UNTIL WIRED`**。

## 6. v0.2 chat regression 结果

| v0.2 功能 | 验证状态 | 说明 |
|---|---|---|
| 未登录请求被拒绝 | PASS | `auth.api.getSession` + runtime context validation |
| 登录用户可发送消息并获得 streaming response | PASS (代码路径) | `streamText().toUIMessageStreamResponse()` 保留 |
| `ai_thread` 继续写入 | PASS | `ensureThread()` |
| `ai_message` 继续写入 | PASS | user / assistant `createMessage()` |
| `ai_message_part` 继续写入 | PASS | `saveMessageParts()` in `onFinish` |
| `ai_usage` 继续写入 | PASS | `recordUsageAudit()` in `onFinish` / `onError` |
| model fallback | PASS | per-chat > user default > system default |
| OpenAI official endpoint / relay baseURL | PASS (代码路径) | provider and embedding config support baseURL |
| credits ledger 无变化 | PASS | AI runtime/package 没有 credits import |
| `/api/ai/chat` 仍是唯一 stream route | PASS | `find apps/web/src/app -type f -path '*/api/*/route.ts'` 未发现 `/api/chat` |
| Memory disabled 时等同 v0.2 行为 | PASS | `isMemoryEnabledForRequest(undefined) === false` |
| Knowledge disabled / embedding missing 时等同 v0.2 行为 | PASS | request flag + `isEmbeddingProviderConfigured()` gate |

## 7. Static Checks

| 命令 | 结果 |
|---|---|
| `pnpm check:env` | PASS — env schema 和 `env.example` 一致，无 `NEXT_PUBLIC_` 违规 |
| `pnpm check:package-exports` | PASS — `@repo/db` knowledge exports 与 `@repo/ai` 15 个 exports 均通过 |
| `pnpm --filter @repo/ai typecheck` | PASS |
| `pnpm --filter @repo/db typecheck` | PASS |
| `pnpm --filter @repo/web typecheck` | PASS |
| `pnpm --filter @repo/web build` | PASS — Next.js 16.1.6 build 成功，347 pages 生成，包含 `ƒ /api/ai/chat` |

## 8. Runtime Smoke

状态：**PARTIAL / BLOCKED BY ENVIRONMENT**。

阻塞原因：

- 完整 Runtime Smoke 需要 authenticated browser session。
- Knowledge ingestion/retrieval 需要 `DATABASE_URL` 指向可用 PostgreSQL。
- PgVector 需要 PostgreSQL `vector` extension 已启用。
- Knowledge embedding 需要 `AI_EMBEDDING_API_KEY` 或 `OPENAI_API_KEY`。
- 本 TASK 未获授权运行会修改 DB 状态的 `db:enable-pgvector` 或 seed / migration 类命令。

代码级 smoke 结果：

| Smoke 步骤 | 代码验证状态 | 说明 |
|---|---|---|
| 1. 登录 `/chat` | PASS (代码存在) | protected chat page exists |
| 2. 普通聊天仍正常 | PASS (代码路径) | Memory/Knowledge disabled 时保持 v0.2 route |
| 3. 启用 memory | PASS (代码存在) | `memoryEnabled` 从 UI transport 传入 route |
| 4. 创建/确认 memory | PASS (代码存在) | `createUserMemoryAction` / `confirmUserMemoryAction` |
| 5. memory 被使用 | PASS (代码路径) | confirmed memory -> Mastra Memory -> chat context |
| 6. 删除/禁用 memory | PASS (代码存在) | `disableUserMemoryAction` / `deleteUserMemoryAction` |
| 7. 创建 minimal knowledge source | PASS (代码存在) | `/knowledge` page + `createManualKnowledgeSourceAction` |
| 8. retrieval 生效 | PASS (代码路径) | embedding -> `PgVector.query()` -> DB access filter |
| 9. UI 展示 citation/source | PASS (代码存在) | `CitationList` + `messageMetadata.citations` |
| 10. `ai_usage` 写入 | PASS (代码路径) | `recordUsageAudit()` |
| 11. credits ledger 无变化 | PASS | 无 AI credits mutation |

不能将上述代码级 smoke 伪装成端到端浏览器 PASS。真实 E2E 仍需在具备 DB + embedding + authenticated browser 的环境中执行。

## 9. Storage / DB / Vector Verification

### 9.1 Mastra PostgreSQL Storage

- Package: `@mastra/pg` ^1.11.0
- Constructor: `PostgresStore`
- Config: `id: 'aelokit-mastra-storage'`，`schemaName: 'mastra'`，`disableInit: false`
- 用途: Mastra Memory threads/messages storage
- AeloKit mapping: `ai_memory_draft.mastraThreadId`、`ai_memory_draft.mastraMessageId`
- DB verification SQL:

```sql
select tablename
from pg_tables
where schemaname = 'mastra'
order by tablename;
```

状态：代码配置完整；真实 DB table verification 未运行，原因是本 TASK 未获授权执行 DB state-changing setup，且当前 Runtime Smoke 缺少完整 DB/embedding/browser 环境。

### 9.2 PgVector / Vector Store

- Package: `@mastra/pg` ^1.11.0
- Constructor: `PgVector`
- Index name: `aelokit_knowledge_embeddings`
- Dimension: ingestion config 默认为 1536；实际 upsert 前会按 embedding result dimensions 创建 index
- Ingestion path: `MDocument.chunk()` -> AI SDK `embedMany()` -> `PgVector.createIndex()` -> `PgVector.upsert()`
- Retrieval path: `generateSingleEmbedding()` -> `PgVector.query()` -> `knowledge_chunk` / `knowledge_source` access filter
- DB verification SQL:

```sql
select extname
from pg_extension
where extname = 'vector';
```

状态：代码路径完整；真实 vector extension/index/vector count 未在当前环境验证。

### 9.3 AeloKit Metadata Tables

已接入 runtime 的 AeloKit-owned metadata 表：

| 表名 | 用途 | runtime wiring |
|---|---|---|
| `ai_memory_draft` | memory pending/confirmed/deleted、disabled、Mastra mapping | create / confirm / disable / delete / recall 均已使用 |
| `knowledge_source` | source ownership、visibility、status、chunk/vector counts | ingestion 写入，retrieval 读取并做 access filter |
| `knowledge_document` | manual source 原文 | ingestion 写入 |
| `knowledge_chunk` | chunk text 与 PgVector vector id mapping | ingestion 写入，retrieval 读取 |
| `knowledge_source_access` | shared source access policy | retrieval 读取 |

### 9.4 Citation Stored in Message Part

Citation 当前不是持久化在 `ai_message_part` 的 `source` part 中，而是 response-only：

- response header: `x-ai-knowledge-citations`
- AI SDK `messageMetadata` finish part: `citations`
- UI state: `ChatProvider` 读取 `message.metadata?.citations`
- UI rendering: `CitationList`

影响：历史消息重新加载后无法从 `ai_message_part` 恢复 citations。若后续要求 historical citation replay，需要新增持久化策略并单独确认 schema / migration / message part writing scope。

## 10. 未完成事项

1. Runtime E2E browser smoke 未执行：需要 authenticated browser session。
2. DB/vector runtime verification 未执行：需要可用 PostgreSQL、启用 `vector` extension，并允许执行验证 SQL。
3. Citation 仍是 response-only，不持久化到 `ai_message_part`。
4. Mastra Agent / Workflow / rerank / Vector Query Tool 未接入；这是 v0.3 最小范围内的刻意非目标。
5. Semantic Recall 未启用；当前 memory 使用 confirmed manual memory + lastMessages。

## 11. Open Questions 更新

| Open Question | 更新后状态 | 说明 |
|---|---|---|
| Q001: 安装 Mastra runtime | confirmed | `@mastra/core`、`@mastra/memory`、`@mastra/pg`、`@mastra/rag` 已安装 |
| Q002: Mastra runtime 位置 | confirmed | live runtime 在 `apps/web/src/ai/**` |
| Q003: in-process | confirmed | v0.3 in-process，不创建 worker |
| Q004: 使用哪些 Mastra packages | confirmed | Memory、PostgresStore、PgVector、MDocument 已使用 |
| Q005: Mastra PostgreSQL Storage | confirmed | 使用 `PostgresStore`，schema: `mastra` |
| Q006: PgVector | confirmed in code / DB smoke blocked | runtime 使用 `PgVector`，真实 DB/vector count 待环境验证 |
| Q007: 单独 vector DB | confirmed | 不引入单独 vector DB |
| Q008: embedding provider | confirmed | 支持 embedding baseURL/apiKey，fallback 到 OpenAI key |
| Q009: embedding fallback | confirmed | 无 embedding key 时 Knowledge disabled/blocked |
| Q010: embedding env | confirmed | env schema 和 `env.example` 已通过 `pnpm check:env` |
| Q011: AI 自动建议 memory | deferred | v0.3 不做自动隐式长期记忆 |
| Q012: Durable memory 必须用户确认 | confirmed | pending draft -> explicit confirm -> Mastra Memory |
| Q013: Memory 删除/禁用 | confirmed with notes | disable 保留 metadata；delete 会删除 Mastra thread 并标记 draft deleted |
| Q014: Knowledge source metadata 自有表 | confirmed in code / DB smoke blocked | ingestion/retrieval 已接入表；真实 DB smoke 未执行 |
| Q015: Citation 持久化 | confirmed with notes | response-only，不持久化历史 source parts |
| Q016: 上传文件 | confirmed | v0.3 不做文件上传 |
| Q017: worker indexing | confirmed | v0.3 不创建 worker |
| Q018: Mastra observability | confirmed | 不接完整 observability |
| Q019: Mastra Agent | confirmed | v0.3 不让 Mastra Agent 主导 chat |
| Q020: Vercel AI SDK 继续 streaming | confirmed | `streamText().toUIMessageStreamResponse()` 保留 |
| Q021: assistant-ui transport 不变 | confirmed | `AssistantChatTransport({ api: '/api/ai/chat' })` |
| Q022: AI SDK v6 对齐 | confirmed | AeloKit `/api/ai/chat` + AI SDK v6 为主路径 |

## 12. 是否满足本 TASK 验收标准

| 验收标准 | 结果 |
|---|---|
| Product acceptance satisfied or gaps listed | PASS WITH NOTES |
| Architecture acceptance satisfied or gaps listed | PASS |
| Static checks run | PASS — 6/6 |
| Runtime smoke run or blockers classified | PARTIAL — blockers 已分类 |
| Final result explicit | PASS — `ACCEPTED WITH NOTES` |

## 13. 是否有 blocker

无 merge blocker。

Notes：

1. Runtime E2E smoke 仍依赖真实 DB + embedding + authenticated browser。
2. PgVector extension/index/vector count 未在本地 DB 中验证。
3. Citations response-only，历史消息 citation replay 不可用。

## 14. 建议 commit message

```txt
chore(ai): validate v0.3 mastra memory knowledge integration
```
