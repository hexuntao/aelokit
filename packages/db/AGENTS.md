# `@repo/db` Package 规则

## Package 定位

`packages/db` 是 Drizzle + PostgreSQL 数据库层，拥有真实 schema、DB connection、DB types 和迁移文件。

## Owns

- `packages/db/src/schema.ts` schema 聚合入口。
- `packages/db/src/auth.schema.ts`。
- `packages/db/src/app.schema.ts`。
- `packages/db/src/ai.schema.ts`。
- `packages/db/src/knowledge.schema.ts`。
- `packages/db/src/migrations/**`。
- `getDb()` connection helper。
- DB table infer types。

## Does not own

- `apps/web/src/db` shim。
- App route、API route、server action。
- Provider SDK 初始化。
- UI 或 React component。
- Auth runtime callback、payment webhook orchestration、AI runtime execution。
- Credits ledger 之外的 app policy。

## Allowed dependencies

- `@repo/env`。
- `drizzle-orm`。
- `postgres`。
- Drizzle tooling dev dependencies。

## Forbidden dependencies

- `apps/web` 或 `@/` alias。
- `@repo/auth` runtime、`@repo/payment` SDK、`@repo/credits` service。
- React、Next runtime、provider SDK、AI SDK/Mastra runtime。

## Exports rule

- 公开 exports：`.`、`./schema`、`./auth-schema`、`./app-schema`、`./ai-schema`、
  `./knowledge-schema`、`./types`。
- 新 schema 必须通过 `packages/db/src/schema.ts` re-export，让 drizzle-kit 可发现。
- 不允许消费者 deep import `@repo/db/src/*`。
- 新增公开 schema subpath 前必须有明确 export plan 和用户确认。

## Implementation rule

- 真实 schema 所有权在 `packages/db/src`。
- `apps/web/src/db` 只是 shim，不允许写真实 schema。
- 不允许 schema generate 写入 `apps/web/src/db`。
- `db:generate` 读取 `packages/db/src/schema.ts`。
- `auth:schema:generate` 输出到 `packages/db/src/auth.schema.reference.ts`，它是参考文件，不覆盖手写 schema。
- 新 schema、migration、db push/migrate 必须用户确认。
- DB 包只定义 schema/connection/types，不放 app route、provider SDK、UI、server actions。
- 当前 DB scope 由用户当前 prompt、root `AGENTS.md`、`packages/AGENTS.md` 和 PRD 共同约束；
  历史 roadmap、旧版本文档、历史任务文档和已删除文档不能作为当前需求依据。
- AI、knowledge 或 credits billing schema 变更必须由当前用户 prompt 明确打开，并在执行
  `db:generate`、migration、db push/migrate 前取得用户确认。
- usage audit schema 不等于 credits ledger mutation；credits charging 必须通过 `@repo/credits`
  的领域能力接入。

## Testing / validation command

```bash
pnpm --filter @repo/db typecheck
pnpm --filter @repo/db lint
pnpm check:db-shims
pnpm check:package-exports
```

DB 生成/迁移命令需用户确认：

```bash
pnpm --filter @repo/db db:generate
pnpm --filter @repo/db db:migrate
pnpm --filter @repo/db db:push
```

## Common mistakes

- 在 `apps/web/src/db` 写 schema 或 migration。
- 新增 schema 文件后忘记从 `schema.ts` re-export。
- 在 DB 包中 import auth/payment/AI runtime。
- 未确认就生成 migration。
