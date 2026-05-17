# 仓库规范

## Monorepo 结构

本项目使用 pnpm workspace + Turborepo 管理。

- `apps/web/`：当前完整 SaaS 单体应用
- `packages/config/`：跨 app 共享的核心 SaaS 静态配置和配置类型（`@repo/config`）
- `packages/shared/`：跨 app/package 共享的纯工具函数、常量、类型（`@repo/shared`）
- `packages/env/`：跨 app/package 共享的环境变量验证（`@repo/env`）
- `packages/i18n/`：跨 app/package 共享的国际化路由和消息（`@repo/i18n`）
- `packages/db/`：跨 app/package 共享的 Drizzle 数据库层（`@repo/db`）
- `packages/auth/`：跨 app/package 共享的认证核心层（`@repo/auth`）
- `packages/payment/`：跨 app/package 共享的支付领域包（`@repo/payment`）
- `packages/credits/`：跨 app/package 共享的积分领域包（`@repo/credits`）
- `packages/mail/`：跨 app/package 共享的事务邮件领域包（`@repo/mail`）
- `packages/newsletter/`：跨 app/package 共享的邮件订阅领域包（`@repo/newsletter`）
- `packages/notification/`：跨 app/package 共享的系统通知领域包（`@repo/notification`）
- `packages/storage/`：跨 app/package 共享的对象存储领域包（`@repo/storage`）
- `packages/analytics/`：跨 app/package 共享的统计分析领域包（`@repo/analytics`）
- `packages/`：后续拆包位置，当前不要随意创建业务包
- 根目录：workspace 编排、turbo、CI、工程文档、AI 编码规则

## 常用命令

```bash
# Monorepo 级命令（通过 Turbo 编排）
pnpm install
pnpm dev
pnpm build
pnpm lint
pnpm format
pnpm typecheck

# Web 应用命令（通过 filter 指定）
pnpm --filter @repo/web dev
pnpm --filter @repo/web build
pnpm --filter @repo/web content
pnpm --filter @repo/web db:generate
pnpm --filter @repo/web db:migrate
pnpm --filter @repo/web db:push
pnpm --filter @repo/web db:studio
pnpm --filter @repo/web email

# Env 包命令
pnpm --filter @repo/env typecheck
pnpm --filter @repo/env lint
pnpm --filter @repo/env format

# I18n 包命令
pnpm --filter @repo/i18n typecheck
pnpm --filter @repo/i18n lint
pnpm --filter @repo/i18n format

# DB 包命令
pnpm --filter @repo/db db:generate
pnpm --filter @repo/db db:migrate
pnpm --filter @repo/db db:push
pnpm --filter @repo/db db:studio
pnpm --filter @repo/db typecheck
pnpm --filter @repo/db lint
pnpm --filter @repo/db format

# Auth 包命令
pnpm --filter @repo/auth typecheck
pnpm --filter @repo/auth lint
pnpm --filter @repo/auth format

# Payment 包命令
pnpm --filter @repo/payment typecheck
pnpm --filter @repo/payment lint
pnpm --filter @repo/payment format

# Credits 包命令
pnpm --filter @repo/credits typecheck
pnpm --filter @repo/credits lint
pnpm --filter @repo/credits format

# Mail 包命令
pnpm --filter @repo/mail typecheck
pnpm --filter @repo/mail lint
pnpm --filter @repo/mail format

# Newsletter 包命令
pnpm --filter @repo/newsletter typecheck
pnpm --filter @repo/newsletter lint
pnpm --filter @repo/newsletter format

# Notification 包命令
pnpm --filter @repo/notification typecheck
pnpm --filter @repo/notification lint
pnpm --filter @repo/notification format

# Storage 包命令
pnpm --filter @repo/storage typecheck
pnpm --filter @repo/storage lint
pnpm --filter @repo/storage format

# Analytics 包命令
pnpm --filter @repo/analytics typecheck
pnpm --filter @repo/analytics lint
pnpm --filter @repo/analytics format

# 快捷命令
pnpm web:dev
pnpm web:build
pnpm web:content
pnpm web:db:generate
```

## 项目结构与模块组织

路由和服务器操作位于 `apps/web/src/app` 中（本地化页面放在 `[locale]` 目录下）。可复用的 UI 组件放在 `apps/web/src/components` 中——包括 `ui/`、`magicui`、`tailark/` 等库，以及按领域划分的文件夹。共享逻辑和 AI 工作流放在 `apps/web/src/lib` 和 `apps/web/src/ai` 中，Drizzle 的 schema 和迁移文件放在 `packages/db/src` 中（`apps/web/src/db` 是兼容 shim，不是真实 schema 所有权位置）。事务性邮件放在 `apps/web/src/mail`，数据分析提供商放在 `apps/web/src/analytics`，静态资源放在 `apps/web/public/`，运维脚本放在 `apps/web/scripts/`，营销/文档内容放在 `apps/web/content/`。

## DB Shim 边界规则

- `apps/web/src/db/*` 是兼容 shim，只包含 `export * from '@repo/db/...'` 形式的 re-export
- 真实 schema 所有权在 `packages/db/src/*`
- 任何 schema generate 命令不得写入 `apps/web/src/db/*`
- `auth:schema:generate` 输出到 `packages/db/src/auth.schema.reference.ts`（参考文件，不覆盖手写 schema）
- `db:generate` 读取 `packages/db/src/schema.ts`
- 使用 `pnpm check:db-shims` 验证 shim 边界
- 使用 `pnpm check:package-exports` 验证 package exports 边界

## Payment Shim 边界规则

- `apps/web/src/payment/*` 是兼容 shim，re-export 自 `@repo/payment`
- 真实支付领域逻辑所有权在 `packages/payment/src/*`
- `apps/web/src/payment/index.ts` 注入 app 层回调（credits、notification、price-plan 等），然后委托给 `@repo/payment`
- checkout actions、webhook route handlers、pricing/billing UI 仍保留在 `apps/web`
- `@repo/payment` 不依赖 `@repo/auth`、next-intl、React、Next runtime

## Credits Shim 边界规则

- `apps/web/src/credits/*` 是兼容 shim，re-export 自 `@repo/credits`
- 真实积分领域逻辑所有权在 `packages/credits/src/*`
- credit checkout actions、credits UI 仍保留在 `apps/web`
- `@repo/credits` 不依赖 `@repo/payment`、`@repo/auth`、next-intl、React、Next runtime
- `@repo/payment` 与 `@repo/credits` 不允许互相依赖

## Mail Shim 边界规则

- `apps/web/src/mail/*` 是兼容 shim，re-export 自 `@repo/mail`
- 真实邮件领域逻辑所有权在 `packages/mail/src/*`
- 邮件模板、组件、渲染逻辑在 `packages/mail/src/templates` 和 `packages/mail/src/components`
- `apps/web/src/mail/templates/*` 保留 PreviewProps 配置用于 email preview
- Server Actions、route handlers、auth callbacks 仍保留在 `apps/web`
- `@repo/mail` 不依赖 `@repo/auth`、`@repo/payment`、`@repo/credits`、`@repo/db`、next-intl、Next runtime
- `@repo/mail` 使用 generic `Locale` 和 `Messages` 类型，具体类型由 app 层提供

## Newsletter Shim 边界规则

- `apps/web/src/newsletter/*` 是兼容 shim，re-export 自 `@repo/newsletter`
- 真实邮件订阅领域逻辑所有权在 `packages/newsletter/src/*`
- newsletter provider、subscribe/unsubscribe 服务在 `packages/newsletter`
- Server Actions、UI、hooks 仍保留在 `apps/web`
- `@repo/newsletter` 不依赖 `@repo/mail`、`@repo/auth`、`@repo/payment`、`@repo/credits`、`@repo/db`、next-intl、Next runtime
- `@repo/mail` 与 `@repo/newsletter` 不允许互相依赖

## Notification Shim 边界规则

- `apps/web/src/notification/*` 是兼容 shim，re-export 自 `@repo/notification`
- 真实系统通知领域逻辑所有权在 `packages/notification/src/*`
- notification provider、sendNotification 服务在 `packages/notification`
- Server Actions、route handlers 仍保留在 `apps/web`
- `@repo/notification` 不依赖 `@repo/mail`、`@repo/newsletter`、`@repo/auth`、`@repo/payment`、`@repo/credits`、`@repo/db`、next-intl、Next runtime
- `@repo/notification` 只依赖 `@repo/config` 和 `@repo/env`
- `apps/web/src/notification/index.ts` 注入 app 层配置（botName、avatarUrl 等），然后委托给 `@repo/notification`

## Storage Shim 边界规则

- `apps/web/src/storage/*` 是兼容 shim，re-export 自 `@repo/storage`
- 真实对象存储领域逻辑所有权在 `packages/storage/src/*`
- storage provider、uploadFile/deleteFile 服务在 `packages/storage`
- `apps/web/src/storage/client.ts` 是浏览器专用上传函数，保留在 `apps/web`
- Server Actions、route handlers、upload UI 仍保留在 `apps/web`
- `@repo/storage` 不依赖 `@repo/auth`、`@repo/payment`、`@repo/credits`、`@repo/mail`、`@repo/newsletter`、`@repo/notification`、`@repo/db`、next-intl、Next runtime
- `@repo/storage` 只依赖 `@repo/config`、`@repo/env` 和 `s3mini`

## Analytics Shim 边界规则

- `apps/web/src/analytics/*` 是兼容 shim，re-export 自 `@repo/analytics`
- 真实统计分析领域逻辑所有权在 `packages/analytics/src/*`
- analytics types、provider interface、config helpers、event names 在 `packages/analytics`
- React Provider 组件、Script 注入组件仍保留在 `apps/web/src/analytics/*.tsx`
- dashboard analytics UI、admin analytics UI 仍保留在 `apps/web`
- `@repo/analytics` 不依赖 `@repo/auth`、`@repo/payment`、`@repo/credits`、`@repo/mail`、`@repo/newsletter`、`@repo/notification`、`@repo/storage`、`@repo/db`、next-intl、Next runtime、React
- `@repo/analytics` 只依赖 `@repo/config` 和 `@repo/env`
- client.ts 只能使用 browser-safe 逻辑和 `NEXT_PUBLIC_*` 环境变量
- server.ts 可以使用 server env 和 Node SDK

## Env 边界规则

- `packages/env/` 是环境变量验证包（`@repo/env`）
- 第一版使用简单结构：`server.ts` / `client.ts` / `shared.ts`
- 不创建 `core/*` 子目录，不拆 `auth/payment/storage/analytics` 子模块
- `@repo/env` 不依赖任何 `@repo/*` 包
- client.ts 只能声明 `NEXT_PUBLIC_*` 变量，不能读取 server secret
- server.ts 可以声明所有 server-only 变量
- 根目录 `env.example` 是唯一完整 env 参考文件
- 不使用 `.env.example`，不要创建 `.env.example`
- 支持 `SKIP_ENV_VALIDATION=true` 用于 CI/build 环境
- `@repo/env` 已接入 web build-time validation（`apps/web/next.config.ts`）
- 不允许 client component import `@repo/env/server`
- 修改 env schema 后必须同步 `env.example`
- CI 可使用 `SKIP_ENV_VALIDATION=true` 跳过验证
- CI 会执行 `pnpm check:env` 验证 schema 与 env.example 一致性
- 新代码不要直接使用业务 env 的 `process.env`，使用 `@repo/env/server` 或 `@repo/env/client`
- `process.env.NODE_ENV` 可以保留
- 允许保留的 `process.env`：`NODE_ENV`、`SKIP_ENV_VALIDATION`、平台变量（如 `DOCKER_BUILD`、`DISABLE_IMAGE_OPTIMIZATION`）
- 新增环境变量必须同步更新：schema + env.example + 运行 `pnpm check:env`

## 构建、测试和开发命令

使用 `pnpm install` 安装依赖，运行 `pnpm dev` 启动本地 Next.js 开发服务器。使用 `pnpm build` 生成优化后的构建包，使用 `pnpm --filter @repo/web start` 启动生产服务器。`pnpm lint` 触发 Biome 代码检查，`pnpm format` 应用一致的代码格式化。数据库操作通过 Drizzle 完成：`pnpm --filter @repo/db db:generate` 从 schema 生成 SQL，`pnpm --filter @repo/db db:migrate` 应用本地变更，`pnpm --filter @repo/db db:push` 同步到远程实例（`pnpm --filter @repo/web db:*` 命令会代理到 `@repo/db`）。辅助工具包括 `pnpm --filter @repo/web email` 用于邮件预览，以及实用脚本如 `pnpm --filter @repo/web list-users` 或 `pnpm --filter @repo/web fix-payments`。

## 代码风格与命名规范

Biome (`biome.json`) 强制执行两空格缩进、单引号、ES5 尾随逗号和必需的分号。模块文件名使用短横线命名法（`dashboard-sidebar.tsx`），Hook 使用 `use-` 前缀（`use-session.ts`），工具函数默认使用命名导出。Tailwind 工具类位于 `apps/web/src/styles`；在那里扩展设计令牌，而不是分散使用魔法值。服务器端专用代码放在标记了 `"use server"` 的文件中，避免将这些模块引入客户端 Hook。

## 依赖归属规则

- 每个 workspace 必须声明自己直接 import 的依赖，包括 `@repo/*` 内部包
- root 只放 monorepo 编排、workspace-wide tooling 和 root scripts 直接使用的 CLI
- 不要依赖 `apps/web` 的依赖穿透
- 新增 import 必须同步更新所属 workspace 的 `package.json`
- 不确定依赖不要删除，先标记 `needs-manual-review`

## 测试规范

自动化测试尚未集成到 package 脚本中，因此请使用 `pnpm dev`、代码检查以及对认证、计费和 AI 流程的重点手动 QA 来验证变更。添加测试运行器时，将测试文件与功能放在同一目录下，使用 `.test.ts(x)` 或 `.spec.ts(x)` 后缀，并在 PR 中记录相关命令。每当数据变更需要供审阅者使用时，更新 `apps/web/src/db/migrations` 中的 fixtures。

## 提交与合并请求规范

遵循提交日志中使用的 Conventional Commit 风格（`feat:`、`fix:`、`chore:`）。保持提交范围聚焦，在正文中引用 issue ID，当环境变量变更时更新 `env.example`。PR 应包含简洁的摘要、测试说明（命令 + 结果）、UI 更新的截图，以及文档或配置变更的标注。检查通过后请求审阅，并尽早高亮破坏性变更。

## 配置与密钥

运行命令前将 `env.example` 复制为 `.env`。生产环境凭证存储在部署提供商（Vercel、Cloudflare）处，切勿提交密钥。为 `opennextjs-cloudflare` 或 `wrangler` 使用有作用域的 API 密钥，轮换与 `apps/web/src/ai` 中提供商关联的密钥，并在合并前移除临时调试日志。

## UI 边界规则

- 当前**没有** `packages/ui`
- UI 组件位于 `apps/web/src/components/`
- `ui/` 目录包含 shadcn/ui 原语（52 个组件）
- `magicui/`、`animate-ui/`、`tailark/`、`diceui/` 是第三方库组件，不抽入 `packages/ui`
- `blocks/`、`auth/`、`admin/`、`settings/`、`pricing/`、`dashboard/`、`docs/` 是业务组件，不抽入 `packages/ui`
- 未来抽取 `packages/ui` 时，只包含纯 UI 原语（button、card、dialog 等），不包含：
  - 依赖 `next-intl` 的组件
  - 依赖 `next/navigation`、`next/link` 的组件
  - 依赖 `@/actions`、`@/db`、`@/payment`、`@/credits` 等的组件
  - 依赖 `authClient` 的组件
- 抽取 `packages/ui` 前需完成 Phase 2.13 UI 边界审计（见 `docs/migration/MONOREPO_PHASE_2_13_UI_BOUNDARY_AUDIT.md`）

## 禁止事项

- 不要创建根 `src/` 目录
- 不要把业务文件放回根目录
- 不要提前拆 `apps/admin`、`apps/landing`、`apps/docs`、`apps/worker`、`apps/gateway`、`apps/studio`
- 不要提前抽 `packages/ui`
- 不要把业务组件放入未来 `packages/ui`
- 不要把 i18n 依赖组件放入未来 `packages/ui`
- 不要把 auth/payment/credits 依赖组件放入未来 `packages/ui`
- 不要改技术栈
- 不要删除现有功能
