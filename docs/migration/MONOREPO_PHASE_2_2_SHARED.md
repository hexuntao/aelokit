# Phase 2.2：抽取 packages/shared

## 概述

创建 `@repo/shared` 包，只承载纯 TypeScript 工具函数、常量、类型，为后续 `db/auth/payment/credits/mail/storage/ui` 拆包做基础。

## 当前状态

- `@repo/shared` 已创建，当前只承载纯工具/类型/常量
- `apps/web/src/lib/utils.ts` 是兼容 shim，重新导出 `@repo/shared/utils` 的 `cn`
- `apps/web/src/lib/formatter.ts` 是兼容 shim，重新导出 `@repo/shared/utils` 的 `formatPrice`/`formatDate`
- `@repo/shared` 不包含 db/auth/payment/credits/ui
- `@repo/shared` 不允许 import app 内部路径（`@/`）
- `@repo/shared` 不依赖 `next`、`next-intl`、`react`、`better-auth`、`drizzle`、`stripe`、`resend` 等框架/业务包
- `@repo/shared` 不使用 `process.env`

## 已抽取内容

### utils

| 函数 | 来源 | 说明 |
|------|------|------|
| `cn` | `apps/web/src/lib/utils.ts` | Tailwind class 合并工具 |
| `formatPrice` | `apps/web/src/lib/formatter.ts` | 价格格式化（分→元） |
| `formatDate` | `apps/web/src/lib/formatter.ts` | 日期格式化 |

### constants

暂无内容，预留目录。

### types

暂无内容，预留目录。

## 未抽取的候选文件及原因

| 文件 | 原因 |
|------|------|
| `lib/constants.ts` | 含 credits/payment 业务常量，不属于纯通用常量 |
| `lib/urls.ts` | 依赖 `@/i18n/routing`、`next-intl`、`process.env` |
| `routes.ts` | 应用路由结构，后续可能成为 `packages/routing` 或留在 app 层 |
| `lib/compose-refs.ts` | 依赖 `react` |
| `lib/get-strict-context.tsx` | 依赖 `react` |
| `lib/auth-types.ts` | 依赖 `better-auth` |
| `lib/auth-client.ts` | 依赖 `better-auth` |
| `lib/auth.ts` | 重度依赖 db/auth/config/payment/credits/mail |
| `lib/demo.ts` | 使用 `process.env` |
| `lib/server.ts` | 依赖 `server-only`、`next/headers`、`react` |
| `lib/safe-action.ts` | 依赖 `next-safe-action`、auth |
| `lib/captcha.ts` | 依赖 `@/config/website`、`process.env` |
| `lib/metadata.ts` | 依赖 `@/config/website`、`@/i18n`、`next`、`next-intl` |
| `lib/hreflang.ts` | 依赖 `@/config/website`、`@/i18n`、`next-intl` |
| `lib/premium-access.ts` | 依赖 `@/db`、`drizzle-orm` |
| `lib/price-plan.ts` | 依赖 `@/config/website`、`@/payment/types` |
| `lib/source.ts` | 依赖 `fumadocs`、`lucide-react`、`react` |
| `lib/get-llm-text.ts` | 依赖 `fumadocs`、`@/lib/source` |
| `lib/require-session.ts` | 依赖 `server-only`、`next/server`、`better-auth` |
| `types/index.d.ts` | 依赖 `@repo/config`、`react`，含菜单/导航类型 |
| `types/next-page-props.tsx` | Next.js App Router 专属类型 |

## 兼容 shim

以下文件已改为 shim，保持 app 内现有 import 不变：

- `apps/web/src/lib/utils.ts` → `export { cn } from '@repo/shared/utils'`
- `apps/web/src/lib/formatter.ts` → `export { formatPrice, formatDate } from '@repo/shared/utils'`

## 后续拆包计划

以下包尚未拆分，将在后续阶段处理：

- `packages/db` — Drizzle schema + 数据库连接
- `packages/auth` — better-auth 配置
- `packages/payment` — Stripe/Creem provider
- `packages/credits` — 积分系统
- `packages/mail` — 邮件发送
- `packages/storage` — S3/R2 存储
- `packages/ui` — React UI 组件
- `packages/notification` — 通知系统
- `packages/newsletter` — 订阅通讯
