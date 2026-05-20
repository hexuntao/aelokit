# Documentation Audit

审计日期：2026-05-20  
范围：AeloKit v0.3 后、v0.4 planning 前的文档治理。  
结论：`READY_FOR_V0_4_PLANNING`。第二轮 Documentation Governance Confirmation 已确认 Q001-Q007，并已收敛 AGENTS / CLAUDE / docs/agents 入口。v0.4 implementation 仍必须等待独立 Scope Freeze、Acceptance Criteria 和 Implementation Plan。

## 1. Audit Scope

本次读取和扫描了以下文件与目录：

- Root: `README.md`, `README.zh-CN.md`, `AGENTS.md`, `CLAUDE.md`, `package.json`, `turbo.json`, `pnpm-workspace.yaml`, `env.example`
- Agent Rules: `apps/AGENTS.md`, `apps/web/AGENTS.md`, `packages/AGENTS.md`, `docs/agents/domain.md`
- Product Docs: `docs/product/` 全量 24 个 Markdown 文件
- Architecture Docs: `docs/architecture/` 全量 6 个 Markdown 文件
- App Docs Content: `apps/web/content/docs` 仅索引，不修改
- Code boundary sampling for v0.3 handoff: `apps/web/src/app/api/ai/chat/route.ts`, `apps/web/src/ai/**`, `apps/web/src/components/ai/**`, `packages/ai/src/**`, `packages/db/src/ai.schema.ts`, `packages/db/src/knowledge.schema.ts`, `packages/env/src/**`

`apps/web/content/docs` 当前包含英文/中文 docs、components、config、deployment、layouts、mdx、payments 等内容文件。它们是产品站点内容，不是本轮治理对象，本轮未修改。

## 2. Current Documentation Problems

- 历史版本规则混入当前规则：第一轮审计时根 `AGENTS.md` 内联 v0.2/v0.3 gate，容易被 v0.4 planner 误读为当前 scope。第二轮已收敛为 historical regression guardrail。
- `AGENTS.md` 过长：第一轮审计时根 `AGENTS.md` 约 376 行，混合永久边界和历史 gate。第二轮已重写为永久工程规则 + docs entrypoint pointer。
- `CLAUDE.md` 与 `AGENTS.md` 重复：第一轮审计时 `CLAUDE.md` 约 343 行，重复大量 package/shim/env/gate 细节。第二轮已重写为 Claude Code 短摘要。
- 旧 Prompt 容易被误读为当前需求：`AI_CONTRACTS_FOUNDATION_CODEX_PROMPT.md`, `AI_CHAT_V0_2_CODEX_PROMPT.md`, `AI_MASTRA_MEMORY_KNOWLEDGE_V0_3_CODEX_PROMPT.md` 都是一次性执行指令，不应进入 v0.4 planning 的当前需求集合。
- 验收报告容易被误读为实现计划：`AI_MASTRA_MEMORY_KNOWLEDGE_V0_3_VALIDATION_REPORT.md` 是验收事实与 notes，不是下一版本任务计划。它可以作为 v0.3 handoff 输入，但不能直接变成 v0.4 scope。
- v0.2 / v0.3 约束会影响 v0.4：这些历史 scope freeze 中的“不进入 v0.4 / 不接 MCP / 不接 credits”是历史阶段防越界规则，不应阻止 v0.4 在新 scope freeze 中重新规划相关能力。
- `docs/product` 文件命名不利于版本治理：所有 v0.1/v0.2/v0.3 文档平铺在 `docs/product/`，没有 version/archive/current 分层，历史 implementation plan、scope freeze、open questions 与 active PRD/roadmap 混在同一目录。
- `docs/architecture` 与当前代码状态部分滞后：多个架构文档仍标注 `Status: Planning only` 和 `Current Task: Monorepo Evolution Planning`，但代码已完成 `packages/ai`, `apps/web/src/ai`, `/api/ai/chat`, `packages/db/src/ai.schema.ts`, `packages/db/src/knowledge.schema.ts`。这些文档仍有架构价值，但状态标签需要收敛为 `REFERENCE_ONLY` 或更新。
- 当前代码状态与文档不一致：`AI_MASTRA_MEMORY_KNOWLEDGE_V0_3_SCOPE_FREEZE.md` 状态仍写 `Planning only`，而 v0.3 validation 已 `ACCEPTED WITH NOTES`；v0.2 schema design 仍写待确认，但 `packages/db/src/ai.schema.ts` 已存在。
- Root README 不包含 docs entrypoint：`README.md` / `README.zh-CN.md` 说明产品和启动方式，但未指向 `docs/INDEX.md` 这类治理入口。

## 3. Document Inventory

### Active Product Docs

| path | category | version | current status | why | can be used for v0.4 planning |
|---|---|---:|---|---|---|
| `docs/product/AELOKIT_AI_SAAS_PLATFORM_PRD.md` | Active Product Docs | cross-version | ACTIVE | 产品北极星，明确最终 AI SaaS 形态、边界和非目标；自身声明不替代 roadmap/scope/implementation plan。 | PARTIAL |
| `docs/product/AI_AGENT_INFRASTRUCTURE_ROADMAP.md` | Active Product Docs | roadmap | NEEDS_REVIEW | 包含 v0.1-v0.8 路线，但状态仍是 `Planning only`，且 v0.1-v0.3 已完成。v0.4 段只能作为候选方向，不是具体计划。 | PARTIAL |

### Active Architecture Docs

| path | category | version | current status | why | can be used for v0.4 planning |
|---|---|---:|---|---|---|
| `docs/architecture/AI_RUNTIME_LAYERING.md` | Active Architecture Docs | cross-version | ACTIVE | 分层边界仍有效：assistant-ui、AI SDK、app runtime wiring、packages/ai、Mastra、DB/credits/auth/analytics 的职责分离。 | YES |
| `docs/architecture/AI_AGENT_INFRASTRUCTURE_BOUNDARIES.md` | Active Architecture Docs | cross-version | NEEDS_REVIEW | 核心边界仍有效，但部分“future/current task”措辞已过期；v0.4 MCP 持久化段可作为参考，不是 scope。 | PARTIAL |
| `docs/architecture/AELOKIT_PACKAGE_BOUNDARIES.md` | Active Architecture Docs | cross-version | ACTIVE | package ownership 与 forbidden coupling 仍是 v0.4 必读边界。 | YES |
| `docs/architecture/AELOKIT_MONOREPO_EVOLUTION_PLAN.md` | Active Architecture Docs | roadmap | NEEDS_REVIEW | monorepo 演进路线仍有价值，但 `Current Task`、v0.1-v0.3 状态过期。 | PARTIAL |
| `docs/architecture/AELOKIT_APP_SPLIT_PLAN.md` | Active Architecture Docs | future split | REFERENCE_ONLY | future apps 的 split 条件仍可参考，但 v0.4 不应默认拆 app。 | PARTIAL |
| `docs/architecture/DESIGN_SYSTEM_PLAN.md` | Active Architecture Docs | future design-system | REFERENCE_ONLY | 设计系统边界仍有效，但 v0.4 不应进入 design-system extraction。 | NO |

### Active Agent Rules

| path | category | version | current status | why | can be used for v0.4 planning |
|---|---|---:|---|---|---|
| `AGENTS.md` | Active Agent Rules | current | ACTIVE | 当前最高工程规则，已收敛为永久边界 + docs entrypoint pointer，不定义 v0.4 scope。 | YES |
| `apps/AGENTS.md` | Active Agent Rules | current | ACTIVE | app ownership 和 future app 禁止事项仍有效。 | YES |
| `apps/web/AGENTS.md` | Active Agent Rules | current plus v0.2 gate | NEEDS_REVIEW | web 边界有效，但 AI Web App 边界仍以 v0.2 文案为主。 | YES |
| `packages/AGENTS.md` | Active Agent Rules | current | ACTIVE | package ownership、exports 和 package creation rules 仍有效。 | YES |
| `docs/agents/domain.md` | Active Agent Rules | current | ACTIVE | 已补充 `docs/INDEX.md` 和当前版本 `DOCUMENT_INPUTS.md` 作为读取入口，历史 docs 只能作背景。 | YES |
| `docs/agents/AGENT_RULES_INDEX.md` | Active Agent Rules | current | ACTIVE | 定义 agent rule 文件体系、职责和 historical gate 语义。 | YES |
| `docs/agents/CODEX_RULES.md` | Active Agent Rules | current | ACTIVE | 定义 Codex 读取入口、最小输入集、冲突处理和 `/goal` scope 规则。 | YES |
| `docs/agents/CLAUDE_RULES.md` | Active Agent Rules | current | ACTIVE | 定义 Claude Code 专属读取规则和 `CLAUDE.md` 的非最高优先级。 | YES |
| `CLAUDE.md` | Active Agent Rules | Claude summary | REFERENCE_ONLY | 已收敛为 Claude Code 短摘要，不覆盖 AGENTS/docs/current scope。 | NO |

### Historical Version Docs

| path | category | version | current status | why | can be used for v0.4 planning |
|---|---|---:|---|---|---|
| `docs/product/AI_CONTRACTS_FOUNDATION_ENTRYPOINT.md` | Historical Version Docs | v0.1 | HISTORICAL | v0.1 entrypoint，已完成阶段背景。 | NO |
| `docs/product/AI_CONTRACTS_FOUNDATION_SCOPE_FREEZE.md` | Historical Version Docs | v0.1 | HISTORICAL | v0.1 scope freeze，不得覆盖 v0.4 scope。 | NO |
| `docs/product/AI_CONTRACTS_FOUNDATION_ACCEPTANCE.md` | Historical Version Docs | v0.1 | HISTORICAL | v0.1 acceptance，仅用于回归理解。 | NO |
| `docs/product/AI_CONTRACTS_FOUNDATION_IMPLEMENTATION_PLAN.md` | Historical Version Docs | v0.1 | HISTORICAL | v0.1 implementation tasks，不是当前任务。 | NO |
| `docs/product/AI_CHAT_V0_2_SCOPE_FREEZE.md` | Historical Version Docs | v0.2 | HISTORICAL | v0.2 scope freeze，不得把“不做 v0.3+”解释为当前禁令。 | NO |
| `docs/product/AI_CHAT_V0_2_ACCEPTANCE.md` | Historical Version Docs | v0.2 | HISTORICAL | v0.2 acceptance，可用于回归边界。 | PARTIAL |
| `docs/product/AI_CHAT_V0_2_IMPLEMENTATION_PLAN.md` | Historical Version Docs | v0.2 | HISTORICAL | v0.2 task list，不能作为 v0.4 work items。 | NO |
| `docs/product/AI_CHAT_V0_2_SCHEMA_DESIGN.md` | Historical Version Docs | v0.2 | HISTORICAL | schema design 已被代码实现推进，当前只能作历史设计参考。 | NO |
| `docs/product/AI_CHAT_V0_2_DEPENDENCY_RESEARCH.md` | Historical Version Docs | v0.2 | HISTORICAL | 旧依赖研究，版本可能过期；不要作为当前 install plan。 | NO |
| `docs/product/AI_MASTRA_MEMORY_KNOWLEDGE_V0_3_ENTRYPOINT.md` | Historical Version Docs | v0.3 | HISTORICAL | v0.3 entrypoint，已完成阶段背景。 | NO |
| `docs/product/AI_MASTRA_MEMORY_KNOWLEDGE_V0_3_SCOPE_FREEZE.md` | Historical Version Docs | v0.3 | HISTORICAL | v0.3 scope freeze，不能阻止 v0.4 新 scope 决策。 | NO |
| `docs/product/AI_MASTRA_MEMORY_KNOWLEDGE_V0_3_ACCEPTANCE.md` | Historical Version Docs | v0.3 | HISTORICAL | v0.3 acceptance，可用于 regression guardrail。 | PARTIAL |
| `docs/product/AI_MASTRA_MEMORY_KNOWLEDGE_V0_3_IMPLEMENTATION_PLAN.md` | Historical Version Docs | v0.3 | HISTORICAL | v0.3 tasks，不能变成 v0.4 tasks。 | NO |
| `docs/product/AI_MASTRA_MEMORY_KNOWLEDGE_V0_3_DEPENDENCY_DECISION.md` | Historical Version Docs | v0.3 | HISTORICAL | v0.3 dependency placement 事实，可作 handoff 背景。 | PARTIAL |
| `docs/product/AI_MASTRA_MEMORY_KNOWLEDGE_V0_3_TASKS.md` | Historical Version Docs | v0.3 | HISTORICAL | v0.3 task package，不能作为 v0.4 plan。 | NO |

### Validation Reports

| path | category | version | current status | why | can be used for v0.4 planning |
|---|---|---:|---|---|---|
| `docs/product/AI_MASTRA_MEMORY_KNOWLEDGE_V0_3_VALIDATION_REPORT.md` | Validation Reports | v0.3 | REFERENCE_ONLY | `ACCEPTED WITH NOTES` 的验收事实；是 handoff 输入，不是 v0.4 需求。 | PARTIAL |

### Codex Prompts

| path | category | version | current status | why | can be used for v0.4 planning |
|---|---|---:|---|---|---|
| `docs/product/AI_CONTRACTS_FOUNDATION_CODEX_PROMPT.md` | Codex Prompts | v0.1 | HISTORICAL | 一次性执行 prompt。 | NO |
| `docs/product/AI_CHAT_V0_2_CODEX_PROMPT.md` | Codex Prompts | v0.2 | HISTORICAL | 一次性执行 prompt。 | NO |
| `docs/product/AI_MASTRA_MEMORY_KNOWLEDGE_V0_3_CODEX_PROMPT.md` | Codex Prompts | v0.3 | HISTORICAL | 一次性执行 prompt。 | NO |

### Open Questions

| path | category | version | current status | why | can be used for v0.4 planning |
|---|---|---:|---|---|---|
| `docs/product/AI_CONTRACTS_FOUNDATION_OPEN_QUESTIONS.md` | Open Questions | v0.1 | HISTORICAL | 旧阶段问题，多数已被实现/后续文档吸收。 | NO |
| `docs/product/AI_CHAT_V0_2_OPEN_QUESTIONS.md` | Open Questions | v0.2 | HISTORICAL | 旧阶段问题，不能作为当前 blocker。 | NO |
| `docs/product/AI_MASTRA_MEMORY_KNOWLEDGE_V0_3_OPEN_QUESTIONS.md` | Open Questions | v0.3 | HISTORICAL | validation report 已更新部分状态；剩余 notes 应进入 v0.4 handoff。 | PARTIAL |
| `docs/product/v0.4/OPEN_QUESTIONS.md` | Open Questions | v0.4 | ACTIVE | 记录 v0.4 planning 前治理问题；Q001-Q007 已有人工作答。 | YES |

### Deprecated / Suspected Stale Docs

| path | category | version | current status | why | can be used for v0.4 planning |
|---|---|---:|---|---|---|
| `docs/product/AI_CHAT_V0_2_SCHEMA_DESIGN.md` | Deprecated / Suspected Stale Docs | v0.2 | NEEDS_REVIEW | 文件写“待确认”，但 schema 已存在；状态应更新或归档。 | NO |
| `docs/product/AI_MASTRA_MEMORY_KNOWLEDGE_V0_3_SCOPE_FREEZE.md` | Deprecated / Suspected Stale Docs | v0.3 | NEEDS_REVIEW | 文件写“Planning only”，但 v0.3 已 accepted with notes。 | NO |
| `docs/architecture/AELOKIT_MONOREPO_EVOLUTION_PLAN.md` | Deprecated / Suspected Stale Docs | roadmap | NEEDS_REVIEW | 文中 `packages/ai` 曾写 Not created yet，但当前已存在；需要状态更新。 | PARTIAL |
| `apps/web/AGENTS.md` | Deprecated / Suspected Stale Docs | current plus historical v0.2 text | NEEDS_REVIEW | AI Web App 边界仍使用 v0.2 目录规则语气；长期建议拆成 current boundary + historical note。 | PARTIAL |

### Reference Only Docs

| path | category | version | current status | why | can be used for v0.4 planning |
|---|---|---:|---|---|---|
| `README.md` | Reference Only Docs | current | REFERENCE_ONLY | 产品/启动概览。 | PARTIAL |
| `README.zh-CN.md` | Reference Only Docs | current | REFERENCE_ONLY | 中文产品/启动概览。 | PARTIAL |
| `package.json` | Reference Only Docs | current | REFERENCE_ONLY | scripts 和 workspace tooling 事实。 | PARTIAL |
| `turbo.json` | Reference Only Docs | current | REFERENCE_ONLY | task/env pipeline 事实。 | PARTIAL |
| `pnpm-workspace.yaml` | Reference Only Docs | current | REFERENCE_ONLY | workspace layout 事实。 | PARTIAL |
| `env.example` | Reference Only Docs | current | REFERENCE_ONLY | env 参考事实；本轮未修改。 | PARTIAL |
| `apps/web/content/docs/**` | Reference Only Docs | app docs content | REFERENCE_ONLY | 站点文档内容，仅索引，不作为 v0.4 engineering scope。 | NO |

## 4. Conflict Matrix

| conflict id | file A | file B | conflict summary | risk | suggested resolution | human confirmation required |
|---|---|---|---|---|---|---|
| C001 | `AGENTS.md` | `docs/product/AI_MASTRA_MEMORY_KNOWLEDGE_V0_3_VALIDATION_REPORT.md` | 第一轮时 `AGENTS.md` 仍把 v0.3 gate 写成当前规则，validation report 显示 v0.3 已 accepted with notes。 | v0.4 planner 可能继续按 v0.3 单 TASK gate 执行。 | 已收敛：根 AGENTS 保留永久边界，历史 gate 降级为 regression guardrail。 | NO |
| C002 | `CLAUDE.md` | `AGENTS.md` | 第一轮时两者重复大量工程规则，容易成为第二套事实源。 | Codex/Claude 读取上下文过大，且发生轻微漂移时难以判断。 | 已收敛：`CLAUDE.md` 为 Claude Code 短摘要，只引用 AGENTS、docs/INDEX 和当前 scope。 | NO |
| C003 | `CLAUDE.md` | `AGENTS.md` | 第一轮时 `CLAUDE.md` 的 notification/storage/analytics dependency 描述较 AGENTS 少 `@repo/env`。 | 后续 package 边界判断可能使用较旧依赖边界。 | 已收敛：Claude 摘要不再复制这些细节，以 AGENTS 和 active architecture docs 为准。 | NO |
| C004 | `docs/product/AI_CHAT_V0_2_SCHEMA_DESIGN.md` | `packages/db/src/ai.schema.ts` | schema design 仍写待用户确认，代码里已存在 AI schema。 | Codex 可能重复规划 schema 或误判 TASK-005 未发生。 | 把 v0.2 schema design 归档为 historical，并在 v0.3 handoff/current index 标注当前代码事实。 | YES |
| C005 | `docs/architecture/AELOKIT_MONOREPO_EVOLUTION_PLAN.md` | current code | 文档里部分段落仍说 AI infra not created yet，但 `packages/ai` 已存在。 | v0.4 planner 可能把已完成包当成未来包。 | 更新该文档状态或归档到 architecture/archive，active index 只摘取仍有效边界。 | YES |
| C006 | historical Codex prompts | current user prompt | 旧 prompts 明确“不要进入 v0.4/v0.5”，而当前用户要求准备进入 v0.4 planning 前治理文档。 | 旧 prompt 覆盖当前任务，导致拒绝或误停。 | docs/INDEX 明确当前用户 Prompt 优先于仓库历史 Prompt，Codex Prompt 非长期需求。 | NO |
| C007 | validation report | future planning docs | Validation report 的 `ACCEPTED WITH NOTES` 可能被误读为 v0.4 task list。 | notes 被不加确认地转成实现任务。 | V0_3_HANDOFF 仅列 remaining notes 和 blockers，不规划 v0.4 具体功能。 | NO |
| C008 | roadmap v0.4 paragraph | current task | roadmap 已列 Skills/Tools/MCP 候选能力，但当前任务禁止规划 v0.4 具体功能。 | 本轮文档治理越界进入 v0.4 计划。 | 在 `DOCUMENT_INPUTS` 中把 roadmap 标为 PARTIAL，并要求 v0.4 scope freeze 单独产生。 | NO |

## 5. Risk Assessment

如果不整理文档，v0.4 将面临以下风险：

- 上下文污染：Codex 会读取 v0.1-v0.3 全量 implementation plans、tasks、prompts、acceptance，把历史阶段任务误当当前需求。
- Scope 冲突：v0.2/v0.3 的“禁止进入 v0.4/MCP/credits”会与 v0.4 新阶段天然冲突。
- 重复实现：旧 schema design、dependency research、open questions 会让 agent 误判当前代码缺失。
- 规则漂移：`CLAUDE.md` 和 `AGENTS.md` 双源规则可能在 package dependencies、AI runtime placement、env 边界上产生细小但危险的差异。
- 验收误用：validation report 中的 blocked/partial 项可能被直接实现，缺少人工判断是否属于 v0.4。
- 审计成本持续上升：每次 v0.4 task 都需要重新扫 11k+ 行 product/architecture docs，浪费上下文窗口。

## 6. Recommendations

最小文档治理建议：

1. 保留本轮新增的 `docs/INDEX.md` 作为所有后续 Codex / Claude Code / human 的文档入口。
2. 把 `docs/product/v0.4/DOCUMENT_INPUTS.md` 作为 v0.4 planning 的最小输入集，禁止默认读取历史 prompts 和旧 implementation plans。
3. 在人工确认后执行 `docs/DOCUMENTATION_REORG_PLAN.md` 中的归档计划；本轮不移动、不删除。
4. 根 `AGENTS.md` 已收敛为永久工程规则 + 当前阶段入口引用；后续如需移动 v0.2/v0.3 gate 到 archive agent rules，应单独任务执行。
5. `CLAUDE.md` 已改为 Claude Code 专用短摘要，明确“仅摘要，不覆盖 AGENTS.md、docs/INDEX.md、当前用户 Prompt、当前版本 Scope Freeze”。
6. 已新增 `docs/agents/AGENT_RULES_INDEX.md`, `docs/agents/CODEX_RULES.md`, `docs/agents/CLAUDE_RULES.md`。
7. 不建议大规模删除。历史文档应保留决策价值，通过 index 状态和后续 archive/version 目录收敛语义。
8. v0.4 planning 可以开始；v0.4 implementation 前仍必须创建并确认 v0.4 Scope Freeze / Acceptance Criteria / Implementation Plan。

## 7. Documentation Governance Confirmation

第二轮人工决策已写入 `docs/product/v0.4/OPEN_QUESTIONS.md`：

- Q001: 选择 B，暂不移动历史文档。
- Q002: 选择 C，然后 A，先新增 agent rule docs，再收敛根 `AGENTS.md`。
- Q003: 选择 A，重写 `CLAUDE.md` 为短摘要。
- Q004: 选择 C，v0.4 先做 AI Stack Decision Record、Runtime Boundary Hardening 和 v0.3 notes 验收前置，不直接进入真实 MCP implementation。
- Q005: 选择 B，planning 可开始，implementation acceptance 必须包含 authenticated runtime smoke 和 DB/vector verification；涉及 MCP/tool runtime 时升级为 A。
- Q006: 选择 B，v0.4 中设计 citation persistence，但不立即 migration。
- Q007: 选择 A，不接真实 third-party MCP，只做 contracts/design/local mock 或安全边界设计。

因此，文档治理状态为 `READY_FOR_V0_4_PLANNING`。这不代表 v0.4 implementation 已开放。
