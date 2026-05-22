# AeloKit Documentation Index

## 1. Purpose

本文件是 Codex / Claude Code / human 后续读取 AeloKit 文档的入口。后续任务应先通过本文件判断哪些文档是当前依据、哪些只是历史背景，避免把旧 Prompt、旧 Scope Freeze、旧 Implementation Plan 或旧 Validation Report 当成当前需求。

## 2. Current Product Stage

- v0.1: AI contracts foundation / historical
- v0.2: AI chat foundation / historical
- v0.3: Mastra memory + knowledge / accepted with notes
- v0.4: AI stack / runtime boundary hardening / historical with accepted notes
- v0.5: Usage / Credits / Admin Audit / previous implementation
- v0.6: Worker / Gateway / Studio Split Evaluation / current planning

当前 v0.6 文档入口位于 `docs/product/v0.6/`。v0.6 只做 app split evaluation，不创建新 app，不移动现有 `apps/web` 路由。

## 3. Authoritative Reading Order

后续任务按以下优先级读取和解释文档：

1. 当前用户任务 Prompt
2. 当前版本 `SCOPE_FREEZE.md`
3. 当前版本 `ACCEPTANCE_CRITERIA.md`
4. 当前版本 `IMPLEMENTATION_PLAN.md`
5. 当前版本 `DOCUMENT_INPUTS.md`
6. `docs/INDEX.md`
7. root `AGENTS.md`
8. nearest `AGENTS.md`
9. `docs/agents/AGENT_RULES_INDEX.md`
10. tool-specific agent rules
11. Active architecture docs
12. Active product docs
13. Historical docs
14. Validation reports
15. Old Codex prompts

如果当前版本文档尚不存在，不得用旧版本 Scope Freeze 或 Prompt 补位。

## 4. Active Documents

当前仍有效、可作为 v0.6 planning 和 v0.5 validation context 输入的文档：

- `docs/INDEX.md`
- `docs/product/v0.6/SCOPE_FREEZE.md`
- `docs/product/v0.6/SPLIT_EVALUATION.md`
- `docs/product/v0.6/APP_DECISION_MATRIX.md`
- `docs/product/v0.6/ROUTE_OWNERSHIP_MAP.md`
- `docs/product/v0.6/DEPENDENCY_PLAN.md`
- `docs/product/v0.6/IMPLEMENTATION_PLAN.md`
- `docs/product/v0.6/ACCEPTANCE_CRITERIA.md`
- `docs/product/v0.6/CODEX_PROMPT.md`
- `docs/product/v0.5/SCOPE_FREEZE.md`
- `docs/product/v0.5/ACCEPTANCE_CRITERIA.md`
- `docs/product/v0.5/IMPLEMENTATION_PLAN.md`
- `docs/product/v0.5/CREDITS_STATE_MACHINE.md`
- `docs/product/v0.5/CODEX_PROMPT.md`
- `docs/product/v0.5/VALIDATION_REPORT.md`
- `docs/DOCUMENTATION_AUDIT.md`
- `docs/DOCUMENTATION_REORG_PLAN.md`
- `docs/product/v0.4/OPEN_QUESTIONS.md`
- `docs/agents/AGENT_RULES_INDEX.md`
- `docs/agents/CODEX_RULES.md`
- `docs/agents/CLAUDE_RULES.md`
- `README.md`
- `package.json`
- `AGENTS.md`，作为永久工程规则和 docs entrypoint pointer，不定义 v0.4 scope
- `apps/AGENTS.md`
- `apps/web/AGENTS.md`
- `packages/AGENTS.md`
- `docs/product/AELOKIT_AI_SAAS_PLATFORM_PRD.md`
- `docs/architecture/AI_RUNTIME_LAYERING.md`
- `docs/architecture/AI_AGENT_INFRASTRUCTURE_BOUNDARIES.md`
- `docs/architecture/AELOKIT_PACKAGE_BOUNDARIES.md`

## 5. Historical Documents

以下文档只能作为历史背景，不得覆盖后续版本 Scope Freeze：

v0.1:

- `docs/product/AI_CONTRACTS_FOUNDATION_ENTRYPOINT.md`
- `docs/product/AI_CONTRACTS_FOUNDATION_SCOPE_FREEZE.md`
- `docs/product/AI_CONTRACTS_FOUNDATION_ACCEPTANCE.md`
- `docs/product/AI_CONTRACTS_FOUNDATION_IMPLEMENTATION_PLAN.md`
- `docs/product/AI_CONTRACTS_FOUNDATION_OPEN_QUESTIONS.md`
- `docs/product/AI_CONTRACTS_FOUNDATION_CODEX_PROMPT.md`

v0.2:

- `docs/product/AI_CHAT_V0_2_SCOPE_FREEZE.md`
- `docs/product/AI_CHAT_V0_2_ACCEPTANCE.md`
- `docs/product/AI_CHAT_V0_2_IMPLEMENTATION_PLAN.md`
- `docs/product/AI_CHAT_V0_2_OPEN_QUESTIONS.md`
- `docs/product/AI_CHAT_V0_2_SCHEMA_DESIGN.md`
- `docs/product/AI_CHAT_V0_2_DEPENDENCY_RESEARCH.md`
- `docs/product/AI_CHAT_V0_2_CODEX_PROMPT.md`

v0.3:

- `docs/product/AI_MASTRA_MEMORY_KNOWLEDGE_V0_3_ENTRYPOINT.md`
- `docs/product/AI_MASTRA_MEMORY_KNOWLEDGE_V0_3_SCOPE_FREEZE.md`
- `docs/product/AI_MASTRA_MEMORY_KNOWLEDGE_V0_3_ACCEPTANCE.md`
- `docs/product/AI_MASTRA_MEMORY_KNOWLEDGE_V0_3_IMPLEMENTATION_PLAN.md`
- `docs/product/AI_MASTRA_MEMORY_KNOWLEDGE_V0_3_OPEN_QUESTIONS.md`
- `docs/product/AI_MASTRA_MEMORY_KNOWLEDGE_V0_3_DEPENDENCY_DECISION.md`
- `docs/product/AI_MASTRA_MEMORY_KNOWLEDGE_V0_3_TASKS.md`
- `docs/product/AI_MASTRA_MEMORY_KNOWLEDGE_V0_3_CODEX_PROMPT.md`
- `docs/product/AI_MASTRA_MEMORY_KNOWLEDGE_V0_3_VALIDATION_REPORT.md`

v0.4:

- `docs/product/v0.4/DOCUMENT_INPUTS.md`
- `docs/product/v0.4/V0_3_HANDOFF.md`
- `docs/product/v0.4/OPEN_QUESTIONS.md`
- `docs/product/v0.4/SCOPE_FREEZE.md`
- `docs/product/v0.4/ACCEPTANCE_CRITERIA.md`
- `docs/product/v0.4/IMPLEMENTATION_PLAN.md`
- `docs/product/v0.4/PRODUCT_PRD.md`
- `docs/product/v0.4/AI_STACK_DECISION_RECORD.md`
- `docs/product/v0.4/RUNTIME_BOUNDARY_HARDENING_PLAN.md`
- `docs/product/v0.4/CITATION_PERSISTENCE_DESIGN.md`
- `docs/product/v0.4/SMOKE_AND_VECTOR_VERIFICATION_PLAN.md`
- `docs/product/v0.4/OFFICIAL_DOCS_RESEARCH.md`
- `docs/product/v0.4/PROGRESS_LOG.md`
- `docs/product/v0.4/VALIDATION_REPORT.md`
- `docs/product/v0.4/FINAL_ACCEPTANCE_REPORT.md`
- `docs/product/v0.4/CODEX_GOAL_PROMPT.md`
- `docs/product/v0.4/ALLOWED_PATHS.md`

## 6. Reference Only Documents

这些文档只能参考，不能单独作为 v0.4 范围依据：

- `README.zh-CN.md`
- `CLAUDE.md`，Claude Code short summary only
- `turbo.json`
- `pnpm-workspace.yaml`
- `env.example`
- `docs/agents/domain.md`
- `docs/architecture/AELOKIT_MONOREPO_EVOLUTION_PLAN.md`
- `docs/architecture/AELOKIT_APP_SPLIT_PLAN.md`
- `docs/architecture/DESIGN_SYSTEM_PLAN.md`
- `apps/web/content/docs/**`

## 7. Deprecated / Needs Review Documents

以下文档疑似过期或需要人工确认后更新状态：

- `apps/web/AGENTS.md`: AI Web App 边界仍使用 v0.2 文案，需要更新为 current + historical split。
- `docs/product/AI_CHAT_V0_2_SCHEMA_DESIGN.md`: 写着待确认，但代码已存在 `packages/db/src/ai.schema.ts`。
- `docs/product/AI_MASTRA_MEMORY_KNOWLEDGE_V0_3_SCOPE_FREEZE.md`: 写着 Planning only，但 v0.3 已 accepted with notes。
- `docs/architecture/AELOKIT_MONOREPO_EVOLUTION_PLAN.md`: 部分 current/future 状态已被代码推进。
- `docs/product/AI_AGENT_INFRASTRUCTURE_ROADMAP.md`: v0.1-v0.3 状态应改为 historical/accepted notes，v0.4 仍需单独规划。

## 8. Conflict Resolution Rule

- 当前版本 Scope Freeze 优先于历史版本文档。
- 当前用户 Prompt 优先于仓库历史 Prompt。
- `AGENTS.md` 定义工程边界，不定义新产品范围。
- `CLAUDE.md` 只作为 Claude Code 工作流摘要，不能覆盖 `AGENTS.md` 和当前版本 Scope Freeze。
- `docs/agents/CODEX_RULES.md` 和 `docs/agents/CLAUDE_RULES.md` 是 tool-specific 读取规则，不定义产品 scope。
- Validation Report 是验收事实，不是下一版本需求。
- Codex Prompt 是执行指令，不是长期产品文档。
- 如果文档冲突，必须写 `OPEN_QUESTIONS.md`，不允许猜。

## 9. Historical v0.4 Planning Gate

v0.4 planning 可以在以下治理文件完成并被人工确认后开始：

- `docs/DOCUMENTATION_AUDIT.md`
- `docs/INDEX.md`
- `docs/DOCUMENTATION_REORG_PLAN.md`
- `docs/product/v0.4/DOCUMENT_INPUTS.md`
- `docs/product/v0.4/V0_3_HANDOFF.md`
- `docs/product/v0.4/OPEN_QUESTIONS.md`
- `docs/agents/AGENT_RULES_INDEX.md`
- `docs/agents/CODEX_RULES.md`
- `docs/agents/CLAUDE_RULES.md`

这些条件当前已完成。v0.4 implementation 事实与验收以
`docs/product/v0.4/SCOPE_FREEZE.md`, `ACCEPTANCE_CRITERIA.md`,
`IMPLEMENTATION_PLAN.md`, `VALIDATION_REPORT.md` 和
`FINAL_ACCEPTANCE_REPORT.md` 为准。

## 10. v0.5 Implementation Gate

v0.5 implementation 已由当前用户任务确认，主题为 Usage / Credits / Admin
Audit。当前依据是：

- `docs/product/v0.5/SCOPE_FREEZE.md`
- `docs/product/v0.5/ACCEPTANCE_CRITERIA.md`
- `docs/product/v0.5/IMPLEMENTATION_PLAN.md`
- `docs/product/v0.5/CREDITS_STATE_MACHINE.md`
- `docs/product/v0.5/VALIDATION_REPORT.md`

v0.4 embedding blocker 是当前环境问题，不作为 v0.5 failure。

## 11. v0.6 Planning Gate

v0.6 当前只做 Worker / Gateway / Studio Split Evaluation。当前依据是：

- `docs/product/v0.6/SCOPE_FREEZE.md`
- `docs/product/v0.6/SPLIT_EVALUATION.md`
- `docs/product/v0.6/APP_DECISION_MATRIX.md`
- `docs/product/v0.6/ROUTE_OWNERSHIP_MAP.md`
- `docs/product/v0.6/DEPENDENCY_PLAN.md`
- `docs/product/v0.6/IMPLEMENTATION_PLAN.md`
- `docs/product/v0.6/ACCEPTANCE_CRITERIA.md`
- `docs/product/v0.6/CODEX_PROMPT.md`

v0.6 默认不创建 `apps/worker`, `apps/gateway`, `apps/admin`,
`apps/studio`, `apps/landing`, `apps/docs`, 或 `apps/observability`。
任何 future app creation 都需要用户二次确认。
