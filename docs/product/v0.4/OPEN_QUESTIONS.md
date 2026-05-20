# v0.4 Open Questions

## Q001

### Question

是否执行文档重组，把 v0.1/v0.2/v0.3 文档移入 `docs/product/archive/`，并保留 redirect note？

### Why it matters

当前 `docs/product` 平铺历史版本文档，v0.4 Codex 很容易误读旧 Scope Freeze、旧 Prompt 和旧 Implementation Plan。

### Options

- A. 执行归档重组，并更新 `docs/INDEX.md`。
- B. 暂不移动，只依赖 `docs/INDEX.md` 和 `DOCUMENT_INPUTS.md` 约束读取。
- C. 只归档旧 Prompt 和 validation report，其他历史文档暂留原位。

### Recommendation

A，但必须单独任务执行，不能在 v0.4 feature planning 中顺手做。

### Requires human confirmation

YES

## Q002

### Question

是否重写根 `AGENTS.md`，把永久工程规则与 v0.2/v0.3 历史 gate 拆开？

### Why it matters

根 `AGENTS.md` 当前同时承担最高工程规则、历史阶段 gate、shim 边界和验证说明。进入 v0.4 后，这会增加上下文污染和历史规则误用风险。

### Options

- A. 收敛 `AGENTS.md` 为永久规则 + current boundaries + docs/INDEX pointer。
- B. 保持现状，只在 v0.4 prompt 中提醒忽略历史 gate。
- C. 先新增 `docs/agents/AGENT_RULES_INDEX.md`，再重写 `AGENTS.md`。

### Recommendation

C，然后 A。

### Requires human confirmation

YES

## Q003

### Question

是否重写 `CLAUDE.md` 为 Claude Code 专用短摘要？

### Why it matters

`CLAUDE.md` 与 `AGENTS.md` 大量重复，并存在细节漂移风险。它应该作为工具摘要，不应该成为第二套最高规则。

### Options

- A. 重写为短摘要，只指向 `AGENTS.md`, nearest `AGENTS.md`, `docs/INDEX.md`。
- B. 保持现状。
- C. 删除 `CLAUDE.md`。

### Recommendation

A。不建议删除。

### Requires human confirmation

YES

## Q004

### Question

v0.4 是否确认以 Skills / Tools / MCP 为主题？

### Why it matters

roadmap 里 v0.4 是 Skills / Tools / MCP，但当前任务明确禁止规划 v0.4 具体功能。后续 planning 需要 human 确认主题和边界。

### Options

- A. v0.4 进入 Skills / Tools / MCP。
- B. v0.4 先处理 v0.3 accepted-with-notes 中的 smoke/vector/citation hardening。
- C. v0.4 先做 AI stack decision record 和 runtime boundary hardening。

### Recommendation

先确认主题；如果环境未具备，建议把 runtime smoke/vector verification 作为 v0.4 planning 前置或 early acceptance gate，而不是直接进入 MCP implementation。

### Requires human confirmation

YES

## Q005

### Question

v0.4 前是否必须补跑 authenticated runtime smoke、DB/vector verification？

### Why it matters

v0.3 已 accepted with notes，但 runtime E2E 和 DB/vector 仍是 environment-blocked。若 v0.4 要叠加 tools/MCP，未验证的基础路径会放大排错成本。

### Options

- A. v0.4 planning 前补跑 smoke/vector verification。
- B. v0.4 planning 可开始，但 implementation acceptance 必须包含 smoke/vector verification。
- C. 暂时接受 blocked 状态，只做 docs/design。

### Recommendation

B。若 v0.4 涉及 MCP/tool runtime，升级为 A。

### Requires human confirmation

YES

## Q006

### Question

Citation 是否继续允许 response-only，还是 v0.4 前必须设计持久化？

### Why it matters

当前 citation/source 不持久化到 `ai_message_part`，历史消息无法 replay sources。若 v0.4 涉及 tools/MCP/audit，provenance 语义可能需要更强保证。

### Options

- A. 保持 response-only，并明确限制。
- B. 在 v0.4 中设计 citation persistence，但不立即迁移。
- C. v0.4 前先实现持久化。

### Recommendation

B。是否实现需要独立 Scope Freeze 和 migration confirmation。

### Requires human confirmation

YES

## Q007

### Question

v0.4 是否允许引入真实 third-party MCP，还是只做 contracts/design/local mock？

### Why it matters

MCP 涉及 credential、permission、tool execution 和外部系统安全边界。默认接入真实 third-party MCP 会扩大风险。

### Options

- A. 只做 contracts/design，不接真实 MCP。
- B. 做 remote MCP skeleton，但不保存真实 credentials。
- C. 接入一个真实 remote MCP provider。

### Recommendation

A 或 B。C 必须有单独安全计划、credential policy 和用户确认。

### Requires human confirmation

YES
