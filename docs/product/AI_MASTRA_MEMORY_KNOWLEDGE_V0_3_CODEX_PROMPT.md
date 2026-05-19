# AI Mastra Memory Knowledge v0.3 Codex Prompt

将下面提示词复制给 Codex，用于执行单个 v0.3 TASK。

```md
请在 AeloKit `dev` 分支上执行 v0.3：Mastra-first Memory + Knowledge Integration 的单个 TASK。

本次只执行一个 TASK：`TASK-00X: <title>`。

## 开始前

1. `git checkout dev`
2. `git pull --ff-only origin dev`
3. `git status --short --branch`
4. 读取真实代码状态，不要依赖旧记忆。
5. 读取本 TASK 的 Must Read 文档。
6. 如果 TASK 涉及 Mastra、Vercel AI SDK、assistant-ui、provider SDK、embedding、vector、storage、streaming response、message shape、tool call、usage metadata 或 deployment，必须核对官方最新文档。

## 必须读取

- `AGENTS.md`
- `docs/product/AELOKIT_AI_SAAS_PLATFORM_PRD.md`
- `docs/product/AI_AGENT_INFRASTRUCTURE_ROADMAP.md`
- `docs/architecture/AI_RUNTIME_LAYERING.md`
- `docs/architecture/AI_AGENT_INFRASTRUCTURE_BOUNDARIES.md`
- `docs/architecture/AELOKIT_PACKAGE_BOUNDARIES.md`
- `docs/product/AI_MASTRA_MEMORY_KNOWLEDGE_V0_3_ENTRYPOINT.md`
- `docs/product/AI_MASTRA_MEMORY_KNOWLEDGE_V0_3_SCOPE_FREEZE.md`
- `docs/product/AI_MASTRA_MEMORY_KNOWLEDGE_V0_3_ACCEPTANCE.md`
- `docs/product/AI_MASTRA_MEMORY_KNOWLEDGE_V0_3_OPEN_QUESTIONS.md`
- `docs/product/AI_MASTRA_MEMORY_KNOWLEDGE_V0_3_TASKS.md`
- `docs/product/AI_CHAT_V0_2_SCOPE_FREEZE.md`
- `docs/product/AI_CHAT_V0_2_SCHEMA_DESIGN.md`
- `docs/product/AI_CHAT_V0_2_IMPLEMENTATION_PLAN.md`

按目标文件读取最近的 `AGENTS.md`。如果修改 `apps/web/**`，读取 `apps/AGENTS.md` 和 `apps/web/AGENTS.md`。如果修改 `packages/db/**`，读取 `packages/AGENTS.md` 和 `packages/db/AGENTS.md`。如果修改 `packages/ai/**`，读取 `packages/AGENTS.md` 和 `packages/ai/AGENTS.md`。

## 硬性规则

- 每次只执行一个 TASK。
- 不允许一次性开发全部 v0.3。
- 不允许进入 v0.4/v0.5。
- 不允许接 MCP。
- 不允许接 credits charging。
- 不允许创建 worker/gateway/studio/design-system split。
- 不允许创建 `/api/chat`。
- 不允许破坏 v0.2 `/api/ai/chat`。
- 不允许把 Mastra runtime 放进 `packages/ai`。
- 不允许自研完整 memory/RAG/vector/reranker/workflow。
- 不允许 helper/service 假完成。
- 如果没有接入真实 `/api/ai/chat` 或 UI，完成报告必须写 `PARTIAL UNTIL WIRED`。
- 不允许未经确认新增依赖。
- 不允许未经确认改 env schema。
- 不允许未经确认改 schema。
- 不允许未经确认生成 migration。
- 不允许未经确认改 lockfile。

## 必须证明

完成后必须证明：

- 使用了哪些 Mastra 能力。
- AeloKit 负责了哪些边界。
- 是否接入真实主路径。
- 是否破坏 v0.2 chat。
- 是否保持 usage audit。
- 是否保持 credits ledger 不变。
- Storage / DB / Vector 如何验证。

## TASK

粘贴 `docs/product/AI_MASTRA_MEMORY_KNOWLEDGE_V0_3_TASKS.md` 中对应 TASK 的完整内容。

## 完成报告格式

输出：

1. 修改文件列表
2. 实现摘要
3. Mastra 能力使用说明
4. AeloKit 产品边界说明
5. 主路径接入证明
6. v0.2 chat regression 结果
7. Static Checks
8. Runtime Smoke
9. Storage / DB / Vector Verification
10. 未完成事项
11. Open Questions 更新
12. 是否满足本 TASK 验收标准
13. 是否有 blocker
14. 建议 commit message
```
