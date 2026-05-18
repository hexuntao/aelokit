# AI Contracts Foundation Open Questions

本文件记录 v0.1 编码实现前仍需确认的问题。状态只能使用：

- 已确认
- 待确认

## 1. `packages/ai` 是否需要直接依赖 `ai` package？

状态：待确认。

当前默认结论：

- v0.1 先使用 adapter-compatible structural types。
- 不直接依赖 `ai` package。
- 如果 TASK-006 发现 structural types 无法满足兼容边界，必须暂停并请求用户确认依赖。

## 2. `packages/ai` 是否需要直接依赖 `@mastra/core`？

状态：待确认。

当前默认结论：

- v0.1 先使用 Mastra-compatible structural types。
- 不创建真实 Mastra runtime instance。
- 不直接依赖 `@mastra/core`，除非用户在 TASK-007 中明确确认。

## 3. `packages/ai` 是否需要 zod 作为 contract schema，还是先用 TypeScript interface/type？

状态：待确认。

当前默认结论：

- v0.1 先使用 TypeScript interface/type。
- 不为了 contracts 私自新增 `zod` dependency。
- 如果需要 runtime validation，必须先确认它是否属于 v0.1 contract foundation，还是 v0.2 route request validation。

## 4. minimal data model 是纯文档冻结，还是需要生成 `ai.data-model.md` 独立文件？

状态：待确认。

当前默认结论：

- 本文档包已经在 `AI_CONTRACTS_FOUNDATION_SCOPE_FREEZE.md` 中冻结 minimal AI data model。
- 不额外创建 `ai.data-model.md`。
- 如需独立文档，必须先确认文件名和位置。

## 5. 是否需要新增 `docs/architecture/AI_MINIMAL_DATA_MODEL.md`？

状态：待确认。

当前默认结论：

- 本次文档包不新增该文件。
- 如果 v0.2 schema 设计前需要更细的数据模型文档，可在 TASK-009 或单独文档任务中确认后创建。

## 6. `packages/ai` 的 package name 是否确定为 `@repo/ai`？

状态：已确认。

依据：

- 现有 Roadmap、package boundary、AI infrastructure boundary 均使用 `@repo/ai`。
- v0.1 后续 package skeleton 默认使用 `@repo/ai`。

## 7. v0.1 是否允许新增测试框架，还是只做 typecheck/lint？

状态：已确认。

当前结论：

- v0.1 默认不新增测试框架。
- 必须执行 format、lint、typecheck、package exports 检查。
- 只有当用户明确确认，或 repo 已有适用于 `@repo/ai` 的测试脚本时，才新增或运行测试。

## 8. 是否需要在 v0.1 更新 root `pnpm-workspace.yaml` 或只由 workspace glob 自动识别？

状态：已确认。

当前结论：

- 当前 `pnpm-workspace.yaml` 已包含 `packages/*`。
- 后续创建 `packages/ai` 时应由 workspace glob 自动识别。
- v0.1 默认不修改 root `pnpm-workspace.yaml`。

## 9. `packages/ai` 是否允许依赖 `@repo/env`？

状态：待确认。

当前默认结论：

- 只有当 contracts 需要引用 env-owned provider key shape 时才考虑。
- `packages/ai` 不读取 runtime secret。
- `packages/ai` 不初始化 provider SDK。

## 10. `packages/ai` 是否允许依赖 `@repo/config`？

状态：待确认。

当前默认结论：

- 只有当 provider/model contract 需要共享静态配置类型时才考虑。
- 不通过 `@repo/config` 引入 app policy。

## 11. minimal AI data model 中的 `ai_agent` 是否应进入 v0.2 minimal schema？

状态：已确认。

当前结论：

- `ai_agent` 属于 v0.2 minimal chat persistence 的 reserve。
- v0.2 可以只落地最小 agent profile，不做 Studio、不做高级 per-agent model policy。

## 12. v0.2 usage audit 是否等同 credits charging？

状态：已确认。

当前结论：

- 不等同。
- v0.2 usage 只做 audit。
- credits preflight、reservation、settlement、refund、failed-call billing rollback 属于 v0.5。
