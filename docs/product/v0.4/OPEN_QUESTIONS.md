# v0.4 Open Questions

本文件记录 v0.4 planning 前的治理问题和人工决策。Q001-Q007 已在 Documentation Governance Confirmation 中完成确认。

## Q001

### Question

是否执行文档重组，把 v0.1/v0.2/v0.3 文档移入 `docs/product/archive/`，并保留 redirect note？

### Why it matters

当前 `docs/product` 平铺历史版本文档，v0.4 Codex 很容易误读旧 Scope Freeze、旧 Prompt 和旧 Implementation Plan。

### Options

- A. 执行归档重组，并更新 `docs/INDEX.md`。
- B. 暂不移动，只依赖 `docs/INDEX.md` 和 `DOCUMENT_INPUTS.md` 约束读取。
- C. 只归档旧 Prompt 和 validation report，其他历史文档暂留原位。

### Final choice

B. 暂不移动历史文档，只依赖 `docs/INDEX.md` 和 `DOCUMENT_INPUTS.md` 控制读取范围。等 v0.4 planning 完成后再单独做 archive 重组。

### Rationale

本轮目标是确认文档治理和 agent rules 收敛，不执行移动、重命名或归档。通过入口层先降低上下文污染，避免在 v0.4 planning 前引入路径变更风险。

### Requires human confirmation

ANSWERED

## Q002

### Question

是否重写根 `AGENTS.md`，把永久工程规则与 v0.2/v0.3 历史 gate 拆开？

### Why it matters

根 `AGENTS.md` 当前同时承担最高工程规则、历史阶段 gate、shim 边界和验证说明。进入 v0.4 后，这会增加上下文污染和历史规则误用风险。

### Options

- A. 收敛 `AGENTS.md` 为永久规则 + current boundaries + docs/INDEX pointer。
- B. 保持现状，只在 v0.4 prompt 中提醒忽略历史 gate。
- C. 先新增 `docs/agents/AGENT_RULES_INDEX.md`，再重写 `AGENTS.md`。

### Final choice

C，然后 A。先新增 `docs/agents/AGENT_RULES_INDEX.md`, `docs/agents/CODEX_RULES.md`, `docs/agents/CLAUDE_RULES.md`，再重写根 `AGENTS.md` 为永久规则 + `docs/INDEX.md` 指针。

### Rationale

先建立规则索引可以避免重写根 `AGENTS.md` 后丢失 tool-specific guidance。根规则只保留长期工程边界，历史 gate 降级为 regression guardrail。

### Requires human confirmation

ANSWERED

## Q003

### Question

是否重写 `CLAUDE.md` 为 Claude Code 专用短摘要？

### Why it matters

`CLAUDE.md` 与 `AGENTS.md` 大量重复，并存在细节漂移风险。它应该作为工具摘要，不应该成为第二套最高规则。

### Options

- A. 重写为短摘要，只指向 `AGENTS.md`, nearest `AGENTS.md`, `docs/INDEX.md`。
- B. 保持现状。
- C. 删除 `CLAUDE.md`。

### Final choice

A. 重写为短摘要，不删除。

### Rationale

Claude Code 仍需要一个入口文件，但不应复制 package/shim/env/history gate 全量细节。冲突时以当前用户 prompt、当前版本 scope、`docs/INDEX.md`、root/nearest `AGENTS.md` 为准。

### Requires human confirmation

ANSWERED

## Q004

### Question

v0.4 是否确认以 Skills / Tools / MCP 为主题？

### Why it matters

roadmap 里 v0.4 是 Skills / Tools / MCP，但当前任务明确禁止规划 v0.4 具体功能。后续 planning 需要 human 确认主题和边界。

### Options

- A. v0.4 进入 Skills / Tools / MCP。
- B. v0.4 先处理 v0.3 accepted-with-notes 中的 smoke/vector/citation hardening。
- C. v0.4 先做 AI stack decision record 和 runtime boundary hardening。

### Final choice

C。v0.4 先做 AI Stack Decision Record + Runtime Boundary Hardening + v0.3 accepted-with-notes 的验收前置，不直接进入真实 MCP implementation。

### Rationale

v0.4 planning 可以围绕 AI stack 和 runtime boundary 收敛基础决策，同时把 v0.3 notes 作为验收前置。真实 MCP implementation 暂不进入默认范围。

### Requires human confirmation

ANSWERED

## Q005

### Question

v0.4 前是否必须补跑 authenticated runtime smoke、DB/vector verification？

### Why it matters

v0.3 已 accepted with notes，但 runtime E2E 和 DB/vector 仍是 environment-blocked。若 v0.4 要叠加 tools/MCP，未验证的基础路径会放大排错成本。

### Options

- A. v0.4 planning 前补跑 smoke/vector verification。
- B. v0.4 planning 可开始，但 implementation acceptance 必须包含 smoke/vector verification。
- C. 暂时接受 blocked 状态，只做 docs/design。

### Final choice

B。v0.4 planning 可以开始，但 implementation acceptance 必须包含 authenticated runtime smoke、DB/vector verification。若 v0.4 后续涉及 MCP/tool runtime，再升级为 A。

### Rationale

planning 不应被环境阻塞；implementation acceptance 不能绕过 runtime 和 vector 事实验证。

### Requires human confirmation

ANSWERED

## Q006

### Question

Citation 是否继续允许 response-only，还是 v0.4 前必须设计持久化？

### Why it matters

当前 citation/source 不持久化到 `ai_message_part`，历史消息无法 replay sources。若 v0.4 涉及 tools/MCP/audit，provenance 语义可能需要更强保证。

### Options

- A. 保持 response-only，并明确限制。
- B. 在 v0.4 中设计 citation persistence，但不立即迁移。
- C. v0.4 前先实现持久化。

### Final choice

B。v0.4 中设计 citation persistence，但不立即执行 migration，除非单独 Scope Freeze 确认。

### Rationale

需要先明确 provenance 与 historical replay 语义，再决定 schema/migration。migration 必须独立确认，不能在 planning 或治理任务中顺手执行。

### Requires human confirmation

ANSWERED

## Q007

### Question

v0.4 是否允许引入真实 third-party MCP，还是只做 contracts/design/local mock？

### Why it matters

MCP 涉及 credential、permission、tool execution 和外部系统安全边界。默认接入真实 third-party MCP 会扩大风险。

### Options

- A. 只做 contracts/design，不接真实 MCP。
- B. 做 remote MCP skeleton，但不保存真实 credentials。
- C. 接入一个真实 remote MCP provider。

### Final choice

A。v0.4 不接真实 third-party MCP，只做 contracts/design/local mock 或安全边界设计。

### Rationale

真实 third-party MCP 需要 credential policy、permission model、runtime safety 和 audit plan。v0.4 默认先收敛 contracts/design/local mock 或安全边界，不直接接入外部 provider。

### Requires human confirmation

ANSWERED

## Q008

### Question

`packages/AGENTS.md` 是否需要更新 `packages/ai` 的状态描述？

### Why it matters

`packages/AGENTS.md` 仍写着 “`packages/ai`、`packages/design-system` 是未来规划；当前不要创建”，但当前仓库已经存在 `packages/ai`，根 `AGENTS.md` 和 v0.3 handoff 也把 `packages/ai` 作为当前 AI contracts 包。后续 v0.4 implementation 如果只读 nearest package rules，可能误判 `packages/ai` 不存在或不应被维护。

### Options

- A. 更新 `packages/AGENTS.md`：`packages/ai` 已存在，只能作为 contracts/runtime-types/adapters package 维护；`packages/design-system` 仍是未来规划。
- B. 不修改，继续依赖根 `AGENTS.md` 和 `docs/INDEX.md` 覆盖。
- C. 单独新增 package-specific clarification doc，不改 `packages/AGENTS.md`。

### Final choice

A。更新 `packages/AGENTS.md`：`packages/ai` 已存在，只能作为 contracts / runtime-types / adapter-compatible types package 维护；`packages/design-system` 仍是未来规划。

### Rationale

Q008 的冲突来自 nearest package rules 与当前仓库事实不一致。选择 A 可以让 future v0.4 implementation 在读取 `packages/AGENTS.md` 时正确识别 `packages/ai` 是现有 `@repo/ai` contracts 包，同时继续禁止把 `packages/ai` 扩展成 runtime、route、UI、DB query、schema、migration 或 provider SDK initialization 层。本次只更新 agent rule 文档，不修改业务代码、`package.json` 或 package exports。

### Requires human confirmation

ANSWERED

## Q009

### Question

`apps/web/AGENTS.md` 是否需要把 “v0.2 AI 目录规则” 收敛成 current AI Web App boundary + historical note？

### Why it matters

`apps/web/AGENTS.md` 仍保留 v0.2 当前任务语气，并写有“不实现 v0.3+ memory/RAG/MCP/credits charging”。当前 v0.3 Memory + Knowledge 已 accepted with notes，v0.4 planning 已开始。若 future implementation 只按该段执行，可能把已经完成的 v0.3 runtime 当成 forbidden drift。

### Options

- A. 更新 `apps/web/AGENTS.md`，保留长期边界，移除 v0.2 当前任务语气。
- B. 不修改，继续依赖 `docs/INDEX.md`、`V0_3_HANDOFF.md` 和当前 v0.4 scope 覆盖。
- C. 把 v0.2-specific gate 移到 archive rule doc，再更新 web AGENTS。

### Final choice

A。更新 `apps/web/AGENTS.md`，保留 `/api/ai/chat`、`apps/web/src/ai`、`apps/web/src/components/ai` 的长期边界，并移除 v0.2 当前任务语气。

### Rationale

Q009 的冲突来自 `apps/web/AGENTS.md` 仍把 v0.2 task gate 写成当前执行规则。选择 A 可以保留已验证的 AI Web App ownership，同时明确 v0.1/v0.2/v0.3 gate 只作为 historical regression guardrail。v0.4 仍默认不接真实 third-party MCP、不启用 local stdio MCP、不接 Assistant Cloud、不做 credits charging，除非当前版本 Scope Freeze 和用户确认明确打开。本次只更新 agent rule 文档，不修改业务代码。

### Requires human confirmation

ANSWERED

## Q010

### Question

T07/T08 发现当前 embedding endpoint 会拒绝 AI SDK embedding request 中的
`encoding_format` 参数，且当前 DB 中没有 ready knowledge source、knowledge chunk
或 `aelokit_knowledge_embeddings` PgVector storage object。v0.4 是否可以标记 full
PASS？

### Why it matters

v0.4 acceptance 要求 authenticated runtime smoke 和真实 DB/vector verification。
当前 base chat、persistence、usage audit、PostgreSQL connection、`vector` extension
和 required tables 均有真实证据，但 knowledge citation runtime 与 controlled
retrieval 没有 PASS 证据。把这类 blocker 隐藏为 success 会违反
`ACCEPTANCE_CRITERIA.md`。

### Options

- A. 不标记 full PASS；v0.4 final acceptance 记录 PARTIAL，并要求后续修复
  embedding provider/config 后重跑 T07/T08。
- B. 修改 embedding provider/adapter 或环境配置，使其兼容 AI SDK embedding
  request，然后重新执行 knowledge ingestion、retrieval、citation runtime smoke。
- C. 执行 seed / ad hoc DB writes 创建 controlled knowledge source 和 vectors。

### Final choice

A。T09 只记录事实并把 v0.4 标记为 PARTIAL。B/C 均需要单独 scope、环境配置或
DB-mutating confirmation；不能在本次 acceptance report 中顺手执行。

### Rationale

当前 prompt 禁止 dependency change、schema/migration change、secret/env edits 和未确认
DB writes。T08 已证明 PostgreSQL 和 `vector` extension 可用，但没有 ready indexed vector
data；T07 已证明 knowledge-enabled path 被 embedding provider compatibility 阻塞。
因此 full PASS 不成立。

### Requires human confirmation

ANSWERED_FOR_T09. 未来若要把 v0.4 从 PARTIAL 提升为 PASS，需要单独确认 embedding
provider/config 修复和 controlled retrieval 重跑方式。

## Q011

### Question

T07/T08 blocker retry 已获准执行 DB 写入 controlled knowledge flow，并已最小修复
`encoding_format` fallback。但当前 effective embedding host
`api-xai.ainaibahub.com` 对 `/embeddings` 和 `/v1/embeddings` 返回 Responses
API-shaped payload，而不是 OpenAI-compatible embeddings payload
`data[].embedding`。是否继续尝试在当前 host 上适配非 embeddings API？

### Why it matters

v0.4 acceptance 要求 controlled source 完成 chunk -> embedding -> vector upsert
-> retrieval -> citation。当前 endpoint 即使移除 `encoding_format` 后也没有返回
embedding vector；继续把 Responses API payload 当成 embedding 会伪造 DB/vector PASS。

### Options

- A. 不继续适配当前 host；要求配置真正可用的 embeddings endpoint/key，例如设置
  `AI_EMBEDDING_BASE_URL` / `AI_EMBEDDING_API_KEY` 指向兼容
  `POST /embeddings` 且返回 `data[].embedding` 的 endpoint。
- B. 新增一个明确的 provider adapter，但必须先确认该 host 的真实 embeddings
  API 路径、请求体和响应体契约。
- C. 使用当前 chat/text generation endpoint 的 Responses output 伪造 embedding。

### Final choice

A。当前不继续适配非 embeddings payload，不把 Responses API output 当作 vector
embedding。

### Rationale

本次 retry 已证明：

- `AI_EMBEDDING_BASE_URL` 未设置，effective embedding base fallback 到
  `OPENAI_BASE_URL`。
- effective host 是 `api-xai.ainaibahub.com`，不是官方 `api.openai.com`。
- AI SDK OpenAI embedding path 的 `encoding_format` 问题可以被捕获并 fallback。
- fallback 请求不带 `encoding_format`，但 endpoint 仍返回 Responses API-shaped
  payload，无 `data[].embedding`。
- 同一个 effective key 直连官方 OpenAI embeddings endpoint 返回
  `invalid_api_key`。
- controlled source 写入已执行两次，但均停在 embedding 阶段，DB 中仍无
  knowledge chunk、vector id 或 app-created embedding storage table。

因此 v0.4 不能从 PARTIAL 改为 PASS。下一步必须换成真实 embeddings endpoint/key，
或由人工提供该 host 的 embeddings API contract 后再做单独 adapter。

### Requires human confirmation

ANSWERED_FOR_T07_T08_RETRY. 继续推进 PASS 前，需要人工提供可用 embeddings
endpoint/key 或确认该 host 的真实 embeddings API contract。
