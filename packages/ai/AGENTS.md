# `@repo/ai` Package 规则

本文件适用于 `packages/ai/**`。本 package 是 AeloKit AI contracts /
runtime-types / adapter-compatible types 包，不是 AI runtime、UI、DB
schema 或 provider SDK 接线层。

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
- `ai`、`@mastra/core`、`zod`，除非当前用户 prompt 明确打开依赖范围，并且 manifest/lockfile 变更已获得确认。

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

- 当前 package scope 由用户当前 prompt、root `AGENTS.md`、`packages/AGENTS.md`
  和 PRD 共同约束；历史 roadmap、旧版本文档、历史任务文档和已删除文档不能作为当前需求依据。
- 只实现 contracts、types、errors、permissions、usage/cost types、memory/knowledge/MCP contracts、
  runtime type definitions 和 lightweight adapter-compatible type surface。
- 不创建 route、UI、schema、migration、runtime wiring、persistence service 或 provider SDK
  initialization。
- Adapter-compatible types 只能表达结构兼容边界，不持有真实 runtime instance。
- Usage/cost contracts 只表达 audit、billing status 和 cost metadata，不触发 credits mutation。
- Tool 和 MCP contracts 必须保持 permissioned boundary，不实现 side effects。
- Dependency、manifest、lockfile 或 exports 变更必须由当前用户 prompt 明确打开，并按 root
  `AGENTS.md` 的安装/manifest 边界处理。
- DB schema、migration 和 DB query 所有权不在 `packages/ai`；真实 schema/migration 属于
  `packages/db`，app persistence/runtime wiring 属于 app layer。

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
