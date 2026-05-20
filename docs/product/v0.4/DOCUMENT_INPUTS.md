# v0.4 Document Inputs

## 1. Purpose

本文件定义 v0.4 planning 的最小文档输入集。v0.4 planner 应通过本文件读取当前有效文档，而不是默认读取全部历史 product docs。

本文件不定义 v0.4 具体功能任务。v0.4 implementation 必须等待独立的 `SCOPE_FREEZE.md`, `ACCEPTANCE_CRITERIA.md`, `IMPLEMENTATION_PLAN.md`。

## 2. Required Inputs

v0.4 planning 必须读取：

- `README.md`
- `package.json`
- `AGENTS.md`
- `apps/AGENTS.md`
- `apps/web/AGENTS.md`
- `packages/AGENTS.md`
- `docs/INDEX.md`
- `docs/DOCUMENTATION_AUDIT.md`
- `docs/DOCUMENTATION_REORG_PLAN.md`
- `docs/agents/AGENT_RULES_INDEX.md`
- `docs/agents/CODEX_RULES.md`
- `docs/agents/domain.md`
- `docs/product/v0.4/V0_3_HANDOFF.md`
- `docs/product/v0.4/DOCUMENT_INPUTS.md`
- `docs/product/v0.4/OPEN_QUESTIONS.md`
- `docs/product/AELOKIT_AI_SAAS_PLATFORM_PRD.md`
- `docs/product/AI_AGENT_INFRASTRUCTURE_ROADMAP.md`，只读取 roadmap-level 候选方向，不读取为具体任务
- `docs/architecture/AI_RUNTIME_LAYERING.md`
- `docs/architecture/AI_AGENT_INFRASTRUCTURE_BOUNDARIES.md`
- `docs/architecture/AELOKIT_PACKAGE_BOUNDARIES.md`

如果执行者是 Claude Code，还必须读取：

- `CLAUDE.md`
- `docs/agents/CLAUDE_RULES.md`

如果 v0.4 planning 明确涉及 future app split、worker/gateway/studio 或 design-system，只能在用户明确打开相关范围后再读取：

- `docs/architecture/AELOKIT_MONOREPO_EVOLUTION_PLAN.md`
- `docs/architecture/AELOKIT_APP_SPLIT_PLAN.md`
- `docs/architecture/DESIGN_SYSTEM_PLAN.md`

## 3. Confirmed Governance Decisions

Q001-Q007 已有人工作答：

- Q001: 暂不移动历史文档，只依赖 `docs/INDEX.md` 和本文件控制读取范围。
- Q002: 已新增 agent rules index / Codex rules / Claude rules，并收敛根 `AGENTS.md`。
- Q003: 已收敛 `CLAUDE.md` 为 Claude Code 短摘要。
- Q004: v0.4 planning 先聚焦 AI Stack Decision Record、Runtime Boundary Hardening、v0.3 accepted-with-notes 的验收前置，不直接进入真实 MCP implementation。
- Q005: v0.4 planning 可以开始；implementation acceptance 必须包含 authenticated runtime smoke、DB/vector verification。若后续涉及 MCP/tool runtime，再升级为 planning 前置。
- Q006: v0.4 中设计 citation persistence，但不立即执行 migration，除非单独 Scope Freeze 确认。
- Q007: v0.4 不接真实 third-party MCP，只做 contracts/design/local mock 或安全边界设计。

## 4. Historical Inputs

以下文档只允许作为背景，用于理解过去完成了什么：

- v0.1 AI contracts foundation docs:
  - `docs/product/AI_CONTRACTS_FOUNDATION_*`
- v0.2 AI chat docs:
  - `docs/product/AI_CHAT_V0_2_*`
- v0.3 Mastra memory / knowledge docs:
  - `docs/product/AI_MASTRA_MEMORY_KNOWLEDGE_V0_3_*`
- Validation reports:
  - `docs/product/AI_MASTRA_MEMORY_KNOWLEDGE_V0_3_VALIDATION_REPORT.md`
- Old Codex prompts:
  - `docs/product/AI_CONTRACTS_FOUNDATION_CODEX_PROMPT.md`
  - `docs/product/AI_CHAT_V0_2_CODEX_PROMPT.md`
  - `docs/product/AI_MASTRA_MEMORY_KNOWLEDGE_V0_3_CODEX_PROMPT.md`

## 5. Explicitly Excluded Inputs

v0.4 planning 不应直接使用以下文档作为范围依据：

- 旧 Codex prompt。
- 旧 implementation plan。
- 已完成版本的 scope freeze。
- 已完成版本的 task list。
- 只属于 Claude Code 的行为摘要。
- 旧验收报告中不属于当前需求的描述。
- `apps/web/content/docs/**` 站点内容。
- `docs/architecture/DESIGN_SYSTEM_PLAN.md`，除非 v0.4 明确打开 design-system 相关 scope。
- `docs/architecture/AELOKIT_APP_SPLIT_PLAN.md`，除非 v0.4 明确打开 app split 相关 scope。

## 6. Reading Rules for v0.4 Planner

- 只把 Required Inputs 当作当前规划依据。
- Historical Inputs 只能用于理解过去完成了什么。
- Explicitly Excluded Inputs 不得作为 v0.4 范围依据。
- 如果 Required Inputs 与 Historical Inputs 冲突，以 Required Inputs 为准。
- 如果仍然不确定，写 `OPEN_QUESTIONS.md`。
- v0.4 不允许从旧 v0.2/v0.3 Implementation Plan 继承 TASK 编号或文件修改范围。
- v0.4 不允许把 validation report 的 notes 自动转为任务，必须先经过 v0.4 Scope Freeze。
- v0.4 不允许默认创建 worker/gateway/studio/design-system split。
- v0.4 不允许默认启用 local stdio MCP 或真实 third-party MCP。
- v0.4 planning 可以开始；v0.4 implementation 不能开始，直到当前版本 Scope Freeze / Acceptance Criteria / Implementation Plan 完成并获确认。
