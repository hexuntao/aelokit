# `@repo/ai` Package 规则

本文件适用于 `packages/ai/**`。本 package 是 AeloKit v0.1 AI
contracts foundation，不是 AI runtime、UI、DB schema 或 provider SDK
接线层。

## Package 定位

`packages/ai` 是 cross-app AI infrastructure contracts 包，提供稳定的
AI provider、model、agent、tool、skill、memory、knowledge、MCP、usage、
permission、error、adapter-compatible 和 runtime type definitions。

## Owns

- Provider abstraction contracts。
- Model registry contracts。
- Agent contracts。
- Tool registry contracts。
- Skill registry contracts。
- Memory contracts。
- Knowledge contracts。
- MCP contracts。
- Usage and cost contracts。
- Permission contracts。
- Error contracts。
- Runtime type definitions。
- Lightweight Vercel AI SDK adapter-compatible type surface。
- Lightweight Mastra adapter-compatible type surface。

## Does not own

- React UI。
- assistant-ui components。
- Next.js route handlers。
- App pages。
- Dashboard logic。
- Server actions。
- User session lookup。
- `cookies()`、`headers()`。
- Direct DB queries。
- DB schema 或 migration。
- Provider SDK initialization。
- Live AI SDK runtime execution。
- Live Mastra runtime execution。
- Credits ledger mutation。
- Credits charging。
- App-specific billing or entitlement policy。

## Allowed dependencies

- 默认不依赖任何 runtime package。
- `@repo/config`：仅当 contracts 需要共享静态配置类型或常量，且任务已确认。
- `@repo/env`：仅当 contracts 需要表达 env-owned provider key shape，且任务已确认；不得读取 runtime secret。
- `@repo/shared`：仅当需要纯类型或纯工具函数，且任务已确认。

## Forbidden dependencies

- `apps/web` 或 `@/` alias。
- `next`、`next-intl`、`next/headers`、`next/navigation`。
- React UI dependencies。
- assistant-ui runtime。
- Provider SDK package。
- DB client、Drizzle schema、query helper。
- `@repo/db` query/runtime dependency。
- `@repo/auth` session lookup。
- `@repo/payment` runtime。
- `@repo/credits` ledger/service mutation。
- `@repo/storage` runtime upload/download。
- `ai`、`@mastra/core`、`zod`，除非具体 TASK 暂停并获得用户确认。

## Exports rule

- 公开 exports：`.`、`./providers`、`./models`、`./agents`、`./tools`、
  `./skills`、`./memory`、`./knowledge`、`./mcp`、`./usage`、
  `./permissions`、`./errors`、`./adapters/ai-sdk`、
  `./adapters/mastra`、`./runtime-types`。
- 消费者必须通过 package exports 使用 public surface。
- 不允许 deep import `@repo/ai/src/**`。
- 不导出 internal helpers。
- 不导出 app-specific policy。
- 不导出 DB schema。

## Implementation rule

- v0.1 只实现 contracts、types、errors、permissions、usage/cost types 和
  lightweight adapter-compatible type surface。
- 不创建 route、UI、schema、migration、runtime wiring 或 provider SDK
  initialization。
- Adapter-compatible types 只能表达结构兼容边界，不持有真实 runtime instance。
- Usage/cost contracts 只表达 audit 和 cost metadata，不触发 credits mutation。
- Tool 和 MCP contracts 必须保持 permissioned boundary，不实现 side effects。
- v0.2 AI chat 执行入口是 `docs/product/AI_CHAT_V0_2_*`；本 package 仍只作为
  contracts/types/adapters/runtime-types 依赖被 app runtime 使用。
- v0.2 不允许把 assistant-ui、Vercel AI SDK live runtime、Mastra runtime、
  provider SDK initialization、route、UI、DB query 或 persistence service 放进
  `packages/ai`。
- v0.2 Dependency Gate：TASK-003 只输出安装计划，只有 TASK-003B 可实际安装依赖；
  不要在其他 TASK 中顺手修改 `packages/ai/package.json`、`apps/web/package.json`
  或 `pnpm-lock.yaml`。
- v0.2 Schema Gate：TASK-004 只输出
  `docs/product/AI_CHAT_V0_2_SCHEMA_DESIGN.md`；TASK-005 经用户确认后由
  `packages/db` 创建 schema/migration，不能在 `packages/ai` 创建 schema 或 DB
  query。

## Validation

```bash
pnpm --filter @repo/ai format
pnpm --filter @repo/ai lint
pnpm --filter @repo/ai typecheck
pnpm check:package-exports
```

## Common mistakes

- 把 AI chat route、server action 或 app session lookup 放进 package。
- 在 package 中初始化 provider SDK、AI SDK 或 Mastra runtime。
- 把 DB schema、query 或 migration 放进 package。
- 把 usage audit 当成 credits charging。
- 为了方便提前引入 `ai`、`@mastra/core`、`zod` 或测试框架依赖。
