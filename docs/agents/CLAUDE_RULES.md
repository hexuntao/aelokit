# Claude Code Rules

本文件定义 Claude Code 在 AeloKit 仓库中的专属读取规则。它补充根 `AGENTS.md`，不替代任何更高优先级规则。

## 1. CLAUDE.md Role

`CLAUDE.md` 只是 Claude Code 的短摘要入口，用于快速指向：

- root `AGENTS.md`
- nearest `AGENTS.md`
- `docs/INDEX.md`
- 当前版本 `DOCUMENT_INPUTS.md`
- 当前版本 Scope Freeze / Acceptance Criteria / Implementation Plan

`CLAUDE.md` 不应重复大量 package、shim、env、历史 gate 细节。

## 2. Priority

发生冲突时，Claude Code 必须按以下顺序解释：

1. 当前用户 prompt。
2. 当前版本 `SCOPE_FREEZE.md`。
3. 当前版本 `ACCEPTANCE_CRITERIA.md`。
4. 当前版本 `IMPLEMENTATION_PLAN.md`。
5. 当前版本 `DOCUMENT_INPUTS.md`。
6. `docs/INDEX.md`。
7. root `AGENTS.md`。
8. nearest `AGENTS.md`。
9. `docs/agents/CLAUDE_RULES.md`。
10. `CLAUDE.md`。

`CLAUDE.md` 不能覆盖 `AGENTS.md`、nearest `AGENTS.md`、`docs/INDEX.md`、当前用户 prompt 或当前版本 Scope Freeze。

## 3. Document Inputs

Claude Code 也必须通过当前版本 `DOCUMENT_INPUTS.md` 获取最小输入集。

Claude Code 不得默认读取全部 `docs/product/`，不得把旧 Prompt、旧 Implementation Plan、旧 Scope Freeze 或旧 Validation Report 当作当前需求。

## 4. Historical Gates

历史版本 gate 只能作为 regression guardrail。它们可以帮助 Claude Code 避免破坏已完成能力，但不能定义当前版本 scope。

