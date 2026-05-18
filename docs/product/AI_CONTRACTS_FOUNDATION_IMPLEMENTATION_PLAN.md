# AI Contracts Foundation Implementation Plan

本计划只覆盖 v0.1：AI Contracts + Data Model Foundation。

执行规则：

- 后续 Codex 每次只执行用户指定的单个 TASK。
- 不允许一次性完成所有 TASK。
- 每个 TASK 必须独立验证、独立提交。
- 每个 TASK 开始前必须重新读取指定 `AGENTS.md` 和 v0.1 文档。
- TASK-001 才允许创建 `packages/ai`。
- 本文档本身不授权创建 v0.2/v0.3/v0.4/v0.5 内容。

## TASK-001：创建 packages/ai package skeleton

### 目标

创建 `@repo/ai` package 的最小 skeleton，使后续 contracts 能在明确 exports 下逐步实现。

### 范围

- 创建 `packages/ai/package.json`。
- 创建 `packages/ai/tsconfig.json`。
- 创建 `packages/ai/src/index.ts`。
- 创建 domain 目录和空的 public entry 文件。
- 创建 `packages/ai/AGENTS.md`。
- 配置 package-local `format`、`lint`、`typecheck` scripts。

### 非目标

- 不实现任何具体 contract。
- 不安装依赖。
- 不接入 AI SDK / Mastra runtime。
- 不创建 schema、route、UI、runtime wiring。

### 前置条件

- 用户明确指定执行 TASK-001。
- 确认当前分支允许创建 `packages/ai`。
- 确认没有未处理的用户工作区变更会被覆盖。

### 必须读取的 AGENTS.md

- `AGENTS.md`
- `packages/AGENTS.md`

### 允许修改文件

- `packages/ai/package.json`
- `packages/ai/tsconfig.json`
- `packages/ai/src/index.ts`
- `packages/ai/src/**/index.ts`
- `packages/ai/AGENTS.md`

### 禁止修改文件

- `apps/web/**`
- `packages/db/**`
- `packages/design-system/**`
- `apps/worker/**`
- `apps/gateway/**`
- `apps/studio/**`
- `pnpm-workspace.yaml`
- root `package.json`
- `.env*`

### 实现要求

- package name 使用 `@repo/ai`。
- package exports 显式覆盖所有 v0.1 subpaths。
- 默认不引入 `ai`、`@mastra/core`、`zod`。
- domain entry 可以先导出空对象或只导出后续类型占位，但不得伪造 runtime。
- `packages/ai/AGENTS.md` 必须写明 owns / does not own / forbidden paths / validation。

### 代码质量要求

- 目录结构必须和 scope freeze 一致。
- 不创建 `common`、`misc`、`core` 目录。
- 不创建无边界聚合文件。

### 英文注释要求

此任务不需要复杂代码注释。若需要说明 skeleton 目的，只允许简短英文注释。

### 验收标准

- `@repo/ai` 能被 pnpm workspace 识别。
- `packages/ai` 有明确 exports。
- 没有创建 forbidden paths。
- 没有新增依赖。

### 验证命令

```bash
pnpm --filter @repo/ai format
pnpm --filter @repo/ai lint
pnpm --filter @repo/ai typecheck
pnpm check:package-exports
```

### Git 提交要求

建议提交：

```txt
chore(ai): add package skeleton
```

### 阻塞处理

如果 package exports checker 不支持新 package，先汇报 checker 的真实错误和最小修复建议；不要绕过检查。

## TASK-002：实现 provider/model contracts

### 目标

定义 provider 和 model registry contracts，为 v0.2 model selection 和 usage audit 提供稳定类型。

### 范围

- `packages/ai/src/providers/**`
- `packages/ai/src/models/**`
- `packages/ai/src/index.ts`

### 非目标

- 不初始化 provider SDK。
- 不读取 env secret。
- 不实现 model pricing UI。
- 不做 provider runtime selection。

### 前置条件

- TASK-001 已完成并提交。
- `@repo/ai` skeleton 验证通过。

### 必须读取的 AGENTS.md

- `AGENTS.md`
- `packages/AGENTS.md`
- `packages/ai/AGENTS.md`

### 允许修改文件

- `packages/ai/src/providers/**`
- `packages/ai/src/models/**`
- `packages/ai/src/index.ts`
- `packages/ai/package.json`，仅当新增直接 import 依赖且已获确认。

### 禁止修改文件

- `apps/web/**`
- `packages/db/**`
- `packages/env/**`
- `env.example`
- `.env*`

### 实现要求

- 定义 `AIProvider`、`AIProviderId`、`AIProviderCapability`。
- 定义 `AIModel`、`AIModelId`、`AIModelCapability`。
- 定义 provider/model enabled status 和 fallback 语义。
- 支持表达 system default provider/model。
- 支持 v0.2 user default model 和 per-thread model reference。
- 不包含 provider SDK client、API key、runtime object。

### 代码质量要求

- 类型命名明确。
- 不使用无意义 `any`。
- 只导出 public contracts。

### 英文注释要求

对 fallback、capability、cost metadata reserve 等不明显语义使用英文注释说明。

### 验收标准

- provider/model contracts 可被 `@repo/ai/providers` 和 `@repo/ai/models` 导出。
- contracts 能支撑 v0.2 user default model、per-thread model、system fallback。
- 没有 runtime execution。

### 验证命令

```bash
pnpm --filter @repo/ai format
pnpm --filter @repo/ai lint
pnpm --filter @repo/ai typecheck
pnpm check:package-exports
```

### Git 提交要求

建议提交：

```txt
feat(ai): add provider and model contracts
```

### 阻塞处理

如果需要 `ai` package 类型才能表达 adapter surface，暂停并说明为什么 structural type 不够，不得私自安装依赖。

## TASK-003：实现 agent/tool/skill contracts

### 目标

定义 agent、tool、skill 的稳定 contracts，为后续 Mastra runtime、tool permission 和 Studio 预留一致边界。

### 范围

- `packages/ai/src/agents/**`
- `packages/ai/src/tools/**`
- `packages/ai/src/skills/**`
- `packages/ai/src/index.ts`

### 非目标

- 不运行 agent。
- 不执行 tool。
- 不创建 skill marketplace。
- 不连接 MCP。
- 不做 UI。

### 前置条件

- TASK-001 已完成。
- TASK-002 已完成或至少 provider/model public contract 已稳定。

### 必须读取的 AGENTS.md

- `AGENTS.md`
- `packages/AGENTS.md`
- `packages/ai/AGENTS.md`

### 允许修改文件

- `packages/ai/src/agents/**`
- `packages/ai/src/tools/**`
- `packages/ai/src/skills/**`
- `packages/ai/src/index.ts`

### 禁止修改文件

- `apps/web/**`
- `packages/db/**`
- `apps/studio/**`
- `apps/worker/**`
- `apps/gateway/**`

### 实现要求

- 定义 `AIAgent`、`AIAgentId`、agent visibility、agent instruction contract。
- 定义 `AIToolDefinition`、`AIToolCallStatus`、tool input/output metadata contract。
- 定义 `AISkillDefinition`、skill capability references。
- Tool 和 Skill 必须分开建模：tool 是 action，skill 是 reusable capability/instruction grouping。
- 所有 execution function 只能是 type surface，不实现 side effect。

### 代码质量要求

- Agent/tool/skill 的 public type 不依赖 app session。
- Tool arguments/result 需要使用 explicit unknown boundary。
- 不暴露 internal implementation helper。

### 英文注释要求

对 tool execution boundary、unknown input/output boundary、skill vs tool 差异使用英文注释说明。

### 验收标准

- `@repo/ai/agents`、`@repo/ai/tools`、`@repo/ai/skills` 可正常导出。
- contracts 能表达 agent profile、tool definition、skill definition。
- 不包含 runtime execution。

### 验证命令

```bash
pnpm --filter @repo/ai format
pnpm --filter @repo/ai lint
pnpm --filter @repo/ai typecheck
pnpm check:package-exports
```

### Git 提交要求

建议提交：

```txt
feat(ai): add agent tool and skill contracts
```

### 阻塞处理

如果 tool contract 需要 permission 类型但 TASK-005 尚未完成，先使用稳定引用接口或暂停说明依赖顺序，不要临时复制 permission 类型。

## TASK-004：实现 memory/knowledge/MCP contracts

### 目标

定义 memory、knowledge、MCP 的 contract 边界，同时保持 v0.3/v0.4 runtime 和 persistence 不进入 v0.1。

### 范围

- `packages/ai/src/memory/**`
- `packages/ai/src/knowledge/**`
- `packages/ai/src/mcp/**`
- `packages/ai/src/index.ts`

### 非目标

- 不创建 memory DB schema。
- 不创建 knowledge base DB schema。
- 不生成 embeddings。
- 不连接 MCP server。
- 不执行 local stdio MCP。

### 前置条件

- TASK-001 已完成。
- TASK-003 已完成或 tool reference contract 已稳定。

### 必须读取的 AGENTS.md

- `AGENTS.md`
- `packages/AGENTS.md`
- `packages/ai/AGENTS.md`

### 允许修改文件

- `packages/ai/src/memory/**`
- `packages/ai/src/knowledge/**`
- `packages/ai/src/mcp/**`
- `packages/ai/src/index.ts`

### 禁止修改文件

- `packages/db/**`
- `apps/web/**`
- `apps/worker/**`
- `apps/gateway/**`
- `apps/studio/**`

### 实现要求

- Memory 和 Knowledge 必须分开建模。
- Memory 表达 durable behavioral/context memory。
- Knowledge 表达 source-grounded retrievable content with provenance。
- MCP contract 必须表达 server、tool discovery、credential reference、permission requirement。
- Local stdio MCP 只能作为 higher-risk future reserve，不实现。

### 代码质量要求

- 不在 contract 中隐藏 provider secret。
- Knowledge source/citation 类型必须能表达 provenance。
- MCP credential 只能是 reference，不是 secret value。

### 英文注释要求

对 memory vs knowledge 差异、MCP credential reference、local stdio risk reserve 使用英文注释说明。

### 验收标准

- `@repo/ai/memory`、`@repo/ai/knowledge`、`@repo/ai/mcp` 可正常导出。
- contracts 不包含 runtime/persistence。
- v0.3/v0.4 边界没有被提前实现。

### 验证命令

```bash
pnpm --filter @repo/ai format
pnpm --filter @repo/ai lint
pnpm --filter @repo/ai typecheck
pnpm check:package-exports
```

### Git 提交要求

建议提交：

```txt
feat(ai): add memory knowledge and mcp contracts
```

### 阻塞处理

如果用户要求 MCP runtime 或 memory persistence，标记为 v0.3/v0.4 越界并等待确认。

## TASK-005：实现 usage/cost/permission/error contracts

### 目标

定义 usage audit、cost estimate、permission decision、AI error contracts，为 v0.2 audit 和 v0.5 credits integration 保持边界。

### 范围

- `packages/ai/src/usage/**`
- `packages/ai/src/permissions/**`
- `packages/ai/src/errors/**`
- `packages/ai/src/index.ts`

### 非目标

- 不扣 credits。
- 不调用 `@repo/credits`。
- 不实现 quota enforcement。
- 不实现 billing settlement。
- 不写 admin audit UI。

### 前置条件

- TASK-001 已完成。
- Provider/model contracts 已能表达 provider/model id。

### 必须读取的 AGENTS.md

- `AGENTS.md`
- `packages/AGENTS.md`
- `packages/ai/AGENTS.md`

### 允许修改文件

- `packages/ai/src/usage/**`
- `packages/ai/src/permissions/**`
- `packages/ai/src/errors/**`
- `packages/ai/src/index.ts`

### 禁止修改文件

- `packages/credits/**`
- `packages/payment/**`
- `packages/db/**`
- `apps/web/**`

### 实现要求

- 定义 `AIUsageRecord` 或等价 contract，支持 user/thread/message/provider/model/tokens/estimated cost/status/error。
- 定义 `AICostEstimate`，只表达 estimate，不表达 final billing。
- 定义 `AIPermissionDecision`，支持 allow/deny/reason。
- 定义稳定 `AIErrorCode` 和 `AIError` contract。
- 区分 audit、estimate、charge、settlement。v0.1 只做 audit/estimate type。

### 代码质量要求

- Error code 必须稳定且可枚举。
- Permission reason 必须可审计。
- Cost estimate 不能暗示已经扣费。

### 英文注释要求

usage/cost/permission/error 的边界条件必须使用英文注释说明，尤其是 audit-only 与 credits charging 的差异。

### 验收标准

- `@repo/ai/usage`、`@repo/ai/permissions`、`@repo/ai/errors` 可正常导出。
- Usage contract 支撑 v0.2 audit。
- 没有 credits mutation。

### 验证命令

```bash
pnpm --filter @repo/ai format
pnpm --filter @repo/ai lint
pnpm --filter @repo/ai typecheck
pnpm check:package-exports
```

### Git 提交要求

建议提交：

```txt
feat(ai): add usage permission and error contracts
```

### 阻塞处理

如果出现必须接入 `@repo/credits` 才能完成的要求，暂停并标记为 v0.5 scope。

## TASK-006：实现 lightweight AI SDK adapter types

### 目标

定义与 Vercel AI SDK 兼容的 lightweight adapter type surface，但不引入 runtime 调用。

### 范围

- `packages/ai/src/adapters/ai-sdk/**`
- `packages/ai/src/runtime-types/**`，仅当 adapter 需要共享 runtime type。
- `packages/ai/src/index.ts`

### 非目标

- 不调用 `streamText`。
- 不创建 AI SDK provider。
- 不导入 assistant-ui。
- 不创建 route handler。
- 不实现 streaming response。

### 前置条件

- TASK-001 已完成。
- TASK-002 和 TASK-003 的基础类型已稳定。

### 必须读取的 AGENTS.md

- `AGENTS.md`
- `packages/AGENTS.md`
- `packages/ai/AGENTS.md`

### 允许修改文件

- `packages/ai/src/adapters/ai-sdk/**`
- `packages/ai/src/runtime-types/**`
- `packages/ai/src/index.ts`
- `packages/ai/package.json`，仅当用户确认直接依赖 `ai` package。

### 禁止修改文件

- `apps/web/src/app/api/ai/**`
- `apps/web/src/ai/**`
- `apps/web/src/components/ai/**`
- root package config，除非用户另行授权。

### 实现要求

- 默认使用 adapter-compatible structural types。
- 如果没有用户确认，不直接 import `ai` package。
- Type surface 应能表达 UI message mapping reserve、stream metadata、tool call stream event reserve。
- 不暴露真实 AI SDK runtime object。

### 代码质量要求

- Adapter type 与 domain contract 分离。
- 不让 AI SDK 概念污染所有 core contracts。
- 不使用 runtime import。

### 英文注释要求

对 structural adapter type、stream metadata reserve、runtime-free boundary 使用英文注释说明。

### 验收标准

- `@repo/ai/adapters/ai-sdk` 可正常导出。
- 没有 AI SDK runtime 调用。
- 没有 route/UI/runtime wiring。

### 验证命令

```bash
pnpm --filter @repo/ai format
pnpm --filter @repo/ai lint
pnpm --filter @repo/ai typecheck
pnpm check:package-exports
```

### Git 提交要求

建议提交：

```txt
feat(ai): add ai sdk adapter types
```

### 阻塞处理

如果 structural types 无法保持兼容，暂停并请求确认是否允许依赖 `ai` package；不要私自安装。

## TASK-007：实现 lightweight Mastra adapter types

### 目标

定义与 Mastra 兼容的 lightweight adapter type surface，但不创建真实 Mastra runtime。

### 范围

- `packages/ai/src/adapters/mastra/**`
- `packages/ai/src/runtime-types/**`，仅当 adapter 需要共享 runtime type。
- `packages/ai/src/index.ts`

### 非目标

- 不创建 Mastra agent instance。
- 不导入或初始化 `@mastra/core`，除非用户明确确认。
- 不实现 workflow runtime。
- 不实现 tool runtime。

### 前置条件

- TASK-001 已完成。
- TASK-003 和 TASK-004 的 agent/tool/memory/MCP contract 已稳定。

### 必须读取的 AGENTS.md

- `AGENTS.md`
- `packages/AGENTS.md`
- `packages/ai/AGENTS.md`

### 允许修改文件

- `packages/ai/src/adapters/mastra/**`
- `packages/ai/src/runtime-types/**`
- `packages/ai/src/index.ts`
- `packages/ai/package.json`，仅当用户确认直接依赖 `@mastra/core`。

### 禁止修改文件

- `apps/web/src/ai/**`
- `apps/web/src/app/api/ai/**`
- `apps/worker/**`
- `apps/studio/**`

### 实现要求

- 默认使用 Mastra-compatible structural types。
- 表达 agent、tool、workflow、memory、MCP bridge 的 type surface。
- 不持有 Mastra runtime instance。
- 不执行 workflow。

### 代码质量要求

- Mastra adapter type 不替代 AeloKit core contracts。
- Adapter 层负责映射边界，不负责产品策略。

### 英文注释要求

对 Mastra bridge boundary、runtime instance 禁止事项、workflow reserve 使用英文注释说明。

### 验收标准

- `@repo/ai/adapters/mastra` 可正常导出。
- 没有 Mastra runtime execution。
- 没有 provider SDK initialization。

### 验证命令

```bash
pnpm --filter @repo/ai format
pnpm --filter @repo/ai lint
pnpm --filter @repo/ai typecheck
pnpm check:package-exports
```

### Git 提交要求

建议提交：

```txt
feat(ai): add mastra adapter types
```

### 阻塞处理

如果必须依赖 `@mastra/core` 的具体类型，暂停并说明 dependency impact，由用户确认后再继续。

## TASK-008：实现 runtime type definitions

### 目标

定义 AI runtime type definitions，为 v0.2 app runtime wiring 提供稳定输入/输出/事件类型，但不实现 runtime。

### 范围

- `packages/ai/src/runtime-types/**`
- `packages/ai/src/index.ts`

### 非目标

- 不写 runtime function。
- 不接 app session。
- 不接 cookies/headers。
- 不接 DB query。
- 不接 streaming route。

### 前置条件

- TASK-002 至 TASK-007 的基础 contract 已稳定，或明确需要先完成本任务中的 shared type。

### 必须读取的 AGENTS.md

- `AGENTS.md`
- `packages/AGENTS.md`
- `packages/ai/AGENTS.md`

### 允许修改文件

- `packages/ai/src/runtime-types/**`
- `packages/ai/src/index.ts`

### 禁止修改文件

- `apps/web/src/ai/**`
- `apps/web/src/app/api/ai/**`
- `packages/db/**`
- `packages/auth/**`

### 实现要求

- 定义 runtime request context 类型。
- 定义 model selection、agent selection、tool call lifecycle、stream event metadata。
- Context 中只允许表达 user/session reference，不执行 session lookup。
- 支持 v0.2 route 在 app 层注入 auth、locale、entitlement、model settings。

### 代码质量要求

- Context type 不依赖 Next.js。
- Runtime type 不包含 DB client。
- Event type 应可扩展，但不能用无边界 string bag 代替稳定字段。

### 英文注释要求

对 app-injected context、session reference、stream metadata lifecycle 使用英文注释说明。

### 验收标准

- `@repo/ai/runtime-types` 可正常导出。
- v0.2 app route 可以基于这些类型设计 runtime wiring。
- 无 runtime side effect。

### 验证命令

```bash
pnpm --filter @repo/ai format
pnpm --filter @repo/ai lint
pnpm --filter @repo/ai typecheck
pnpm check:package-exports
```

### Git 提交要求

建议提交：

```txt
feat(ai): add runtime type definitions
```

### 阻塞处理

如果 runtime type 需要读取 Next request/session，说明这是 v0.2 app layer responsibility，不在 `packages/ai` 中实现。

## TASK-009：冻结 minimal AI data model 文档

### 目标

把 minimal AI data model 的实体、字段语义、关系、非目标和 v0.2 schema 前置条件写清楚，避免 v0.2 schema 反复漂移。

### 范围

- 更新 `docs/product/AI_CONTRACTS_FOUNDATION_SCOPE_FREEZE.md` 中的 minimal AI data model freeze。
- 如用户明确确认，也可拆出独立 `docs/architecture/AI_MINIMAL_DATA_MODEL.md`。

### 非目标

- 不创建 `packages/db/src/ai.schema.ts`。
- 不生成 migration。
- 不运行 db generate/migrate/push。
- 不实现 repository 或 query。

### 前置条件

- 用户明确指定执行 TASK-009。
- 如果要新增独立架构文档，必须先确认文件名和位置。

### 必须读取的 AGENTS.md

- `AGENTS.md`
- `packages/AGENTS.md`
- `packages/db/AGENTS.md`

### 允许修改文件

- `docs/product/AI_CONTRACTS_FOUNDATION_SCOPE_FREEZE.md`
- `docs/product/AI_CONTRACTS_FOUNDATION_ACCEPTANCE.md`
- 用户确认后的独立 minimal data model 文档。

### 禁止修改文件

- `packages/db/src/ai.schema.ts`
- `packages/db/src/schema.ts`
- `packages/db/src/migrations/**`
- `apps/web/**`
- `.env*`

### 实现要求

- 冻结 v0.2 最小实体：provider、model、user model setting、agent、thread、message、message part、tool call、usage。
- 写清每个实体的 owner、核心字段语义、关系、future reserve。
- 写清 v0.2 schema 创建前必须再次确认 schema/migration。
- 明确 v0.3 memory/knowledge 不进入 v0.2 minimal schema。

### 代码质量要求

本任务为文档任务，不写代码。

### 英文注释要求

不适用。若文档展示未来代码注释要求，必须说明复杂逻辑注释使用英文。

### 验收标准

- minimal AI data model 足以指导 v0.2 schema 设计。
- 文档没有创建 schema/migration。
- Open Questions 中仍未确认的问题被保留。

### 验证命令

```bash
git diff -- docs/product/AI_CONTRACTS_FOUNDATION_SCOPE_FREEZE.md docs/product/AI_CONTRACTS_FOUNDATION_ACCEPTANCE.md
git status --short
```

### Git 提交要求

建议提交：

```txt
docs(ai): freeze minimal ai data model
```

### 阻塞处理

如果字段语义需要产品决策，标记为 open question；不要在文档中制造虚假确定性。

## TASK-010：完善 package exports / validation / docs

### 目标

收尾 v0.1，确保 exports、validation、文档和完成报告达到可合并标准。

### 范围

- `packages/ai/package.json`
- `packages/ai/src/index.ts`
- `packages/ai/src/**/index.ts`
- `packages/ai/AGENTS.md`
- `docs/product/AI_CONTRACTS_FOUNDATION_ACCEPTANCE.md`
- `docs/product/AI_CONTRACTS_FOUNDATION_OPEN_QUESTIONS.md`

### 非目标

- 不补做 v0.2 runtime。
- 不为了验证而创建测试框架。
- 不运行 DB 命令。
- 不修改 CI/CD。

### 前置条件

- TASK-001 至 TASK-009 已完成或明确标记不适用。
- 所有 public contracts 已稳定。

### 必须读取的 AGENTS.md

- `AGENTS.md`
- `packages/AGENTS.md`
- `packages/ai/AGENTS.md`

### 允许修改文件

- `packages/ai/package.json`
- `packages/ai/src/index.ts`
- `packages/ai/src/**/index.ts`
- `packages/ai/AGENTS.md`
- `docs/product/AI_CONTRACTS_FOUNDATION_ACCEPTANCE.md`
- `docs/product/AI_CONTRACTS_FOUNDATION_OPEN_QUESTIONS.md`

### 禁止修改文件

- `apps/web/**`
- `packages/db/**`
- `packages/design-system/**`
- root package config，除非用户另行授权。
- CI/CD 配置，除非用户另行授权。

### 实现要求

- 核对所有 exports 与实际文件一致。
- 核对 package exports checker 通过。
- 核对 validation commands 全部记录。
- 核对文档中的 open questions 没有被错误标记为已确认。
- 核对 forbidden paths 未创建。

### 代码质量要求

- Public exports 不泄露 internal helpers。
- 不为通过检查而导出未稳定内容。
- 不引入 deep import。

### 英文注释要求

只对复杂边界注释；不要给普通 re-export 添加注释噪音。

### 验收标准

- 所有必须验证命令通过，或失败原因清楚且不阻塞/已标记阻塞。
- v0.1 acceptance criteria 全部逐项确认。
- 工作区只包含 v0.1 相关变更。

### 验证命令

```bash
pnpm --filter @repo/ai format
pnpm --filter @repo/ai lint
pnpm --filter @repo/ai typecheck
pnpm check:package-exports
pnpm typecheck
git status --short
```

按需：

```bash
pnpm build
```

### Git 提交要求

建议提交：

```txt
chore(ai): finalize contracts foundation exports
```

### 阻塞处理

如果 `pnpm typecheck` 因无关工作区问题失败，必须给出失败文件、错误摘要、是否与本任务相关、当前代码是否可提交。不得把无关失败说成已通过。
