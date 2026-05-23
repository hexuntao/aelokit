# AeloKit Mastra-first 开发总计划

生成日期：2026-05-24

## 1. 目的

本文档用于把 `docs/product/AELOKIT_AI_SAAS_PLATFORM_PRD.md` 落到
Mastra-first 的后续开发路径中。它不是旧 roadmap 的恢复版，也不是新的
v0.x 文档体系；它是基于当前代码、当前 PRD 和当前 `AGENTS.md` 边界形成的
长期执行计划。

本计划的核心判断是：AeloKit 下一阶段的重点不是继续拆目录，而是在现有
`apps/web` 单体内形成完整的 AI SaaS 功能闭环：

- 已登录用户进入 AI Workspace。
- 用户可以选择模型和未来 Agent。
- 系统支持持久化 thread/message/message part/tool call。
- 系统支持可控 memory、knowledge/RAG、citation、tool 调用和 workflow。
- 系统记录 usage audit、cost event 和未来 credits billing 状态。
- 管理员可以在不默认读取敏感原文的前提下审计使用、成本、失败和高风险动作。

## 2. 来源与边界

### 2.1 当前依据

- 产品北极星：`docs/product/AELOKIT_AI_SAAS_PLATFORM_PRD.md`
- 工程边界：`AGENTS.md`
- Web app 边界：`apps/web/AGENTS.md`
- 当前 AI route：`POST /api/ai/chat`
- 当前 app-local AI runtime：`apps/web/src/ai`
- 当前 app-local AI UI：`apps/web/src/components/ai`
- 当前 AI contracts 包：`packages/ai`

### 2.2 明确不做

- 不创建 `apps/worker`、`apps/gateway`、`apps/studio`、`apps/admin`、
  `apps/landing`、`apps/docs` 等 future app。
- 不创建 `packages/design-system`、`packages/ui`、`packages/worker`、
  `packages/gateway` 等 future package。
- 不创建 `/api/chat`；当前 chat stream endpoint 继续是 `/api/ai/chat`。
- 不把 live Mastra runtime 放进 `packages/ai`。
- 不让 `packages/ai` 依赖 DB、Next.js、provider SDK runtime、credits ledger、
  route handler、UI、cookies、headers 或 app session。
- 不默认启用真实 third-party MCP、local stdio MCP、destructive migration 或
  credits charging。
- 不把静态代码审查结果说成 runtime smoke PASS。

### 2.3 Mastra-first 的含义

Mastra-first 的含义是：AeloKit 应最大化利用 Mastra 作为 app-local AI runtime
foundation，用于 Agent、Memory、Tools、Workflow、RAG 编排和后续 Eval /
Observability primitives。

Mastra-first 不等于把所有产品策略交给 Mastra。AeloKit 仍然保留 SaaS policy
shell：

- auth / session / user identity
- route access control
- entitlement / plan policy
- provider / model / agent policy
- thread / message persistence boundary
- usage audit / cost event
- credits preflight / reservation / settlement / refund boundary
- knowledge source ownership / citation display / privacy policy
- admin audit sanitization

一句话原则：

- Mastra 负责执行 agentic primitives。
- AeloKit 负责授权、持久化、审计、计费和展示。

## 3. 当前代码基线

当前代码已经不是空白 Mastra 集成：

- `apps/web/package.json` 已有 `@mastra/core`、`@mastra/memory`、
  `@mastra/pg`、`@mastra/rag`。
- `apps/web/src/ai/mastra/*` 已有 Mastra storage、memory config 和 instance
  helper。
- `apps/web/src/ai/memory/*` 与 `apps/web/src/ai/memory-service.ts` 已使用
  Mastra memory 相关能力处理 confirmed memory。
- `apps/web/src/ai/knowledge/*` 已使用 Mastra RAG/vector 相关能力处理 chunking
  和 vector retrieval。
- `apps/web/src/app/api/ai/chat/route.ts` 仍然直接使用 Vercel AI SDK
  `streamText()` 作为主 chat generation path。
- `apps/web/src/ai/models/*` 已包含模型目录、可选模型、用户默认模型和
  per-chat 模型选择优先级。
- `packages/ai/src/adapters/mastra/index.ts` 是 contract-only bridge metadata，
  不是 live Mastra runtime adapter。

因此下一步不是“引入 Mastra”，而是把 chat generation core 从直接
`streamText()` 收拢到 Mastra Agent runner，同时保留 AeloKit 现有 route、
persistence、audit、billing 和 UI contract。

## 4. External Docs Gate 基线

任何涉及 Mastra API 的实现任务开始前，都必须刷新官方文档。当前计划参考的官方
文档包括：

- Mastra Agent class：
  https://mastra.ai/reference/agents/agent
- Mastra AI SDK UI / streaming integration：
  https://mastra.ai/guides/build-your-ui/ai-sdk-ui
- Mastra Memory storage：
  https://mastra.ai/docs/memory/storage
- Mastra Tools：
  https://mastra.ai/docs/agents/using-tools
- Mastra Runtime Context：
  https://mastra.ai/docs/server-db/runtime-context
- Mastra Workflows：
  https://mastra.ai/ai-workflows

如果官方文档与当前已安装版本冲突，下一次实现任务必须先报告冲突，不允许凭记忆或
旧 API 猜测实现。

## 5. 目标架构

### 5.1 总体链路

```txt
assistant-ui
  -> POST /api/ai/chat
    -> AeloKit policy shell
      -> auth/session/context
      -> entitlement
      -> model/agent selection
      -> thread/message persistence
      -> memory/knowledge context policy
      -> credits preflight/reservation when enabled
      -> Mastra agent runner
      -> usage/cost audit
      -> credits settlement/refund when enabled
```

### 5.2 Runtime ownership

`apps/web/src/app/api/ai/chat/route.ts` 继续作为 HTTP boundary。它不应该继续膨胀
成深业务服务；它应该负责 app policy orchestration，然后把 AI execution 委托给
runtime runner。

`apps/web/src/ai` 继续作为 app-local runtime wiring。Mastra instance、agent
factory、tool registry、runtime context mapping、memory adapter、knowledge
adapter、provider model resolution 都属于这里。

`packages/ai` 继续作为 reusable contract surface。它可以描述 provider、model、
agent、tool、skill、memory、knowledge、MCP、usage、permission、error 和
adapter-compatible shapes，但不能实例化 Mastra 或 provider SDK。

## 6. 开发阶段

### Phase 1：Mastra Agent Core

目标：把主 chat generation path 改造成 Mastra-agent-shaped，同时保持现有 route 和
UI contract 稳定。

范围：

- 在 `apps/web/src/ai` 下新增 app-local Mastra chat agent factory / runner。
- 保留 `/api/ai/chat` 作为唯一 chat stream endpoint。
- 保留 assistant-ui 和当前 transport。
- 保留当前模型选择语义：per-chat model > user default model > system default model。
- 保留当前 thread/message persistence 和 usage audit。
- 保留 credits billing feature flag，默认 audit-only。
- 增加 focused tests，覆盖 runner input mapping、selected model metadata、
  system prompt/context construction、failure handling。

验收：

- route 仍返回 AI SDK-compatible UI message stream。
- assistant message metadata 仍包含 thread、message、provider、model、usage、
  knowledge/citation 等必要字段。
- usage audit / cost audit 每个请求只 finalize 一次。
- `packages/ai` 继续 runtime-free。
- 相关 typecheck、focused Biome check、package export check、DB shim check 和
  focused tests 通过。

本阶段不做：

- 不引入 side-effecting tools。
- 不引入 workflow。
- 不创建新 app 或 package。
- 不重写 AI Workspace UI。
- 不运行 DB migration。

决策门：

- 是否允许新增 `@mastra/ai-sdk`。如果允许，优先使用官方 AI SDK-compatible
  streaming utilities；如果不允许，先做本地 runner abstraction，保持 dependency
  文件不变。

### Phase 2：Memory / Knowledge 进入 Agent Context

目标：把当前 memory 和 knowledge 的 prompt assembly 收拢到更清晰的
Mastra-first context path，同时不削弱 AeloKit 的产品边界。

范围：

- Memory 与 Knowledge 继续分开。
- Memory 只使用 confirmed、user-controlled 的内容。
- Knowledge retrieval 继续遵守 source ownership 和 access control。
- Mastra memory/storage 可以提供 conversation 和 memory context，但 AeloKit 继续
  控制 consent、enable/disable policy、source ownership 和 UI display。
- Citation metadata 必须贯穿 streaming、persistence、reload 和 UI display。
- Knowledge error 不能被包装成误导性的成功引用结果。

验收：

- memory-enabled chat 只使用确认过且允许的 memory。
- knowledge-enabled chat 只有在真实 retrieved chunks 被使用时才返回 citations。
- source/citation metadata 可以持久化到 message parts 并在 reload 后恢复。
- base chat runtime 与 knowledge/vector runtime 分开验收。
- 没有 authenticated runtime evidence 时，不标记 runtime smoke PASS。

本阶段不做：

- 不自研完整 RAG engine。
- 不把 Memory 和 Knowledge 合并成一个概念或一组表。
- 不让 admin audit 默认读取敏感原文。

决策门：

- 是否允许 DB/vector/provider smoke。未确认前，静态检查只能证明 code-level readiness。

### Phase 3：Permissioned Tools 与 MCP-ready Registry

目标：让 Agent 能使用 typed tools，同时确保每个动作都 permissioned、auditable、
product-safe。

范围：

- 定义 app-local Mastra tool registry，映射到 `packages/ai` 的 tool / permission
  contracts。
- 从 read-only、低风险工具开始。
- 持久化 tool call lifecycle，并纳入 usage audit。
- 保留 abort handling 和 failure status。
- 保持 assistant-ui tool rendering 兼容。
- MCP 作为 permissioned future extension 预留，不默认启用真实外部访问。

验收：

- 至少一个 read-only tool 能通过 Mastra agent path 调用。
- tool input/output 有 schema validation。
- tool call status 能持久化并在 AI Workspace 中展示。
- permission denial 明确且可审计。
- provider secret、credential、token、cookie、auth header 不进入 client payload。

本阶段不做：

- 不启用 arbitrary remote MCP。
- 不启用 local stdio MCP。
- 不增加 destructive tools。
- 不绕过 AeloKit permission decision 直接执行 Mastra tool。

决策门：

- 确认第一个真实工具领域。建议优先选择 read-only knowledge inspection 或
  read-only account metadata，而不是 payment、storage mutation 或外部副作用。

### Phase 4：Workflows、Evals 与 Observability

目标：把需要明确步骤、可恢复、可审计的 AI 操作交给 Mastra workflow / eval /
observability primitives，而不是继续堆在单个 route 或单个 agent loop 里。

适合优先 workflow 化的候选能力：

- knowledge ingestion quality review
- citation-grounded answer quality eval
- tool approval and execution
- memory confirmation and consolidation
- failed usage audit reconciliation

范围：

- 只有当 single-agent loop 过于隐式时才引入 workflow。
- workflow run ID 要能进入 AeloKit audit surface。
- eval/scorer 结果作为 product observability，不作为无证据的 PASS 声明。
- 失败、重试、取消状态必须可追踪。

验收：

- workflow run 能从用户动作追踪到 audit entry。
- failure、retry、cancelled 状态明确。
- admin 可以看到高层 workflow status，默认不读取敏感原文。
- workflow 不要求立即拆 `apps/worker` 或 `apps/studio`。

本阶段不做：

- 不创建 Studio app。
- 不创建 Worker app。
- 不把 workflow 存在本身当成 observability。
- 不把 long-running job 无边界地塞进 request route。

决策门：

- 确认第一个产品 workflow。优先选择审计价值高、破坏性低的工作流。

### Phase 5：Admin、Credits 与 Product Controls

目标：让 AI usage 变得可理解、可控制、可商业化，同时保持计费安全。

范围：

- 扩展 admin usage audit，覆盖 user、provider、model、agent、status、cost、
  tool calls、knowledge usage、workflow runs。
- 保持 audit metadata sanitization。
- credits mutation 继续由 `@repo/credits` 拥有。
- billing 默认关闭，必须 env + 产品确认后才能启用。
- 暴露更广泛的 model/agent 选择前，先具备 rollout controls。

验收：

- 管理员可以回答谁在什么时候用了哪个 model / agent、消耗多少 token / cost、
  billing 是 settled、refunded、failed 还是 audit-only。
- failed、aborted、timeout、rate-limited 请求不会静默扣费。
- credits reservation / settlement 保持 idempotent。
- route 不绕过 `@repo/credits` 直接修改 credits ledger。

本阶段不做：

- 不静默启用 credits charging。
- 不在 admin view 暴露 provider secret 或敏感原文。
- 不把 payment 产品策略混进 AI runtime。

决策门：

- 启用 production charging 前，必须确认每个 plan 的 AI billing policy。

### Phase 6：Future Splits 只在压力真实出现时发生

目标：只有当现有单体出现真实部署、权限、安全、性能或生命周期压力时，才拆
future app/package。

未来可能拆分：

- Worker：embedding、indexing、summary、memory consolidation、webhook retry、
  long-running agent jobs。
- Gateway：public API、API key、model gateway、rate limit、request logging、
  MCP gateway reserve。
- Studio：agent builder、skill builder、workflow builder、prompt testing、
  tool testing、eval playground。
- Design system：稳定、dependency-clean 的 AI presentation components。

拆分条件：

- 独立部署生命周期。
- 独立安全边界。
- 长任务或后台任务压力。
- 不同 scaling profile。
- 独立产品 surface 和明确 ownership。
- 已确认 route、env、dependency、auth、i18n、analytics、deployment 和 validation
  plan。

本阶段不做：

- 不创建 future directories 作为占位。
- 不因为 PRD 提到未来 app 就立即拆 app。
- 不把仍依赖 app route/action/auth/payment/credits 的 UI 抽进 design system。

## 7. 跨阶段验证策略

每个阶段至少应包含：

- file-scope review 和 forbidden path check
- `git diff --check`
- touched files 的 focused Biome check 或 lint
- route/runtime/UI 变更时运行 `pnpm --filter @repo/web typecheck`
- 触及 DB boundary 时运行 `pnpm check:db-shims`
- 触及 package boundary 或 imports 时运行 `pnpm check:package-exports`
- 触及 env schema 时运行 `pnpm check:env`
- focused tests 覆盖 model selection、agent runner mapping、usage finalization、
  permission decision、tool lifecycle、memory policy、citation persistence

Runtime smoke 独立处理：

- 静态审查可以标记 code ready for smoke。
- 静态审查不能标记 authenticated runtime PASS。
- DB/vector/provider 检查需要明确安全命令；如涉及写入，必须先获得用户确认。

## 8. 推荐下一步实现目标

推荐下一步：Phase 1，Mastra Agent Core。

推荐范围：

- 保留 `/api/ai/chat`。
- 保留 assistant-ui。
- 保留当前 model selection 和 thread/message persistence。
- 增加 app-local Mastra chat agent runner。
- 保留 usage audit 和 credits boundary。
- 增加 focused static tests。
- 不安装 `@mastra/ai-sdk`，除非用户明确确认。
- 不做 runtime smoke，除非用户明确确认。

推荐 `/goal` 草案：

```md
/goal

# Goal: AeloKit Mastra-first Agent Core

## 类型

实现任务。不拆 app，不创建新 package。

## 目标

为现有 `POST /api/ai/chat` route 增加 app-local Mastra-first chat agent
runner，同时保留 assistant-ui、model selection、thread/message persistence、
usage audit 和 credits boundary。

## 必读

- `AGENTS.md`
- `apps/AGENTS.md`
- `apps/web/AGENTS.md`
- `docs/product/AELOKIT_AI_SAAS_PLATFORM_PRD.md`
- `docs/product/AELOKIT_MASTRA_FIRST_DEVELOPMENT_PLAN.md`
- `apps/web/src/app/api/ai/chat/route.ts`
- `apps/web/src/ai/runtime/index.ts`
- `apps/web/src/ai/models/index.ts`
- `apps/web/src/ai/mastra/*`
- `apps/web/src/ai/memory/index.ts`
- `apps/web/src/ai/knowledge/*`
- `apps/web/src/ai/usage/index.ts`
- `apps/web/src/ai/persistence/index.ts`
- `packages/ai/src/adapters/mastra/index.ts`

## External Docs Gate

实施前检查 Mastra 官方最新文档：

- Agent class / stream API
- AI SDK-compatible streaming
- Memory / storage
- Tools
- Runtime context

## Scope

1. 修复 `apps/web/src/ai` 反向 import UI component types 的小边界债。
2. 在 `apps/web/src/ai` 下新增 app-local Mastra chat agent runner / factory。
3. 让 `/api/ai/chat` 通过 runner 执行生成，同时保留 auth、entitlement、
   model resolution、persistence、usage audit、citations 和 billing behavior。
4. 增加 focused tests 覆盖 runner input mapping 和 metadata preservation。
5. 运行 focused static checks。

## Non-goals

- 不创建 `/api/chat`。
- 不把 runtime 放进 `packages/ai`。
- 不创建 future apps 或 packages。
- 不安装依赖，除非用户明确确认。
- 不运行 DB migration。
- 不做 runtime smoke，除非用户明确确认。
- 不启用真实 MCP 或 side-effecting tools。

## Acceptance

- `POST /api/ai/chat` 仍是唯一 chat stream route。
- assistant-ui client contract 保持兼容。
- provider/model/thread/message/usage metadata 保持不丢。
- usage audit 只 finalize 一次。
- credits charging 继续 feature-flagged 且默认关闭。
- `packages/ai` 继续 contract-only。
- 相关 typecheck、focused Biome check、package export check、DB shim check 和
  focused tests 通过。
```

## 9. 待确认问题

- `thread.modelId` 的语义是“创建时使用的模型”还是“最近一次使用的模型”。
  当前代码更接近“最近一次使用的模型”。
- 是否允许新增 `@mastra/ai-sdk`，以使用官方 Mastra-to-AI-SDK stream conversion。
- Phase 1 完成后是否允许做 authenticated browser smoke。
- 第一个真实 tool 选择 knowledge inspection、account metadata，还是其他 read-only
  domain。
- 第一个 auditable Mastra workflow 选择哪个产品场景。

