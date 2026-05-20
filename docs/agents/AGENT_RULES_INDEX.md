# Agent Rules Index

本文件定义 AeloKit 的 agent rule 文件体系。Codex、Claude Code 和其他 AI coding agent 必须先通过本文件理解规则职责，再按 `docs/INDEX.md` 读取当前版本文档。

## 1. Rule File System

- `AGENTS.md`: 全仓永久工程规则、monorepo 边界、安全边界、禁止事项和文档入口指针。
- nearest `AGENTS.md`: 目标路径最近的目录规则，例如 `apps/AGENTS.md`, `apps/web/AGENTS.md`, `packages/AGENTS.md`。
- `docs/agents/AGENT_RULES_INDEX.md`: agent rules 的索引和职责说明。
- `docs/agents/CODEX_RULES.md`: Codex 专用读取、scope 和 `/goal` 执行规则。
- `docs/agents/CLAUDE_RULES.md`: Claude Code 专用读取和冲突处理规则。
- `docs/agents/domain.md`: domain documentation consumption rules。
- `CLAUDE.md`: Claude Code 的短摘要入口，不是最高规则源。
- `docs/INDEX.md`: 文档入口层，定义 active / historical / reference-only docs 和读取优先级。

## 2. Root AGENTS.md Responsibility

根 `AGENTS.md` 只定义长期有效的工程边界：

- workspace / app / package ownership。
- package exports、dependency ownership、shim ownership。
- env、secret、DB、migration 和安全边界。
- AI runtime placement 的长期 guardrail。
- 禁止提前创建 future apps/packages。
- 当前版本 scope 的定位规则。

根 `AGENTS.md` 不定义 v0.4 或任何未来版本的产品 scope。当前版本 scope 必须由 `docs/product/v0.x/SCOPE_FREEZE.md` 定义。

## 3. Nearest AGENTS.md Responsibility

nearest `AGENTS.md` 负责收紧目标目录下的具体规则：

- `apps/AGENTS.md`: app 层 ownership、future app 创建条件、app 间 import 禁止。
- `apps/web/AGENTS.md`: Next.js App Router、web runtime、UI、docs content、app-local shim 边界。
- `packages/AGENTS.md`: package ownership、exports、dependencies、package creation gate。

nearest `AGENTS.md` 可以更严格，但不能放宽根 `AGENTS.md` 的安全、scope、DB、env、package 和 secret 边界。

## 4. CODEX_RULES.md Responsibility

`docs/agents/CODEX_RULES.md` 定义 Codex 如何读取文档和执行任务：

- 必须先读取 `docs/INDEX.md`。
- 不得默认读取全部 `docs/product`。
- 必须通过当前版本 `DOCUMENT_INPUTS.md` 获取最小输入集。
- 旧 Prompt、旧 Scope Freeze、旧 Implementation Plan 不能作为当前需求。
- 冲突必须写入当前版本 `OPEN_QUESTIONS.md`。
- `/goal` 执行必须遵守当前版本 Scope Freeze / Acceptance Criteria / Implementation Plan。

## 5. CLAUDE_RULES.md Responsibility

`docs/agents/CLAUDE_RULES.md` 定义 Claude Code 的工具专属规则：

- `CLAUDE.md` 只是 Claude Code 短摘要入口。
- `CLAUDE.md` 不覆盖 `AGENTS.md`, nearest `AGENTS.md`, `docs/INDEX.md`, 当前用户 prompt 或当前版本 Scope Freeze。
- Claude Code 也必须通过当前版本 `DOCUMENT_INPUTS.md` 获取最小输入集。

## 6. docs/INDEX.md Responsibility

`docs/INDEX.md` 是所有后续规划、执行、审计任务的文档入口。它定义：

- 当前产品阶段。
- authoritative reading order。
- active docs。
- historical docs。
- reference-only docs。
- deprecated / needs-review docs。
- conflict resolution rule。
- v0.4 planning gate。

## 7. Current Version Scope Priority

当前版本文件优先级：

1. 当前用户任务 prompt。
2. 当前版本 `SCOPE_FREEZE.md`。
3. 当前版本 `ACCEPTANCE_CRITERIA.md`。
4. 当前版本 `IMPLEMENTATION_PLAN.md`。
5. 当前版本 `DOCUMENT_INPUTS.md`。
6. `docs/INDEX.md`。
7. root `AGENTS.md`。
8. nearest `AGENTS.md`。

如果当前版本 scope 文件尚不存在，不得用历史版本 scope、旧 prompt 或 roadmap 段落补位。

## 8. Historical Gate Rule

v0.1 / v0.2 / v0.3 gate 只能作为 historical regression guardrail：

- 可以用于理解过去阶段为什么禁止某些行为。
- 可以用于防止破坏已验收能力。
- 不能定义当前版本的新 scope。
- 不能阻止当前版本 Scope Freeze 在人工确认后重新打开相关能力。
- 不能把旧 TASK 编号、旧文件允许范围或旧验收命令继承为当前任务。

