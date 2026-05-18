# AI Contracts Foundation Acceptance Criteria

## 1. Product Acceptance

v0.1 完成后必须满足：

- AeloKit 拥有一个明确边界的 `@repo/ai` foundation package。
- `@repo/ai` 只提供 contracts、types、lightweight adapter type surface、errors、permissions、usage/cost types。
- minimal AI data model 已冻结，足以支撑 v0.2 chat persistence 的 provider/model/user setting/agent/thread/message/message part/tool call/usage audit。
- v0.1 没有实现 chat runtime，因此不会给用户暴露新的 AI 功能入口。
- v0.1 没有引入 credits charging、credits ledger mutation 或 quota enforcement。

## 2. Architecture Acceptance

必须满足：

- `packages/ai` 与 `apps/web/src/ai` 的职责分离明确。
- `packages/ai` 与 `apps/web/src/components/ai` 的职责分离明确。
- `packages/ai` 与 `apps/web/src/app/api/ai` 的职责分离明确。
- `packages/ai` 与 `packages/db/src/ai.schema.ts` 的职责分离明确。
- `packages/ai` 不包含 React UI。
- `packages/ai` 不包含 assistant-ui。
- `packages/ai` 不包含 Next route。
- `packages/ai` 不读取 cookies / headers / session。
- `packages/ai` 不包含 DB schema。
- `packages/ai` 不执行真实 AI SDK / Mastra runtime。
- `packages/ai` 不初始化 provider SDK。
- v0.1 没有创建 worker/gateway/studio/admin/docs/landing app。

## 3. Package Boundary Acceptance

必须满足：

- `packages/ai` 有明确 exports。
- 所有公开使用都必须通过 package exports，不允许 deep import。
- `packages/ai` 不 import `apps/web`。
- `packages/ai` 不使用 `@/` alias。
- `packages/ai` 不 import app route、server action、React component、Next runtime。
- `packages/ai` 的直接 import 依赖都声明在 `packages/ai/package.json`。
- 如果 `packages/ai` 使用 `@repo/*` 内部包，必须声明在自己的 `package.json`。
- 如果未获确认，不新增 `ai`、`@mastra/core`、`zod` 或测试框架依赖。
- `packages/ai/AGENTS.md` 必须把 package-local 边界写清楚。

## 4. Code Quality Acceptance

必须满足：

- TypeScript 类型命名清晰，使用英文接口名、类型名、文件名。
- 文件按 domain 分目录，不把无关类型堆到一个 `types.ts` 中。
- 没有死代码。
- 没有被注释掉的代码块。
- 没有 runtime side effect。
- 没有真实 provider call。
- 没有 DB call。
- 没有 React component。
- 复杂边界、adapter、permission、usage/cost 相关逻辑必须使用英文注释解释设计意图。
- 简单 getter、普通类型定义、显而易见的代码不添加注释噪音。

## 5. Type Safety Acceptance

必须满足：

- `pnpm --filter @repo/ai typecheck` 通过。
- Public contracts 不使用无意义的 `any`。
- 需要 unknown input 的地方必须显式命名为 unknown，并在 contract 中说明预期解析边界。
- Error contract 有稳定 code。
- Permission contract 能表达 allow/deny/reason。
- Usage contract 能表达 input tokens、output tokens、estimated cost、status、failure reason。
- Adapter-compatible types 不泄露具体 runtime 实例。
- Runtime type definitions 能表达 request context、model selection、agent selection、tool call lifecycle 和 stream metadata。

## 6. Documentation Acceptance

必须满足：

- `packages/ai/AGENTS.md` 已说明 owns / does not own / allowed dependencies / forbidden dependencies / exports / validation。
- minimal AI data model freeze 已写入文档。
- v0.1 与 v0.2/v0.3 的边界已写清。
- Open Questions 中未确认问题不会被伪装成已确认。
- 后续 TASK 的完成报告必须包含修改文件、实现摘要、验证命令和结果、验收状态、未完成事项、commit hash 或建议 commit message。

### 6.1 TASK-009: Minimal AI Data Model Freeze 验收

TASK-009 完成后必须满足：

- [x] **实体清单完整**：9 个 v0.2 minimal 实体已冻结（`ai_provider`、`ai_model`、`ai_user_model_setting`、`ai_agent`、`ai_thread`、`ai_message`、`ai_message_part`、`ai_tool_call`、`ai_usage`）。
- [x] **字段语义清晰**：每个实体的字段名、类型、必填性、语义已冻结。
- [x] **约束明确**：每个实体的约束条件已写清。
- [x] **关系冻结**：实体间关系已用 ASCII 图和文字说明冻结。
- [x] **v0.2 边界明确**：
  - v0.2 usage audit 不触发 credits mutation。
  - v0.2 不包含 memory/knowledge/embedding/MCP/credits tables。
  - v0.2 只支持 user-level default model，不支持 team policy 或 BYOK。
  - v0.2 只支持 system Agent，不支持用户自定义 Agent。
- [x] **v0.2 schema 前置条件已列出**：schema 所有权、migration 策略、索引策略、外键约束、软删除策略、JSON 字段验证。
- [x] **未冻结问题已标记**：索引策略、软删除策略、JSON 验证、外键级联、分区策略、保留策略已列为 open questions。
- [x] **未创建禁止内容**：无 schema、无 migration、无 DB 命令、无 route、无 UI、无 runtime 代码。

## 7. Validation Commands

v0.1 编码实现完成后必须执行：

```bash
pnpm --filter @repo/ai format
pnpm --filter @repo/ai lint
pnpm --filter @repo/ai typecheck
pnpm check:package-exports
pnpm typecheck
```

按需执行：

```bash
pnpm build
```

不需要执行：

```txt
test，除非本任务新增测试或已有相关测试脚本
db generate / migrate / push
```

禁止在 v0.1 中运行：

```bash
pnpm --filter @repo/db db:generate
pnpm --filter @repo/db db:migrate
pnpm --filter @repo/db db:push
```

如果某个命令无法运行，完成报告必须说明：

- 失败命令。
- 失败原因。
- 是否已修复。
- 是否阻塞。
- 当前代码是否可提交。
- 建议下一步。

## 8. Commit Requirements

每个 TASK 应独立提交。

提交信息使用 Conventional Commits：

```txt
<type>(<scope>): <summary>
```

允许 type：

```txt
feat / fix / docs / refactor / test / chore / build / ci
```

示例：

```txt
chore(ai): add package skeleton
feat(ai): add provider and model contracts
feat(ai): add runtime type definitions
docs(ai): freeze minimal AI data model
```

提交前必须确认：

- 只包含该 TASK 的逻辑改动。
- 没有混入无关格式化。
- 没有创建禁止路径。
- 验证命令结果已记录。

## 9. Blocker Handling

遇到阻塞时必须暂停并汇报：

- 阻塞点。
- 影响范围。
- 已尝试的验证。
- 是否需要用户确认依赖、schema、migration、CI/CD、package config 或架构变更。
- 最小可继续路径。

阻塞时提交规则：

- 已产生有价值且不破坏构建的文档/代码变更，可以提交，并在总结中说明 blocked 状态。
- 如果变更是半成品、破坏构建、或只是无效尝试，应先回滚无效变更，不要提交为正常完成任务。
- 如果沙箱环境不能提交，输出建议 commit message 和未提交原因。

以下情况必须视为 merge blocker：

- `packages/ai` import `apps/web`。
- `packages/ai` 包含 Next route、React UI、server action、cookies、headers、session lookup。
- `packages/ai` 包含 DB schema、DB query 或 migration。
- `packages/ai` 执行真实 AI SDK / Mastra runtime。
- package exports 缺失或 deep import 被依赖。
- validation command 未运行且没有明确环境阻塞说明。
