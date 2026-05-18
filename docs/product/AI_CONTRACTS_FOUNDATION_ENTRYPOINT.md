# AI Contracts Foundation Entry Point

本文档是 AeloKit v0.1：AI Contracts + Data Model Foundation 的唯一执行入口。

v0.1 的目标是建立 `@repo/ai` contracts foundation 和冻结 minimal AI data model。它不是 AI Workspace、assistant-ui、Mastra runtime、API route、DB schema 或 migration 任务。

## 1. 必须先读

每个 v0.1 TASK 开始前必须按顺序读取：

1. `AGENTS.md`
2. `docs/product/AELOKIT_AI_SAAS_PLATFORM_PRD.md`
3. `docs/product/AI_CONTRACTS_FOUNDATION_ENTRYPOINT.md`
4. `docs/product/AI_CONTRACTS_FOUNDATION_SCOPE_FREEZE.md`
5. `docs/product/AI_CONTRACTS_FOUNDATION_IMPLEMENTATION_PLAN.md`
6. `docs/product/AI_CONTRACTS_FOUNDATION_ACCEPTANCE.md`
7. `docs/product/AI_CONTRACTS_FOUNDATION_OPEN_QUESTIONS.md`

如果任务会修改 `packages/ai/**`，且 `packages/ai/AGENTS.md` 已存在，也必须读取：

1. `packages/AGENTS.md`
2. `packages/ai/AGENTS.md`

如果任务涉及 runtime layering、app split、design-system 或 package boundary 判断，按需读取：

1. `docs/architecture/AI_AGENT_INFRASTRUCTURE_BOUNDARIES.md`
2. `docs/architecture/AI_RUNTIME_LAYERING.md`
3. `docs/architecture/AELOKIT_PACKAGE_BOUNDARIES.md`
4. `docs/architecture/AELOKIT_APP_SPLIT_PLAN.md`
5. `docs/architecture/DESIGN_SYSTEM_PLAN.md`

## 2. 本阶段允许做什么

v0.1 只允许在明确 TASK 范围内做以下事情：

- 创建和完善 `packages/ai` package skeleton。
- 定义 provider/model contracts。
- 定义 agent/tool/skill contracts。
- 定义 memory/knowledge/MCP contracts。
- 定义 usage/cost/permission/error contracts。
- 定义 lightweight Vercel AI SDK adapter-compatible types。
- 定义 lightweight Mastra adapter-compatible types。
- 定义 runtime type definitions。
- 冻结 v0.2 minimal AI data model 的名称、关系和语义。
- 完善 `@repo/ai` exports、package-local rules、open questions 和 acceptance 对照。

## 3. 本阶段绝对不做什么

v0.1 不允许：

- 不实现 AI Workspace UI。
- 不创建 `apps/web/src/components/ai/**`。
- 不创建 `apps/web/src/ai/**`。
- 不创建 `apps/web/src/app/api/ai/**`。
- 不创建 `/api/chat` 或 `/api/ai/chat` route。
- 不创建 `packages/db/src/ai.schema.ts`。
- 不生成 schema 或 migration。
- 不安装 assistant-ui、Vercel AI SDK、Mastra runtime、provider SDK 或测试框架依赖，除非某个 TASK 明确暂停并获得用户确认。
- 不初始化 provider SDK。
- 不创建真实 Mastra agent instance。
- 不执行真实 AI SDK / Mastra runtime。
- 不接入 credits charging、credits reservation、credits settlement 或 credits ledger mutation。
- 不创建 `packages/design-system`。
- 不拆 `apps/admin`、`apps/worker`、`apps/gateway`、`apps/studio`、`apps/docs`、`apps/landing`。

## 4. TASK 执行规则

- 每次只执行一个明确编号的 TASK。
- 不允许一次性完成整个 v0.1。
- 不允许把 v0.2/v0.3/v0.4/v0.5 内容提前塞进 v0.1。
- 如果某个 TASK 需要新增依赖、schema、migration、CI/CD 变更或超出允许文件范围，必须暂停并请求用户确认。
- 每个 TASK 完成后必须独立验证、独立提交或给出建议提交信息。

## 5. 默认验证命令

每个 `packages/ai` 相关 TASK 默认执行：

```bash
pnpm --filter @repo/ai format
pnpm --filter @repo/ai lint
pnpm --filter @repo/ai typecheck
pnpm check:package-exports
```

按需执行：

```bash
pnpm typecheck
```

v0.1 禁止执行：

```bash
pnpm --filter @repo/db db:generate
pnpm --filter @repo/db db:migrate
pnpm --filter @repo/db db:push
```

## 6. 完成报告格式

每个 TASK 的完成报告必须包含：

- 修改了哪些文件。
- 实现了什么。
- 没有实现什么。
- 检查命令结果。
- 是否越界。
- 仍然存在的问题。
- commit hash 或建议 commit message。

## 7. 阶段完成标准

v0.1 结束时应该得到：

- 一个边界清晰的 `@repo/ai` foundation package。
- 明确的 provider/model/agent/tool/skill/memory/knowledge/MCP/usage/permission/error/runtime type contracts。
- lightweight AI SDK 和 Mastra adapter-compatible type surfaces。
- 冻结的 minimal AI data model。
- 清晰的 package exports。
- 不包含 runtime、route、UI、schema、migration、credits charging 或 provider SDK initialization。

v0.1 完成后必须停下，先进行架构体检和 v0.2 方案复审，再决定是否进入 AI Workspace MVP。
