# Documentation Reorganization Plan

本文件只输出重组计划。本轮不移动、不删除、不重命名任何现有文档。

## 1. Goals

- 降低 Codex 上下文污染。
- 保留历史决策。
- 明确当前有效文档。
- 为 v0.4 规划提供最小输入集。

## 2. Proposed Structure

建议后续重组为：

```txt
docs/
  INDEX.md
  DOCUMENTATION_AUDIT.md
  DOCUMENTATION_REORG_PLAN.md
  product/
    current/
      AELOKIT_AI_SAAS_PLATFORM_PRD.md
      AI_AGENT_INFRASTRUCTURE_ROADMAP.md
    v0.4/
      DOCUMENT_INPUTS.md
      V0_3_HANDOFF.md
      OPEN_QUESTIONS.md
      SCOPE_FREEZE.md
      ACCEPTANCE_CRITERIA.md
      IMPLEMENTATION_PLAN.md
      CODEX_PROMPT.md
    archive/
      v0.1/
      v0.2/
      v0.3/
      prompts/
      validations/
  architecture/
    active/
    archive/
  agents/
    active/
      AGENT_RULES_INDEX.md
      CODEX_RULES.md
      CLAUDE_RULES.md
    archive/
```

本轮不要真的移动文件。上述结构是建议，执行前需要人工确认。

## 3. Files Suggested to Keep Active

建议保留为 active/current 的文件：

- `docs/INDEX.md`
- `docs/DOCUMENTATION_AUDIT.md`
- `docs/DOCUMENTATION_REORG_PLAN.md`
- `docs/product/AELOKIT_AI_SAAS_PLATFORM_PRD.md`
- `docs/product/AI_AGENT_INFRASTRUCTURE_ROADMAP.md`，但需更新 v0.1-v0.3 状态并明确 v0.4 仍未计划
- `docs/architecture/AI_RUNTIME_LAYERING.md`
- `docs/architecture/AI_AGENT_INFRASTRUCTURE_BOUNDARIES.md`
- `docs/architecture/AELOKIT_PACKAGE_BOUNDARIES.md`
- `AGENTS.md`，但建议重写为永久规则 + docs entrypoint
- `apps/AGENTS.md`
- `apps/web/AGENTS.md`，但建议移除 v0.2 任务 gate 的当前语气
- `packages/AGENTS.md`

## 4. Files Suggested to Archive

建议后续归档的文件：

v0.1 archive:

- `docs/product/AI_CONTRACTS_FOUNDATION_ENTRYPOINT.md`
- `docs/product/AI_CONTRACTS_FOUNDATION_SCOPE_FREEZE.md`
- `docs/product/AI_CONTRACTS_FOUNDATION_ACCEPTANCE.md`
- `docs/product/AI_CONTRACTS_FOUNDATION_IMPLEMENTATION_PLAN.md`
- `docs/product/AI_CONTRACTS_FOUNDATION_OPEN_QUESTIONS.md`
- `docs/product/AI_CONTRACTS_FOUNDATION_CODEX_PROMPT.md`

v0.2 archive:

- `docs/product/AI_CHAT_V0_2_SCOPE_FREEZE.md`
- `docs/product/AI_CHAT_V0_2_ACCEPTANCE.md`
- `docs/product/AI_CHAT_V0_2_IMPLEMENTATION_PLAN.md`
- `docs/product/AI_CHAT_V0_2_OPEN_QUESTIONS.md`
- `docs/product/AI_CHAT_V0_2_SCHEMA_DESIGN.md`
- `docs/product/AI_CHAT_V0_2_DEPENDENCY_RESEARCH.md`
- `docs/product/AI_CHAT_V0_2_CODEX_PROMPT.md`

v0.3 archive:

- `docs/product/AI_MASTRA_MEMORY_KNOWLEDGE_V0_3_ENTRYPOINT.md`
- `docs/product/AI_MASTRA_MEMORY_KNOWLEDGE_V0_3_SCOPE_FREEZE.md`
- `docs/product/AI_MASTRA_MEMORY_KNOWLEDGE_V0_3_ACCEPTANCE.md`
- `docs/product/AI_MASTRA_MEMORY_KNOWLEDGE_V0_3_IMPLEMENTATION_PLAN.md`
- `docs/product/AI_MASTRA_MEMORY_KNOWLEDGE_V0_3_OPEN_QUESTIONS.md`
- `docs/product/AI_MASTRA_MEMORY_KNOWLEDGE_V0_3_DEPENDENCY_DECISION.md`
- `docs/product/AI_MASTRA_MEMORY_KNOWLEDGE_V0_3_TASKS.md`
- `docs/product/AI_MASTRA_MEMORY_KNOWLEDGE_V0_3_CODEX_PROMPT.md`

validations archive:

- `docs/product/AI_MASTRA_MEMORY_KNOWLEDGE_V0_3_VALIDATION_REPORT.md`

architecture archive or reference-only:

- `docs/architecture/AELOKIT_MONOREPO_EVOLUTION_PLAN.md`
- `docs/architecture/AELOKIT_APP_SPLIT_PLAN.md`
- `docs/architecture/DESIGN_SYSTEM_PLAN.md`

## 5. Files Suggested to Rewrite / Split

- `AGENTS.md` should be split into:
  - permanent engineering rules
  - current repo boundaries
  - pointer to `docs/INDEX.md`
  - short historical gate reference instead of full v0.2/v0.3 gate text
- v0.2 / v0.3 专属规则建议移动到：
  - `docs/product/archive/v0.2/AGENT_RULES.md`
  - `docs/product/archive/v0.3/AGENT_RULES.md`
- `CLAUDE.md` should become Claude-specific summary only:
  - declare it is not the highest rule source
  - point to `AGENTS.md`, nearest `AGENTS.md`, and `docs/INDEX.md`
  - avoid duplicating package/shim/env details
- `docs/product` should be grouped by version:
  - current product docs
  - active upcoming version docs
  - archived completed versions
  - prompts
  - validation reports
- `docs/agents/domain.md` should be updated to mention `docs/INDEX.md` as the documentation entrypoint.
- Consider adding:
  - `docs/agents/AGENT_RULES_INDEX.md`
  - `docs/agents/CODEX_RULES.md`
  - `docs/agents/CLAUDE_RULES.md`

## 6. Migration Safety

If a later task executes document movement:

- 保留 redirect note：原路径留下短文档，说明新位置和历史状态。
- 更新 `docs/INDEX.md` 的 active/historical/reference lists。
- 不移动 `apps/web/content/docs`，除非单独任务明确要求。
- 不改 README 链接，除非用户明确确认。
- 不影响 package exports / build。
- 不修改 `package.json`, `pnpm-lock.yaml`, runtime, UI, DB schema, migrations, or env schema。
- 对移动后的路径运行文件范围检查和 `git diff --stat`。
- 如果 docs content build 受影响，再单独运行 `pnpm --filter @repo/web content`。

## 7. Human Confirmation Required

以下动作必须人工确认后才能执行：

- 移动、归档、重命名任何现有文档。
- 重写根 `AGENTS.md`。
- 重写 `CLAUDE.md`。
- 新增 `docs/agents/AGENT_RULES_INDEX.md`, `docs/agents/CODEX_RULES.md`, `docs/agents/CLAUDE_RULES.md`。
- 将历史版本 gate 从 `AGENTS.md` 提取到 archive 文档。
- 更新 README 指向新的 docs entrypoint。
- 将 `docs/product` 按 version/current/archive 目录实际重组。
- 修改任何 docs 构建、Fumadocs sidebar 或站点内容索引。
