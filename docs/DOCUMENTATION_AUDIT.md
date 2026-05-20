# Documentation Audit

审计日期：2026-05-20  
范围：AeloKit v0.3 后、v0.4 planning 前的文档治理。  
结论：`READY_AFTER_HUMAN_CONFIRMATION`，因为文档入口层已补齐，但 AGENTS / CLAUDE 收敛、历史文档归档和 v0.4 scope freeze 尚需人工确认。

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

- 历史版本规则混入当前规则：根 `AGENTS.md` 仍内联 v0.2 AI Chat Gate、v0.2 Dependency Gate、v0.2 Schema Gate、v0.3 Mastra Gate、v0.3 Env/DB/Validation Gate。这些规则对已完成版本仍有回归价值，但容易被 v0.4 planner 误读为当前 scope。
- `AGENTS.md` 过长：根 `AGENTS.md` 约 376 行，包含永久工程边界、当前结构、历史阶段 gate、shim 规则、env 规则、测试规则和禁止事项。它已经接近“规则总表”，不再是最小入口。
- `CLAUDE.md` 与 `AGENTS.md` 重复：`CLAUDE.md` 约 343 行，重复目录结构、AI guardrail、v0.2/v0.3 gate、shim 边界、env 边界和禁止事项。虽然开头声明冲突时以 `AGENTS.md` 为准，但仍会给 Claude Code / Codex 造成双源阅读成本。
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
| `AGENTS.md` | Active Agent Rules | current plus historical gates | NEEDS_REVIEW | 当前最高工程规则，但混入过多 v0.2/v0.3 历史 gate，建议拆分。 | YES |
| `apps/AGENTS.md` | Active Agent Rules | current | ACTIVE | app ownership 和 future app 禁止事项仍有效。 | YES |
| `apps/web/AGENTS.md` | Active Agent Rules | current plus v0.2 gate | NEEDS_REVIEW | web 边界有效，但 AI Web App 边界仍以 v0.2 文案为主。 | YES |
| `packages/AGENTS.md` | Active Agent Rules | current | ACTIVE | package ownership、exports 和 package creation rules 仍有效。 | YES |
| `docs/agents/domain.md` | Active Agent Rules | current | NEEDS_REVIEW | 仍指向 `docs/product/` 作为 product source of truth，但没有说明 historical/current 分类。 | PARTIAL |
| `CLAUDE.md` | Active Agent Rules | Claude summary | NEEDS_REVIEW | 应收敛成 Claude Code 摘要，不能重复和覆盖 AGENTS/current scope。 | NO |

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
| `docs/product/v0.4/OPEN_QUESTIONS.md` | Open Questions | v0.4 | ACTIVE | 本轮新增，记录 v0.4 planning 前未决问题。 | YES |

### Deprecated / Suspected Stale Docs

| path | category | version | current status | why | can be used for v0.4 planning |
|---|---|---:|---|---|---|
| `docs/product/AI_CHAT_V0_2_SCHEMA_DESIGN.md` | Deprecated / Suspected Stale Docs | v0.2 | NEEDS_REVIEW | 文件写“待确认”，但 schema 已存在；状态应更新或归档。 | NO |
| `docs/product/AI_MASTRA_MEMORY_KNOWLEDGE_V0_3_SCOPE_FREEZE.md` | Deprecated / Suspected Stale Docs | v0.3 | NEEDS_REVIEW | 文件写“Planning only”，但 v0.3 已 accepted with notes。 | NO |
| `docs/architecture/AELOKIT_MONOREPO_EVOLUTION_PLAN.md` | Deprecated / Suspected Stale Docs | roadmap | NEEDS_REVIEW | 文中 `packages/ai` 曾写 Not created yet，但当前已存在；需要状态更新。 | PARTIAL |
| `CLAUDE.md` | Deprecated / Suspected Stale Docs | Claude summary | NEEDS_REVIEW | 与 AGENTS 大量重复，且部分 package dependency 描述比 AGENTS 少 `@repo/env`。 | NO |

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
| C001 | `AGENTS.md` | `docs/product/AI_MASTRA_MEMORY_KNOWLEDGE_V0_3_VALIDATION_REPORT.md` | `AGENTS.md` 仍把 v0.3 gate 写成当前规则，validation report 显示 v0.3 已 accepted with notes。 | v0.4 planner 可能继续按 v0.3 单 TASK gate 执行。 | 根 AGENTS 保留永久回归边界，把 v0.2/v0.3 专属 gate 移到 archive agent rules。 | YES |
| C002 | `CLAUDE.md` | `AGENTS.md` | 两者重复大量工程规则；CLAUDE 虽声明 AGENTS 优先，但内容足够长，容易成为第二套事实源。 | Codex/Claude 读取上下文过大，且发生轻微漂移时难以判断。 | `CLAUDE.md` 收敛为 Claude Code 摘要，只引用 AGENTS、docs/INDEX 和当前 scope freeze。 | YES |
| C003 | `CLAUDE.md` | `AGENTS.md` | `CLAUDE.md` 的 notification/storage/analytics dependency 描述较 AGENTS 少 `@repo/env`，存在细节漂移。 | 后续 package 边界判断可能使用较旧依赖边界。 | 以 AGENTS 和 package/architecture active docs 为准，重写 Claude 摘要。 | YES |
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
4. 将根 `AGENTS.md` 拆分为永久工程规则 + 当前阶段入口引用；v0.2/v0.3 gate 移入 `docs/product/archive/v0.2/AGENT_RULES.md` 和 `docs/product/archive/v0.3/AGENT_RULES.md`。
5. 将 `CLAUDE.md` 改为 Claude Code 专用短摘要，明确“仅摘要，不覆盖 AGENTS.md、docs/INDEX.md、当前用户 Prompt、当前版本 Scope Freeze”。
6. 新增 `docs/agents/AGENT_RULES_INDEX.md`，并视需要拆出 `docs/agents/CODEX_RULES.md` 和 `docs/agents/CLAUDE_RULES.md`。
7. 不建议大规模删除。历史文档应保留决策价值，通过 archive/version 目录和 index 状态收敛语义。
8. v0.4 计划开始前，先由 human 确认 `docs/product/v0.4/OPEN_QUESTIONS.md` 中的问题，并创建 v0.4 Scope Freeze / Acceptance / Implementation Plan。
