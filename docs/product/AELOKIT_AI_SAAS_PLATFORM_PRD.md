# AeloKit AI SaaS 平台底座 PRD

## Problem Statement

AeloKit 当前已经具备 SaaS 产品底座能力，包括认证、支付、积分、邮件、订阅通讯、通知、存储、统计分析、国际化、文档和营销页面等模块。但这些能力仍主要服务于传统 SaaS 应用，尚未形成一个面向 AI SaaS 产品的完整工程底座。

用户真正需要的不是一个孤立的聊天框，而是一套可以构建生产级 AI SaaS 的平台能力：最终用户可以使用 AI 工作台，产品可以定义 Agent、模型、工具、知识库和记忆，运营人员可以审计用量、成本、工具调用和权限，开发者可以在清晰边界下扩展 runtime、worker、gateway、studio 和 design system。

如果只按 `v0.1 ~ v0.8` 的工程路线图推进，团队容易只关注“下一步建哪个目录、装哪个依赖、跑哪个任务”，而忽略最终产品成品的用户价值、商业闭环和平台形态。因此需要一个高层 PRD 作为产品北极星，统一描述 AeloKit 最终要成为怎样的 AI SaaS 工程底座。

## Solution

AeloKit 将演进为一个 AI-native SaaS engineering foundation：它既保留现有 SaaS 底座能力，又提供面向 AI 产品的工作台、Agent runtime、知识库、记忆、工具、MCP、用量审计、credits 计费、管理后台、未来 Studio 和 Gateway。

从用户视角，AeloKit 提供一个 AI Workspace。用户可以登录后进入工作台，选择 Agent 和模型，发起对话，上传文件，查看流式响应、引用来源、工具调用状态和历史线程。系统会持久化 thread、message、message part、tool call 和 usage audit，为后续记忆、知识库、计费和审计提供基础。

从产品团队视角，AeloKit 提供一套可演进的 AI SaaS 架构。它将 assistant-ui 作为 AI 工作台 UI 层，将 Vercel AI SDK 作为 streaming 和 message protocol 层，将 app API routes 作为认证、策略和传输边界，将 app runtime wiring 作为 provider、model、agent、tool 和 policy 的接线层，将可复用 AI contracts 收敛到 AI infrastructure core，并在 v0.3 起采用 Mastra-first 方式集成 memory、knowledge、RAG 以及后续 agent/workflow/tool runtime。

从运营视角，AeloKit 最终要能回答：谁用了哪个模型、哪个 Agent、消耗多少 token、估算成本多少、触发了哪些工具、权限如何判定、请求为什么失败、是否需要退款、是否应该扣 credits、管理员是否能在不默认读取敏感内容的前提下完成审计。

## User Stories

1. 作为 AI SaaS 创业者，我想基于 AeloKit 快速启动一个带 AI 工作台的 SaaS 产品，从而不用从零搭建认证、支付、积分、AI runtime 和后台审计。
2. 作为独立开发者，我想复用 AeloKit 的 AI 架构边界，从而避免把 UI、runtime、DB schema、计费和 provider SDK 混在一起。
3. 作为最终用户，我想登录后进入 AI Workspace，从而在 SaaS 产品内部直接使用 AI 能力。
4. 作为最终用户，我想在一个 thread 中连续对话，从而保留上下文并追踪历史记录。
5. 作为最终用户，我想看到 AI 回复的流式输出，从而获得接近实时的交互体验。
6. 作为最终用户，我想选择不同模型，从而在速度、成本和质量之间做选择。
7. 作为最终用户，我想为单个对话选择模型，从而让不同任务使用不同能力的模型。
8. 作为最终用户，我想在没有设置模型时自动使用系统默认模型，从而无需理解复杂配置也能开始使用。
9. 作为最终用户，我想选择不同 Agent，从而让不同任务使用不同指令、工具和上下文策略。
10. 作为最终用户，我想上传文件作为对话上下文，从而让 AI 能围绕我的资料工作。
11. 作为最终用户，我想看到回答中的引用来源，从而判断 AI 输出是否有依据。
12. 作为最终用户，我想看到工具调用状态，从而知道 AI 正在执行什么动作以及是否成功。
13. 作为最终用户，我想区分普通回答、工具结果、文件、引用和推理片段，从而更容易理解复杂输出。
14. 作为最终用户，我想让系统记住经过确认的偏好和项目背景，从而减少重复说明。
15. 作为最终用户，我想能删除或管理 AI 记忆，从而控制系统长期保存的个人或项目上下文。
16. 作为最终用户，我想在知识库中管理文档，从而让 AI 基于稳定资料回答问题。
17. 作为最终用户，我想知道知识库回答来自哪些 source，从而可以追溯事实依据。
18. 作为最终用户，我想在 AI 执行有副作用的工具前看到权限边界，从而避免意外操作。
19. 作为最终用户，我想知道某次 AI 请求是否失败以及失败原因，从而决定是否重试。
20. 作为付费用户，我想看到自己的 AI 用量和额度状态，从而理解剩余可用能力。
21. 作为管理员，我想查看用户、模型、Agent 和时间维度的 AI 用量，从而分析成本和使用情况。
22. 作为管理员，我想查看 token、估算成本、provider、model 和请求状态，从而排查异常成本。
23. 作为管理员，我想查看 tool call 和 MCP 调用日志，从而审计高风险动作。
24. 作为管理员，我想在默认情况下不读取原始敏感内容也能完成用量审计，从而降低隐私风险。
25. 作为管理员，我想配置系统默认 provider 和 model，从而控制产品默认 AI 体验。
26. 作为管理员，我想管理 Agent 可见性，从而区分系统 Agent、用户 Agent 和未来团队 Agent。
27. 作为管理员，我想查看失败请求和退款状态，从而保证 credits 计费可信。
28. 作为管理员，我想把 AI 用量和订阅权益关联起来，从而让不同 plan 拥有不同 AI 能力。
29. 作为管理员，我想识别异常使用和潜在滥用，从而保护成本和系统稳定性。
30. 作为产品运营人员，我想查看哪些 Agent、工具和知识库最常被使用，从而优化产品体验。
31. 作为产品运营人员，我想逐步推出新模型或新 Agent，从而降低变更风险。
32. 作为产品运营人员，我想把 AI 功能和 credits 产品化，从而形成可售卖的商业闭环。
33. 作为开发者，我想使用稳定的 AI contracts，从而在 app runtime、UI、DB 和 provider 之间保持清晰边界。
34. 作为开发者，我想在 app layer 初始化 provider SDK，从而避免 reusable package 持有 runtime side effects。
35. 作为开发者，我想让 AI package 只表达 contracts、adapter types、usage、permission 和 error，从而保持可复用性。
36. 作为开发者，我想把 route、session、cookies、headers 和 entitlement 留在 app layer，从而避免 package 依赖 Next runtime。
37. 作为开发者，我想使用 assistant-ui 构建 AI 工作台，从而获得成熟的 thread、composer 和 message rendering 能力。
38. 作为开发者，我想使用 Vercel AI SDK 处理 streaming protocol，从而统一 UI message 和 token usage metadata。
39. 作为开发者，我想保留 v0.2 的简单 chat 路径，同时在 v0.3 由 Mastra-first 承担 memory/knowledge/RAG 编排，从而避免自研完整 memory engine 或 RAG pipeline。
40. 作为开发者，我想先记录 usage audit，再接入 credits charging，从而避免计费语义未稳定时影响用户资产。
41. 作为开发者，我想把 memory 和 knowledge 分开建模，从而区分长期行为记忆和可引用资料检索。
42. 作为开发者，我想把 tools 和 skills 分开建模，从而区分可执行动作和可复用能力包。
43. 作为开发者，我想让 MCP 默认走权限模型，从而避免任意外部工具执行。
44. 作为开发者，我想优先支持 remote MCP，再评估 local stdio MCP，从而降低本地执行风险。
45. 作为开发者，我想在未来有 worker 承载 embedding、summary、indexing 和 long-running agent jobs，从而避免请求路由承担后台任务。
46. 作为开发者，我想在未来有 gateway 承载 public API、API key、rate limit 和 model gateway，从而获得独立安全边界。
47. 作为开发者，我想在未来有 studio 构建 Agent、Skill、Workflow 和 Prompt testing，从而把 AI 产品配置能力产品化。
48. 作为开发者，我想在未来有 design system 承载稳定 AI presentation components，从而支持多 app 共享一致体验。
49. 作为开发者，我想每个未来 app 都有明确 split condition，从而避免为了目标目录树过早拆分。
50. 作为团队维护者，我想用 PRD 统一产品目标，从而让工程 roadmap 的每一步都能追溯到用户价值和商业闭环。

## Implementation Decisions

- AeloKit 的产品定位是 AI-native SaaS engineering foundation，而不是单一 chatbot、模型网关或纯 UI starter。
- 现有 `v0.1 ~ v0.8` 保留为 Engineering Roadmap；本 PRD 作为上层 Product PRD，用于定义最终产品形态、用户价值和产品闭环。
- 第一条可感知用户闭环是 AI Workspace：登录用户发起 AI 对话，系统流式返回结果，持久化 thread/message/tool call，并记录 usage audit。
- AI Workspace 的 UI 层使用 assistant-ui；它只负责 thread、composer、message rendering、attachment display、tool-call display、citation display 等 presentation/runtime UI 能力。
- Streaming 和 message protocol 层使用 Vercel AI SDK；它负责 UI message、stream response、tool-call stream protocol、model provider interface 和 usage metadata。
- v0.2 的简单 chat 路径继续由 assistant-ui + Vercel AI SDK + `/api/ai/chat` 承担，不因 v0.3 被重写。
- v0.3 的 Memory + Knowledge 方向采用 Mastra-first：memory runtime、conversation history、working memory、semantic recall、memory processors、document chunking、embedding、vector retrieval、rerank/RAG pipeline 由 Mastra 承担。
- AeloKit 在 v0.3 负责 auth/session/user identity、route access control、user consent、memory enable/disable policy、knowledge source ownership metadata、UI entry/display、citation/source rendering、usage audit、v0.2 chat persistence 和 future credits boundary。
- v0.3 不自研完整 memory engine、完整 RAG pipeline、vector abstraction、reranker 或 workflow engine；也不把 Mastra runtime 放进 `packages/ai`。
- AI infrastructure core 是一个深模块，负责 provider/model/agent/tool/skill/memory/knowledge/MCP/usage/permission/error/runtime type contracts，并对外提供稳定、低变化的接口。
- App runtime wiring 是一个深模块，负责把 auth、locale、entitlement、provider/model selection、policy、analytics、storage、DB 和未来 credits 接入具体 AI runtime。
- Chat persistence 是一个深模块，负责 thread、message、message part、tool call 和 usage audit 的生命周期，而不是把这些逻辑散落在 route handler 或 UI 中。
- Usage and billing policy 是一个深模块，先支持 audit-only usage，再在计费语义稳定后接入 credits preflight、reservation、settlement、refund 和 failed request handling。
- Permissioned tool/MCP layer 是一个深模块，负责 tool registry、skill registry、permission decision、tool call audit、MCP server config、credential reference 和 remote MCP discovery。
- Memory layer 与 Knowledge layer 必须分开。Memory 是系统可长期复用的用户、Agent、项目或 thread 行为上下文；Knowledge 是可追溯来源、可引用的资料检索内容。v0.3 中两者的 runtime 和 retrieval pipeline 采用 Mastra-first，AeloKit 只持有产品边界、来源归属、展示、审计和必要 metadata。
- Admin audit layer 负责用量、成本、provider/model、Agent、tool call、MCP、knowledge 和 failed request 的审计，但默认不把原始敏感内容暴露为管理后台必读数据。
- Credits ledger 始终由 credits domain 拥有。AI runtime 不直接修改 ledger，只能通过 credits domain 提供的 preflight、reservation、settlement 和 refund 能力接入。
- Payment entitlement 始终由 payment domain 和 app policy 共同解释。AI runtime 不直接承担订阅产品策略的所有权。
- Provider key 和 AI provider secret 必须走 server env，不允许泄露到 client component。
- 第一个 AI chat endpoint 必须位于 AI namespace 下，不使用过宽的 generic chat namespace。
- Design system 沉淀发生在 AI workspace 组件稳定之后；只抽取 dependency-clean 的 presentation components，不把 runtime、route、auth、credits 或 server action 放入 design system。
- Future app split 不是产品目标本身。只有当 worker、gateway、admin、studio、docs、landing 或 observability 出现真实部署、权限、安全、性能或生命周期压力时才拆分。
- Studio 是未来产品化能力，面向 Agent builder、Skill builder、Workflow builder、Prompt testing、Tool testing 和 Eval playground；它必须消费统一 AI contracts，而不是重新定义 Agent 模型。
- Gateway 是未来平台能力，面向 public API、API key、model gateway、rate limit、request logging 和 MCP gateway reserve；它不能绕过 credits、audit 或 permission checks。
- Worker 是未来后台能力，面向 embedding、knowledge indexing、thread summary、memory consolidation、usage aggregation、webhook retry 和 long-running agent jobs。
- Observability 是未来运维能力，面向 logs、traces、evals、cost dashboard、model performance 和 workflow run inspection；它不能与 product analytics 混为一谈。

## Testing Decisions

- 测试应验证外部可观察行为，而不是实现细节。例如验证模型选择 fallback、usage audit 记录、权限判定、credits settlement 语义，而不是测试内部函数调用顺序。
- AI contracts 模块应重点测试类型边界、稳定 code、permission allow/deny/reason、usage status/failure reason 和 adapter-compatible mapping。
- App runtime wiring 模块应测试认证用户上下文、locale、entitlement、system default model、user default model、per-thread model 和 fallback 规则。
- Chat persistence 模块应测试 thread/message/message part/tool call/usage audit 的创建、关联、失败路径和边界状态。
- Usage and billing policy 模块应测试 audit-only 与 credits charging 的分离，以及未来 preflight、reservation、settlement、refund、failed request handling 的状态转换。
- Permissioned tool/MCP 模块应测试无权限拒绝、有权限允许、credential 不泄露到 client、tool call audit 可追踪。
- Memory 模块应测试用户同意、启用/禁用策略、删除策略、thread summary 展示和不同 memory scope 的隔离，而不是测试自研 memory engine internals。
- Knowledge 模块应测试 source ownership、citation rendering、访问控制和 storage 关系不丢失；chunking、embedding、retrieval、rerank/RAG pipeline 的 runtime 行为由 Mastra-first 集成验证。
- Admin audit 模块应测试按 user、model、agent、provider、time 查询 usage 和 cost 的能力，并避免默认暴露敏感原文。
- UI 测试应覆盖用户从 AI Workspace 发起对话、看到流式响应、查看工具状态、引用来源和历史线程的关键路径。
- 计费相关测试必须覆盖正常扣费、失败不扣费、退款、重复 settlement 防护和 credits ledger 所有权边界。
- Worker/Gateway/Studio 只有在进入对应阶段后再设计专项测试；当前 PRD 不要求提前创建测试框架。
- 现有仓库已有 package 边界检查、env 检查、typecheck 和 lint 习惯；未来实现应优先扩展这些检查，而不是绕过边界。

## Out of Scope

- 本 PRD 不要求立即实现 `v0.1 ~ v0.8` 的全部能力。
- 本 PRD 不授权安装 Mastra、assistant-ui、Vercel AI SDK 或其他新依赖。
- 本 PRD 不授权创建 AI schema、migration、route、runtime wiring、UI components 或 future apps。
- 本 PRD 不要求立即创建完整 Studio、Gateway、Worker、Observability、Admin split、Docs split 或 Landing split。
- 本 PRD 不覆盖完整 BYOK、team-level model policy、复杂模型价格管理、完整模型能力矩阵管理。
- 本 PRD 不要求在早期支持 local stdio MCP 或无权限任意工具执行。
- 本 PRD 不要求立即把 AI usage 接入 credits charging；早期应先完成 audit-only usage。
- 本 PRD 不替代已有 Engineering Roadmap、Architecture Boundary、Scope Freeze 或 Implementation Plan。

## Further Notes

- Product PRD 和 Engineering Roadmap 应并存：PRD 定义最终产品、用户价值和商业闭环；Roadmap 定义建设顺序、边界和阶段性禁区。
- 当前最重要的产品原则是“先跑通 AI Workspace 的可感知闭环，再扩展 memory、knowledge、tools/MCP、credits 和 admin audit”。
- 当前最重要的架构原则是“contracts、runtime wiring、route、UI、DB schema、credits ledger 各自归位，不把所有 AI 逻辑塞进一个浅模块”。
- 当前最重要的商业原则是“usage audit 先于 credits charging，计费语义稳定后再扣用户资产”。
- 当前最重要的安全原则是“工具和 MCP 必须 permissioned，provider secret 必须 server-only，admin audit 默认不暴露敏感原文”。
- 后续每个工程阶段都应该能回答两个问题：它服务 PRD 中的哪个产品闭环，以及它属于 Engineering Roadmap 中的哪个建设阶段。
