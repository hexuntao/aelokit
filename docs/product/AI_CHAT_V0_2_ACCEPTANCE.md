# AI Chat v0.2 Acceptance Criteria

本文件定义 AeloKit v0.2 AI chat path 的验收标准。任何后续 TASK 只能在
`AI_CHAT_V0_2_SCOPE_FREEZE.md` 允许的范围内满足这些标准。

## Product Acceptance

- 登录用户可以进入 AI chat 页面。
- 用户可以发送一条消息。
- 用户可以看到 streamed response。
- 用户可以看到基础 loading/error/empty state。
- 未登录用户不能调用 chat route。
- provider secret 不暴露给 client。

## Architecture Acceptance

- `/api/ai/chat` 是唯一首个 AI streaming route。
- 不创建 `/api/chat`。
- app runtime 使用 `packages/ai` contracts。
- `packages/ai` 不 import `apps/web`。
- DB schema 属于 `packages/db`。
- route 属于 `apps/web`。
- UI 属于 `apps/web/src/components/ai`。
- provider SDK 初始化属于 app runtime layer。
- usage audit 不触发 credits ledger mutation。
- simple chat 可以直接使用 Vercel AI SDK provider path；Mastra 只在真实
  agent/tool/workflow orchestration 需要时接入。

## Data Acceptance

v0.2 可以持久化：

- thread。
- message。
- message part。
- tool call。
- usage audit。

基础数据可以被 seed：

- provider。
- model。
- user model setting reserve。
- system agent。

model fallback 顺序必须清晰：

1. per-chat/per-thread model。
2. user default model。
3. system default model。

usage audit 必须包含：

- `userId`
- `threadId`
- `messageId`
- `providerId`
- `modelId`
- `inputTokens`
- `outputTokens`
- `estimatedCost`
- `status`
- `failure reason`
- `createdAt`

## External Docs Acceptance

每个涉及外部依赖的 TASK 必须记录：

- 阅读的官方文档 URL。
- 使用的版本。
- 采用的 API。
- 是否存在 v4/v5/v6 差异。
- 当前实现为什么符合最新文档。
- 未确认风险。

涉及以下依赖或协议时必须触发 External Docs Gate：

- assistant-ui。
- Vercel AI SDK。
- AI SDK provider packages，例如 `@ai-sdk/openai`。
- Mastra。
- streaming response。
- transport endpoint。
- message persistence。
- usage metadata。
- tool call mapping。

## Validation Acceptance

最终需要执行：

```bash
pnpm --filter @repo/web lint
pnpm --filter @repo/web typecheck
pnpm --filter @repo/db typecheck
pnpm --filter @repo/ai typecheck
pnpm check:package-exports
pnpm typecheck
pnpm build
```

如无法执行，必须记录：

- 哪条命令无法执行。
- 失败原因或环境阻塞。
- 是否已修复。
- 是否阻塞合并。
- 最小后续动作。

## Non-Regression Acceptance

- 不修改 `.env` 或提交真实 provider secret。
- 不创建 `.env.example`；根目录 `env.example` 是唯一 env reference。
- 如新增 provider key env，必须同步 schema、`env.example` 和 `pnpm check:env`。
- 不删除现有 SaaS 功能。
- 不替换技术栈。
- 不创建 future app/package split。
- 不把业务组件抽到 future design-system。
- 不让 `packages/ai` 获得 runtime、DB query、route、session、React UI 责任。

## Merge Decision Rule

满足以下条件才建议合并 v0.2：

- Product Acceptance 全部满足。
- Architecture Acceptance 全部满足。
- Data Acceptance 中 minimal persistence 和 usage audit 已能工作。
- External Docs Gate 对所有外部依赖 TASK 有记录。
- Validation Acceptance 命令已执行，或阻塞原因被明确记录且不影响合并判断。
- Open Questions 中仍待确认的问题没有阻塞 v0.2 的已实现范围。

