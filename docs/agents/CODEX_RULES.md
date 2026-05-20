# Codex Rules

本文件定义 Codex 在 AeloKit 仓库中的文档读取和执行规则。它补充根 `AGENTS.md`，不替代根规则或 nearest `AGENTS.md`。

## 1. Required Reading Entry

Codex 执行任何非平凡任务前必须先读取：

- `docs/INDEX.md`
- 当前用户 prompt 中点名的文件
- 目标路径上的 root `AGENTS.md` 和 nearest `AGENTS.md`
- 当前版本 `DOCUMENT_INPUTS.md`，如果任务属于某个版本规划或实现

Codex 不得默认读取全部 `docs/product/`。

## 2. Current Version Inputs

当前版本规划或实现只能通过当前版本 `DOCUMENT_INPUTS.md` 获取最小输入集。

对 v0.4：

- 使用 `docs/product/v0.4/DOCUMENT_INPUTS.md` 作为允许读取集合。
- 旧 v0.1 / v0.2 / v0.3 docs 只能按其中的 Historical Inputs 规则读取。
- 未列入 Required Inputs 的旧文档不得自动升级为当前需求。

## 3. Historical Docs Are Not Current Scope

以下文件类型不能作为当前需求依据：

- 旧 Codex Prompt。
- 旧 Implementation Plan。
- 已完成版本的 Scope Freeze。
- 已完成版本的 task list。
- Validation Report 中未经过当前版本 Scope Freeze 确认的 notes。
- Roadmap 中尚未被当前版本 Scope Freeze 接受的候选方向。

旧 Prompt 是一次性执行指令，不是长期产品文档。旧 Validation Report 是验收事实，不是下一版本实现计划。

## 4. Conflict Handling

如果 Codex 发现文档冲突：

- 不得猜测。
- 不得用旧文档覆盖当前用户 prompt。
- 不得用 roadmap 或历史 scope 补齐缺失的当前 scope。
- 必须把问题写入当前版本 `OPEN_QUESTIONS.md`，或在当前任务不允许写入时明确报告。

冲突解释顺序遵守 `docs/INDEX.md` 的 Authoritative Reading Order。

## 5. /goal Execution Rule

使用 `/goal` 或其他自主执行流程时，Codex 必须遵守当前版本：

- `SCOPE_FREEZE.md`
- `ACCEPTANCE_CRITERIA.md`
- `IMPLEMENTATION_PLAN.md`
- `DOCUMENT_INPUTS.md`
- `OPEN_QUESTIONS.md`

没有当前版本 Scope Freeze 时，不得进入实现。只有用户明确要求文档治理、审计或 planning 时，才可以在无 Scope Freeze 的情况下处理文档。

## 6. v0.4 Governance State

v0.4 planning 可以在 documentation governance confirmation 完成后开始，但 v0.4 implementation 仍必须等待独立的 v0.4 Scope Freeze、Acceptance Criteria 和 Implementation Plan。

v0.4 默认不接真实 third-party MCP，不执行 migration，不修改 package dependencies，不创建 worker/gateway/studio/design-system split，除非当前版本 Scope Freeze 和用户确认明确打开这些范围。

