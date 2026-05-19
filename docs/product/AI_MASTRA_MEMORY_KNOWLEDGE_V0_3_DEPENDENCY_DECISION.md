# AI Mastra Memory Knowledge v0.3 Dependency / Runtime Placement Decision

本文档是 TASK-002 的输出，记录 Mastra runtime 放置、依赖清单、存储/向量方案和用户确认项。

状态：待用户确认后才能执行 TASK-003。

## 1. 核心决策摘要

| 决策项 | 选择 | 理由 |
| --- | --- | --- |
| Mastra runtime 放置 | `apps/web/src/ai/mastra/**` | v0.3 目标是增强现有 `/api/ai/chat`，当前禁止创建 worker/gateway/studio，禁止把 Mastra runtime 放进 `packages/ai` |
| 是否 in-process | 是，v0.3 先 in-process | 当前最小闭环是 `/api/ai/chat` memory/retrieval context，不是 long-running indexing platform |
| Storage 方案 | Mastra PostgreSQL Storage (`@mastra/pg`) | AeloKit 已有 PostgreSQL；Mastra 官方提供 PostgreSQL storage；减少额外基础设施 |
| Vector 方案 | PgVector (`@mastra/pg`) | 同一包提供 PgVector；复用现有 PostgreSQL；需要确认 `vector` extension 可用 |
| 是否需要单独 vector DB | 否 | v0.3 是最小闭环，不应增加独立 infra |
| Embedding provider | 优先检测 OpenAI-compatible relay 是否支持 embeddings endpoint；fallback 到官方 OpenAI | 当前 v0.2 已支持 OpenAI official endpoint 和 OpenAI-compatible relay baseURL，但 chat 可用不代表 embedding 可用 |
| 是否需要新 metadata schema/migration | 待确认 | Mastra 自管理 storage tables；AeloKit 可能需要 consent/ownership metadata，但需单独确认 |
| 是否接 Mastra Agent 主导 chat | 否 | v0.3 先不让 Mastra Agent 主导 chat execution，只使用 Mastra Memory/RAG context 增强现有 AI SDK route |
| Streaming ownership | 继续由 Vercel AI SDK + assistant-ui 负责 | v0.2 chat 已完成且稳定；v0.3 不应重写主路径 |

## 2. Mastra Packages 清单

### 2.1 必需包

| Package | 安装方式 | 用途 | 为什么需要 |
| --- | --- | --- | --- |
| `@mastra/core` | `@latest` | Mastra 核心框架 | Agent、workflow、tool、memory 基础类型和 runtime |
| `@mastra/memory` | `@latest` | Memory 系统 | Memory runtime、conversation history、working memory、semantic recall、memory processors |
| `@mastra/pg` | `@latest` | PostgreSQL Storage + PgVector | PostgresStore 用于 memory storage；PgVector 用于 vector retrieval；同一包提供两种能力 |
| `@mastra/rag` | `@latest` | RAG/Document 处理 | MDocument、chunking、document processing |

**重要：**
- 使用 `@latest` tag 安装，不预设具体版本范围。
- TASK-003 安装后必须记录实际 resolved version 到 `apps/web/package.json`。
- 后续 TASK 必须基于实际安装版本验证 API exports 和 TypeScript signatures。

### 2.2 可选包（v0.3 不安装）

| Package | 用途 | 为什么 v0.3 不需要 |
| --- | --- | --- |
| `@mastra/libsql` | libSQL storage | 已选择 PostgreSQL |
| `@mastra/mongodb` | MongoDB storage | 已选择 PostgreSQL |
| `@mastra/pinecone` | Pinecone vector | 已选择 PgVector |
| `@mastra/qdrant` | Qdrant vector | 已选择 PgVector |
| `@mastra/chroma` | Chroma vector | 已选择 PgVector |

### 2.3 依赖关系说明

- `@mastra/core` 是基础，提供 Agent、Mastra 类和核心类型
- `@mastra/memory` 依赖 storage provider，需配合 `@mastra/pg` 使用
- `@mastra/pg` 同时提供 `PostgresStore`（storage）和 `PgVector`（vector）
- `@mastra/rag` 提供 `MDocument` 用于 document chunking 和 processing
- 所有 Mastra 包通过 `ai` package（Vercel AI SDK）调用 embedding model

## 3. 安装命令

```bash
pnpm --filter @repo/web add @mastra/core@latest @mastra/memory@latest @mastra/pg@latest @mastra/rag@latest
```

**影响文件：**
- `apps/web/package.json`（新增 4 个 direct dependencies）
- `pnpm-lock.yaml`（lockfile 更新）

**不影响：**
- root `package.json`
- `packages/ai/package.json`
- `packages/db/package.json`

## 4. 环境变量

### 4.1 已有环境变量（复用）

| 变量名 | 用途 | 来源 |
| --- | --- | --- |
| `DATABASE_URL` | PostgreSQL 连接字符串 | 已有，用于 `@mastra/pg` PostgresStore 和 PgVector |
| `OPENAI_API_KEY` | OpenAI API key | 已有，用于 embedding model（如果 relay 不支持） |
| `OPENAI_BASE_URL` | OpenAI-compatible relay baseURL | 已有，需检测是否支持 embeddings endpoint |

### 4.2 可能需要新增的环境变量

| 变量名 | 用途 | 是否必需 | 默认值建议 |
| --- | --- | --- | --- |
| `AI_EMBEDDING_PROVIDER` | Embedding provider 选择 | 可选 | `openai` |
| `AI_EMBEDDING_MODEL` | Embedding model ID | 可选 | `text-embedding-3-small` |
| `AI_EMBEDDING_BASE_URL` | Embedding 专用 baseURL | 可选 | 复用 `OPENAI_BASE_URL` |
| `AI_EMBEDDING_API_KEY` | Embedding 专用 API key | 可选 | 复用 `OPENAI_API_KEY` |

**决策：**
- 如果 OpenAI-compatible relay 支持 `/v1/embeddings` endpoint，则复用 `OPENAI_BASE_URL` 和 `OPENAI_API_KEY`
- 如果 relay 不支持 embeddings，则使用官方 OpenAI endpoint（`AI_EMBEDDING_BASE_URL` 留空或指向 `https://api.openai.com/v1`）
- v0.3 优先检测 relay 能力，不默认新增 embedding env

**如果需要新增 env：**
1. 更新 `packages/env/src/server.ts`
2. 更新 `env.example`
3. 运行 `pnpm check:env`

## 5. PgVector 要求

### 5.1 Extension 要求

PgVector 需要 PostgreSQL `vector` extension。需确认：

```sql
-- 检查 extension 是否存在
SELECT extname FROM pg_extension WHERE extname = 'vector';

-- 如果不存在，需要创建（需要 superuser 权限）
CREATE EXTENSION IF NOT EXISTS vector;
```

### 5.2 如果 extension 不可用

**Fallback 方案：**
1. 联系 DBA 启用 `vector` extension
2. 或使用外部 vector DB（如 Pinecone、Qdrant），但这会增加 infra 复杂度
3. 或 v0.3 只实现 Memory（不依赖 vector），Knowledge 部分标记为 blocked

**v0.3 默认决策：**
- 优先假设 `vector` extension 可用
- 如果不可用，Knowledge ingestion 标记为 blocked，Memory 仍可继续

## 6. Embedding Provider 要求

### 6.1 检测逻辑

v0.3 需要在 runtime 启动时检测 embedding 能力：

1. 如果 `OPENAI_BASE_URL` 设置了 relay：
   - 检测 relay 是否支持 `/v1/embeddings` endpoint
   - 可通过发送 test embedding request 或查阅 relay 文档确认
2. 如果 relay 支持 embeddings：
   - 使用 relay 作为 embedding provider
3. 如果 relay 不支持：
   - Fallback 到官方 OpenAI embeddings
   - 如果没有 `OPENAI_API_KEY`，Knowledge ingestion 标记为 blocked

### 6.2 Embedding Model 选择

推荐 embedding models：

| Model | Dimensions | 适用场景 |
| --- | --- | --- |
| `text-embedding-3-small` | 1536（可配置为 256-1536） | 默认选择，性价比高 |
| `text-embedding-3-large` | 3072（可配置为 256-3072） | 更高精度需求 |
| `text-embedding-ada-002` | 1536 | 旧版模型，不推荐新项目使用 |

**v0.3 默认选择：** `text-embedding-3-small`，dimension 1536

## 7. Schema / Migration 要求

### 7.1 Mastra 自管理 Tables

Mastra PostgreSQL storage 自动创建和管理 storage tables。

**可能的 Mastra 表名（示例，以实际安装版本为准）：**

| 可能的 Table | 用途 |
| --- | --- |
| `mastra_workflow_snapshot` | Workflow state（示例） |
| `mastra_evals` | Evaluation results（示例） |
| `mastra_threads` | Conversation threads（示例） |
| `mastra_messages` | Messages（示例） |
| `mastra_traces` | Telemetry/tracing（示例） |
| `mastra_scorers` | Scoring data（示例） |
| `mastra_resources` | Resource working memory（示例） |

**重要：**
- 以上表名为示例，实际表名以 Mastra 安装版本创建为准。
- TASK-004/TASK-005 必须验证实际创建的表名。
- 这些 tables 由 Mastra 自动创建，不需要 AeloKit 生成 migration。

### 7.2 AeloKit 可能需要的 Metadata Tables

v0.3 可能需要以下 AeloKit-owned metadata：

| 可能的 Table | 用途 | 是否必需 |
| --- | --- | --- |
| `ai_memory_consent` | User consent for memory | 待确认 |
| `ai_memory_policy` | Memory enable/disable policy | 待确认 |
| `ai_knowledge_source` | Knowledge source ownership metadata | 待确认 |
| `ai_knowledge_source_mapping` | Source to Mastra resource mapping | 待确认 |

**决策：**
- v0.3 TASK-002 不创建这些 tables
- 如果需要，由后续 TASK（如 TASK-005/007）在用户确认 schema design 后创建
- v0.3 最小方案可以先用 Mastra 自管理 tables，AeloKit metadata 作为后续优化

### 7.3 不需要的 Schema

v0.3 明确不需要：
- 自建 memory engine tables（Mastra 已提供）
- 自建 chunk/embedding/vector tables（Mastra + PgVector 已提供）
- MCP credential tables（v0.4）
- Credits settlement tables（v0.5）

## 8. Runtime Placement 详细说明

### 8.1 目录结构

```
apps/web/src/ai/
├── context/           # 已有：request context
├── entitlements/      # 已有：entitlement checks
├── errors/            # 已有：error handling
├── models/            # 已有：model resolution
├── persistence/       # 已有：v0.2 chat persistence
├── providers/         # 已有：provider setup
├── runtime/           # 已有：runtime wiring
├── usage/             # 已有：usage audit
├── mastra/            # 新增：Mastra runtime
│   ├── index.ts       # Mastra instance factory
│   ├── storage.ts     # PostgresStore singleton
│   ├── vector.ts      # PgVector singleton
│   ├── memory.ts      # Memory factory/config
│   ├── rag.ts         # RAG/MDocument helpers
│   └── config.ts      # Mastra config resolvers
└── index.ts           # 已有：exports
```

### 8.2 为什么不放 `packages/ai`

根据 `AGENTS.md` 和 `AI_AGENT_INFRASTRUCTURE_BOUNDARIES.md`：

- `packages/ai` 只负责 contracts、adapter-compatible types、runtime type definitions
- `packages/ai` 不允许包含 live Mastra runtime、provider SDK initialization、DB queries
- Mastra runtime 是 app-specific wiring，属于 `apps/web/src/ai`
- 这样保持 `packages/ai` 可被其他未来 app 复用，而不带入 runtime side effects

### 8.3 为什么不创建 worker

- v0.3 目标是最小闭环：增强现有 `/api/ai/chat` 的 memory/retrieval context
- Worker 用于 long-running indexing、background embedding、scheduled tasks
- v0.3 先做 in-process manual ingestion，worker 属于 v0.6+ 评估

## 9. 与 v0.2 Chat 的集成方式

### 9.1 主路径保持不变

```
User
↓
assistant-ui Thread / Composer
↓
Vercel AI SDK chat runtime
↓
POST /api/ai/chat  ← 唯一 chat stream route
↓
apps/web/src/ai resolves model/context
↓
[NEW] apps/web/src/ai/mastra provides memory/retrieval context
↓
Model provider streams output through AI SDK
↓
API route emits UI message stream
↓
assistant-ui renders messages
↓
v0.2 persistence + usage audit
```

### 9.2 Mastra 如何接入

Mastra 不替换 Vercel AI SDK streaming，而是：

1. **Memory path：**
   - 在 route handler 中，通过 `apps/web/src/ai/mastra/memory.ts` 获取 Memory 实例
   - 使用 Memory 的 `queryThreads`、`getThreadById`、`saveMessages` 等 API
   - 将历史 messages 作为 context 注入到 AI SDK `streamText` 的 `messages` 参数

2. **Knowledge path：**
   - 在 route handler 中，通过 `apps/web/src/ai/mastra/rag.ts` 进行 retrieval
   - 使用 `PgVector.query()` 获取相关 chunks
   - 将 retrieval results 作为 system message 或 context 注入到 AI SDK

3. **Citation path：**
   - Retrieval results 包含 source metadata
   - 将 source metadata 附加到 response 的 message parts 或 metadata
   - UI 通过 `ai_message_part.part_type = 'source'` 渲染 citations

**注意：**
- 以上 API 名称（`queryThreads`、`getThreadById`、`saveMessages`、`PgVector.query()`）为示例。
- TASK-004/TASK-005/TASK-007 必须验证实际安装包的 exports 和 TypeScript signatures。
- 实现必须遵循安装包的实际类型定义和 Mastra 官方最新文档。

### 9.3 不改变的部分

- `/api/ai/chat` 仍是唯一 chat stream route
- assistant-ui transport 仍是 `AssistantChatTransport({ api: '/api/ai/chat' })`
- Vercel AI SDK 仍负责 streaming protocol
- v0.2 persistence（thread/message/message_part/tool_call）继续工作
- v0.2 usage audit 继续工作
- credits ledger 不变

## 10. User Confirmation Required Before TASK-003

以下项目需要用户确认后才能执行 TASK-003：

### 10.1 必须确认

| # | 确认项 | 默认选择 | 影响 |
| --- | --- | --- | --- |
| 1 | 是否同意安装 `@mastra/core`、`@mastra/memory`、`@mastra/pg`、`@mastra/rag` | 是 | 修改 `apps/web/package.json` 和 `pnpm-lock.yaml` |
| 2 | 是否确认 PostgreSQL `vector` extension 可用 | 是（或确认需要启用） | 如果不可用，Knowledge blocked |
| 3 | 是否确认 OpenAI-compatible relay 支持 embeddings endpoint | 需检测 | 如果不支持，fallback 到官方 OpenAI |
| 4 | 是否同意 v0.3 先 in-process，不创建 worker | 是 | 不创建 `apps/worker` |

### 10.2 可选确认

| # | 确认项 | 默认选择 | 影响 |
| --- | --- | --- | --- |
| 5 | 是否需要新增 embedding 专用 env 变量 | 否（复用现有） | 如果需要，更新 `packages/env` 和 `env.example` |
| 6 | 是否需要 AeloKit-owned memory/knowledge metadata tables | 待后续 TASK 确认 | 不在 TASK-003 创建 |
| 7 | Embedding model 选择 | `text-embedding-3-small` | 影响 vector dimension |

### 10.3 Blocked Items（未确认前无法继续）

| Blocked Item | 阻塞原因 | 解除条件 |
| --- | --- | --- |
| TASK-003 依赖安装 | 需要用户确认 package list 和 install command | 用户确认 10.1 项 |
| Knowledge ingestion | 可能需要 `vector` extension 或 embedding provider | 确认 extension 可用 + embedding provider 配置 |
| AeloKit metadata schema | 需要单独 schema design 确认 | 后续 TASK 确认 |

## 11. Open Questions 更新

以下 Open Questions 在本 TASK 中得到 proposed 状态，待用户确认后变为 defaulted：

| Question | 状态 | 决策 |
| --- | --- | --- |
| Q001: 是否安装 Mastra runtime | proposed → 待确认后 defaulted | 安装，exact packages 见本文档 |
| Q002: Mastra runtime 放在哪里 | proposed → 待确认后 defaulted | `apps/web/src/ai/mastra/**` |
| Q003: 是否先 in-process | proposed → 待确认后 defaulted | 是 |
| Q004: 使用哪些 Mastra packages | proposed → 待确认后 defaulted | `@mastra/core`、`@mastra/memory`、`@mastra/pg`、`@mastra/rag` |
| Q005: 是否使用 Mastra PostgreSQL Storage | proposed → 待确认后 defaulted | 是 |
| Q006: 是否使用 PgVector | proposed → 待确认后 defaulted | 是，需确认 extension 可用 |
| Q007: 是否需要单独 vector DB | proposed → 待确认后 defaulted | 否 |
| Q008: 是否使用当前 relay 做 embedding | proposed → 待确认后 defaulted | 优先检测，fallback 到官方 OpenAI |
| Q009: Relay 不支持 embedding 的 fallback | proposed → 待确认后 defaulted | Fallback 到官方 OpenAI；如果没有 key，Knowledge blocked |
| Q010: 是否需要新增 embedding model env | proposed → 待确认后 defaulted | 可选，优先复用现有 env |
| Q019: 是否接 Mastra Agent | proposed → 待确认后 defaulted | 否，只用 Memory/RAG context |
| Q020: 是否继续由 AI SDK 负责 streaming | proposed → 待确认后 defaulted | 是 |
| Q022: Mastra AI SDK integration 对齐 | proposed → 待确认后 defaulted | 不照搬 Mastra 并行 route，以 AeloKit 现有路径为主 |

**注意：** 以上状态在用户确认 10.1 必须确认项后，从 proposed 变为 defaulted。

## 12. Storage / DB / Vector 验证计划

**注意：以下代码示例仅为示意，实际 API 以安装包 exports 和官方文档为准。**

### 12.1 PostgreSQL Storage 验证

安装后验证：

```typescript
// 示例：验证 Mastra PostgreSQL Storage
import { PostgresStore } from '@mastra/pg';

const storage = new PostgresStore({
  id: 'test-storage',
  connectionString: process.env.DATABASE_URL,
});

// Mastra 自动 init，创建 tables
await storage.init();

// 验证 tables 创建
const tables = await storage.db.any(`
  SELECT tablename FROM pg_tables 
  WHERE schemaname = current_schema() 
  AND tablename LIKE 'mastra_%'
`);
console.log('Mastra tables:', tables);
```

**TASK-004 必须验证：**
- `PostgresStore` 构造函数参数签名
- `init()` 方法是否存在或自动调用
- `db` 属性访问方式

### 12.2 PgVector 验证

```sql
-- 检查 vector extension
SELECT extname FROM pg_extension WHERE extname = 'vector';

-- 如果需要创建
CREATE EXTENSION IF NOT EXISTS vector;
```

```typescript
// 示例：验证 PgVector
import { PgVector } from '@mastra/pg';

const vector = new PgVector({
  id: 'test-vector',
  connectionString: process.env.DATABASE_URL,
});

// 创建 index
await vector.createIndex({
  indexName: 'test_embeddings',
  dimension: 1536,
});
```

**TASK-007 必须验证：**
- `PgVector` 构造函数参数签名
- `createIndex()` 方法签名和返回类型
- `upsert()` 和 `query()` 方法签名

### 12.3 Embedding Provider 验证

```typescript
// 示例：验证 embedding
import { embed } from 'ai';
import { openai } from '@ai-sdk/openai';

// Test embedding
const { embedding } = await embed({
  model: openai.embedding('text-embedding-3-small'),
  value: 'test embedding',
});

console.log('Embedding dimension:', embedding.length);
```

**TASK-007 必须验证：**
- `ai` package 的 `embed` 函数签名
- `@ai-sdk/openai` 的 `openai.embedding()` 方法签名

## 13. 完成标准

TASK-002 完成当且仅当：

- [x] 输出了 runtime placement 决策
- [x] 输出了 exact package list 和 install command
- [x] 输出了 storage/vector/embedding 方案
- [x] 输出了 env 变量需求
- [x] 输出了 User Confirmation Required section
- [x] 没有修改 package.json、lockfile、source code、env schema、migration
- [x] 没有把未确认内容写成事实

## 14. 下一步

用户确认本文档后：

1. 执行 TASK-003：安装确认的 Mastra packages
2. 执行 TASK-004：创建 `apps/web/src/ai/mastra/**` runtime skeleton
3. 后续 TASK 按 `AI_MASTRA_MEMORY_KNOWLEDGE_V0_3_TASKS.md` 顺序执行
