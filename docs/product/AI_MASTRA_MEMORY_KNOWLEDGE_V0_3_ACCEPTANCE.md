# AI Mastra Memory Knowledge v0.3 Acceptance

本文档定义 v0.3：Mastra-first Memory + Knowledge Integration 的验收标准。

## 1. Product Acceptance

v0.3 完成后必须满足：

- 用户能正常使用 v0.2 chat。
- 用户能启用/禁用 memory。
- 用户能手动创建或确认 durable memory。
- 用户能删除/禁用 memory。
- 后续 chat 能使用 memory。
- 用户能创建 minimal knowledge source。
- knowledge source 能被 chunk / embedding / vector retrieval。
- chat 能检索 knowledge。
- AI response 能展示 citation/source。
- usage audit 继续写入。
- credits ledger 不变。
- 不进入 MCP / worker / gateway / studio。

## 2. Architecture Acceptance

必须满足：

- Mastra runtime 不在 `packages/ai`。
- `packages/ai` 仍是 contracts/adapters/runtime-types。
- Mastra runtime wiring 在 `apps/web/src/ai/**`。
- `/api/ai/chat` 仍是唯一 chat stream route。
- 不创建 `/api/chat`。
- v0.2 chat persistence 不被替换。
- AeloKit-owned metadata 只保存产品边界数据。
- 不复制 Mastra memory/RAG internals。
- Knowledge provenance 不丢失。
- Memory 与 Knowledge 概念分离。
- v0.2 usage audit 不被绕过。
- credits ledger 不被修改。
- provider/embedding secrets 不进入 client。

## 3. Static Checks

最终验收必须执行：

```bash
pnpm check:env
pnpm check:package-exports
pnpm --filter @repo/ai typecheck
pnpm --filter @repo/db typecheck
pnpm --filter @repo/web typecheck
pnpm --filter @repo/web build
```

如果某个命令无法运行，验收报告必须记录：

- 命令。
- 失败原因。
- 是否环境阻塞。
- 是否 merge blocker。
- 最小修复建议。

不能把未运行命令标记为通过。

## 4. Runtime Smoke

最终验收必须覆盖：

1. 登录 `/chat`。
2. 普通聊天仍正常。
3. 启用 memory。
4. 创建/确认 memory。
5. 发送相关消息，确认 memory 被使用。
6. 删除/禁用 memory。
7. 创建 minimal knowledge source。
8. 发送相关问题，确认 retrieval 生效。
9. UI 展示 citation/source。
10. `ai_usage` 继续写入。
11. credits ledger 无变化。

如果本地无法完成 authenticated browser smoke，必须说明阻塞原因，不能用重定向到 login 的截图当作通过证据。

## 5. Storage / DB / Vector Verification

最终验收必须列出实际使用的 storage/vector 方案并验证。

### 5.1 Mastra PostgreSQL Storage

如果使用 Mastra PostgreSQL storage，验收必须说明：

- 使用的 Mastra storage package 和 constructor。
- storage table/schema 是否由 Mastra 管理。
- 线程、资源、message history、working memory 或 semantic recall 数据如何验证。
- 是否存在 AeloKit mapping。

建议验证方式：

```sql
select tablename
from pg_tables
where schemaname = current_schema()
  and tablename like 'mastra_%'
order by tablename;
```

如果 Mastra 官方 storage 使用不同表名或 schema，按最新文档和实际配置调整，不要硬套以上 SQL。

### 5.2 PgVector / Vector Store

如果使用 PgVector，验收必须说明：

- `vector` extension 是否存在。
- 使用的 Mastra PgVector package。
- index name / vector table / dimension。
- chunk count / vector count。
- retrieval query 如何证明命中 source。

建议验证方式：

```sql
select extname
from pg_extension
where extname = 'vector';
```

并使用 Mastra 官方 vector API 或 SQL 验证 index/chunk/vector 记录。具体表名不得在未实现前写死。

### 5.3 AeloKit Metadata Tables

如果 v0.3 新增 AeloKit-owned metadata 表，验收必须列出实际表名和 SQL。

可验证的数据类别：

- memory consent state
- memory enable/disable state
- knowledge source ownership
- source visibility/access policy
- source-to-Mastra-resource mapping
- citation rendering metadata

不得把 AeloKit metadata 表扩展成 Mastra memory/RAG internals mirror。

### 5.4 Citation Stored in Message Part

如果 citation/source 只存在于 message part，验收必须说明如何从 `ai_message_part` 验证：

```sql
select id, message_id, runtime_part_type, content
from ai_message_part
where part_type = 'source'
order by created_at desc
limit 20;
```

必须确认 `content` 中存在足够 provenance，可用于 UI 展示和用户追溯。

### 5.5 Blocked Items

如果 storage/vector/metadata 方案依赖 open question，验收报告必须把该项标记为 blocked，不能伪装成完成。

## 6. v0.2 Regression Acceptance

v0.3 不得破坏 v0.2：

- 未开启 memory/knowledge 时，普通 chat 仍可登录访问、发送消息、streaming response。
- `ai_thread` 继续写入。
- `ai_message` 继续写入。
- `ai_message_part` 继续写入。
- `ai_usage` 继续写入。
- user default / per-chat / system default model fallback 继续工作。
- OpenAI official endpoint 和 OpenAI-compatible relay baseURL 路径继续工作。
- `@repo/credits` ledger 无变化。

## 7. Final Decision

最终验收报告必须给出一个结果：

- `ACCEPTED`
- `ACCEPTED WITH NOTES`
- `REJECTED`

如果任何主路径未接入、storage/vector 未验证、usage audit 被破坏、credits ledger 被修改、或 `/api/ai/chat` 被替换，结果必须是 `REJECTED`。
