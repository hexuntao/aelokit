# Phase 2.3：抽取 packages/db

## 概述

创建 `@repo/db` 包，承载 Drizzle schema、db client、migrations 和 drizzle config，为后续 `auth/payment/credits/admin/worker/gateway` 共享数据库层。

## 当前状态

- `@repo/db` 已创建，承载 Drizzle 数据库层
- `apps/web/src/db/` 现在是兼容 shim，重新导出 `@repo/db` 的内容
- `apps/web/drizzle.config.ts` 已迁移到 `packages/db/drizzle.config.ts`
- `apps/web` 的 db:* scripts 现在代理到 `@repo/db`
- `@repo/db` 不包含 auth runtime、payment、credits 业务逻辑、server actions、route handlers、UI
- `@repo/db` 不允许 import app 内部路径（`@/`）
- `@repo/db` 不依赖 `next`、`next-intl`、`react`、`better-auth`、`stripe`、`resend` 等框架/业务包

## 已抽取内容

### schema

| 文件 | 说明 |
|------|------|
| `auth.schema.ts` | user、session、account、verification、apikey 表定义 |
| `app.schema.ts` | payment、userCredit、creditTransaction 表定义 |
| `schema.ts` | 聚合 re-export + schema 对象 |
| `types.ts` | InferSelectModel 类型（User、Payment、ApiKey） |

### client

| 导出 | 说明 |
|------|------|
| `getDb()` | 懒初始化 db 连接 |

### migrations

9 个 migration 文件（0000-0008）+ meta 文件，完整保留。

### drizzle config

`packages/db/drizzle.config.ts`，schema 指向 `./src/schema.ts`，out 指向 `./src/migrations`。

## package exports

```json
{
  ".": "./src/index.ts",
  "./schema": "./src/schema.ts",
  "./auth-schema": "./src/auth.schema.ts",
  "./app-schema": "./src/app.schema.ts",
  "./types": "./src/types.ts"
}
```

## 兼容 shim

以下文件已改为 shim，保持 app 内现有 import 不变：

- `apps/web/src/db/index.ts` → `export { getDb } from '@repo/db'; export * from '@repo/db';`
- `apps/web/src/db/schema.ts` → `export * from '@repo/db/schema';`
- `apps/web/src/db/auth.schema.ts` → `export * from '@repo/db/auth-schema';`
- `apps/web/src/db/app.schema.ts` → `export * from '@repo/db/app-schema';`
- `apps/web/src/db/types.ts` → `export * from '@repo/db/types';`

**重要**：这些 shim 文件不得包含真实 schema 代码（如 `pgTable`、`relations` 等）。任何 schema generate 命令不得写入 `apps/web/src/db/*`。使用 `pnpm check:db-shims` 验证边界。

## db scripts 代理

`apps/web/package.json` 的 db:* scripts 已改为代理到 `@repo/db`：

```json
{
  "db:generate": "pnpm --filter @repo/db db:generate",
  "db:migrate": "pnpm --filter @repo/db db:migrate",
  "db:push": "pnpm --filter @repo/db db:push",
  "db:studio": "pnpm --filter @repo/db db:studio"
}
```

以下命令都可用：

```bash
pnpm --filter @repo/db db:generate
pnpm --filter @repo/web db:generate
```

## 依赖说明

### @repo/db dependencies

| 依赖 | 说明 |
|------|------|
| `drizzle-orm` | ORM 核心 |
| `postgres` | PostgreSQL 驱动 |

### @repo/db devDependencies

| 依赖 | 说明 |
|------|------|
| `@next/env` | drizzle.config.ts 中 loadEnvConfig 使用 |
| `@types/node` | Node.js 类型（process.env） |
| `drizzle-kit` | 迁移生成工具 |
| `typescript` | 类型检查 |

## 验证命令

每次修改 `packages/db` 后必须执行：

```bash
pnpm --filter @repo/db typecheck
pnpm --filter @repo/db lint
pnpm --filter @repo/db format
pnpm --filter @repo/db db:generate
pnpm --filter @repo/web build
pnpm build
```

## 后续拆包计划

以下包尚未拆分，将在后续阶段处理：

- `packages/auth` — better-auth 配置
- `packages/payment` — Stripe/Creem provider
- `packages/credits` — 积分系统
- `packages/mail` — 邮件发送
- `packages/storage` — S3/R2 存储
- `packages/ui` — React UI 组件
- `packages/notification` — 通知系统
- `packages/newsletter` — 订阅通讯
