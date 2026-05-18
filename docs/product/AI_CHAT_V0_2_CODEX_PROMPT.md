# AI Chat v0.2 Codex Prompt

下面的提示词用于后续 Codex 执行单个 AeloKit v0.2 TASK。每次只复制并执行一个
指定 TASK。

```md
你现在执行 AeloKit v0.2 的单个 TASK：TASK-XXX。

必须先阅读：
- `AGENTS.md`
- `packages/AGENTS.md`
- `apps/web/AGENTS.md`
- `packages/ai/AGENTS.md`
- `packages/db/AGENTS.md`
- `docs/product/AI_CHAT_V0_2_SCOPE_FREEZE.md`
- `docs/product/AI_CHAT_V0_2_ACCEPTANCE.md`
- `docs/product/AI_CHAT_V0_2_IMPLEMENTATION_PLAN.md`
- `docs/product/AI_CHAT_V0_2_SCHEMA_DESIGN.md`
- `docs/product/AI_CHAT_V0_2_OPEN_QUESTIONS.md`

如果本 TASK 涉及 assistant-ui、Vercel AI SDK、Mastra、provider SDK，必须先执行 External Docs Gate：
- 查官方最新文档
- 记录文档 URL
- 确认版本
- 输出实现计划
- 不允许凭记忆猜 API

强制规则：
- 每次只执行一个 TASK。
- 不允许越过 Scope Freeze。
- 不允许实现 v0.3+ 内容。
- 不允许私自安装依赖。
- 如果要安装 v0.2 AI dependencies，只能执行 TASK-003B。
- TASK-003B 之外的其他 TASK 不允许顺手安装依赖。
- 不允许私自创建 migration。
- 不允许创建 `/api/chat`。
- 不允许把 provider secret 暴露到 client。
- 不允许让 `packages/ai` import `apps/web`。
- 不允许让 usage audit 触发 credits mutation。
- 不允许把 Mastra 用成所有 chat 的强制路径，除非 TASK 明确要求且官方文档确认。

执行边界：
- 严格遵守 `AI_CHAT_V0_2_IMPLEMENTATION_PLAN.md` 中该 TASK 的允许修改文件和禁止修改文件。
- 如果需要新增依赖，先执行 TASK-003 输出 exact package list、版本范围、安装命令、影响文件，等待用户确认。
- 实际安装依赖只能在用户确认后执行 TASK-003B；其他 TASK 遇到缺依赖时必须停止并报告 blocker。
- 如果需要 schema/migration，先输出 schema design、migration impact、DB 命令，等待用户确认。
- 如果官方文档与当前代码或计划冲突，先暂停说明冲突点，不要硬写。
- 如果 TASK 范围不足以解决 blocker，输出最小变更请求，不要自行扩大范围。

完成后必须输出：
- 修改文件列表
- 实现摘要
- External Docs Gate 结果，若适用
- 验证命令
- 验证结果
- 未完成事项
- 是否满足本 TASK 验收标准
- 是否有 blocker
- 建议 commit message
```

## 推荐完成报告格式

````md
## 修改文件列表

- `path/to/file`

## 实现摘要

- ...

## External Docs Gate

- 适用/不适用：
- 阅读 URL：
- 采用版本/API：
- 未确认风险：

## 验证命令

```bash
...
```

## 验证结果

- ...

## 未完成事项

- ...

## TASK 验收

- 满足/不满足：
- blocker：

## 建议 commit message

```txt
...
```
````

## 常用 TASK 选择提醒

- 只研究依赖：执行 TASK-002。
- 只输出安装计划：执行 TASK-003。
- 实际安装已确认依赖：执行 TASK-003B。
- 只设计 schema：执行 TASK-004。
- 创建 schema/migration：必须等用户确认后执行 TASK-005。
- 创建 runtime skeleton：执行 TASK-007。
- 创建 `/api/ai/chat`：执行 TASK-008。
- 创建 assistant-ui UI：执行 TASK-011。
- 最终验收：执行 TASK-016。
