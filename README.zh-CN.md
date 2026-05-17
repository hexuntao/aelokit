![AeloKit Open Graph](apps/web/public/aelokit-og.png)

# AeloKit

AeloKit 是一个 OpenAI 风格的开源全栈工具包，用于构建可自托管、生产就绪的 AI 聊天和 Agent 工作空间。

从样板代码到生产环境——快速交付你的 AI 工作空间。

## 价值主张

- **已连接好的产品基础。** 认证、仪表盘结构、计费、积分、邮件、存储、通知、数据分析、文档、配置、环境验证和部署规范都已组织为生产级基础。
- **Agent 就绪的代码和 UI 组织。** 应用程序为可替换的模型访问、可组合的工具/函数调用、清晰的对话状态，以及未来的评估、可观测性、成本控制和权限边界而设计。
- **平静的工作空间体验。** 默认界面注重留白、层级、可读的消息、引用、附件、会话管理和响应式布局，让用户专注于内容和操作。

## 适用人群

- 构建商业 AI 聊天或 Agent 工作空间的创始人。
- 想要可自托管的 SaaS 基础，但不想从零组装每个产品原语的开发者。
- 为客户交付可复用 AI 工作空间的代理商和顾问。
- 使用真实认证、计费、存储和运维界面原型化 Agent 工作流的内部平台团队。

## 功能概览

- Next.js Web 应用，包含本地化营销页面、认证页面、仪表盘、设置、定价、文档、博客、更新日志、路线图和法律页面。
- Better Auth 集成，支持凭证登录和社交登录。
- Drizzle + PostgreSQL 数据库包，带有应用层兼容 shim。
- 支付、订阅、终身计划、积分包和交易原语。
- 事务邮件、邮件订阅、通知、存储和数据分析包。
- 类型化的网站配置和共享环境验证。
- Fumadocs 驱动的文档和 MDX 内容管道。
- 基于现有应用组件系统构建的响应式 UI。

## 技术栈

- Turborepo + pnpm workspace
- Next.js App Router + React + TypeScript
- Tailwind CSS + shadcn/ui 风格原语
- PostgreSQL + Drizzle ORM
- Better Auth
- Stripe / Creem 就绪的支付包
- Resend 就绪的邮件和订阅流程
- S3 兼容的对象存储
- Biome 用于代码检查和格式化

## 快速开始

```bash
pnpm install
cp env.example .env
pnpm dev
```

从 Next.js 打印的本地 URL 打开 Web 应用。

## 环境变量

`env.example` 是本仓库唯一完整的环境参考文件。将其复制为 `.env` 用于本地开发，并为你启用的提供商填写真实值。

不要提交密钥。应用代码应通过 `@repo/env/server` 或 `@repo/env/client` 读取业务环境变量，而非临时性的 `process.env` 访问。

有用的验证命令：

```bash
pnpm check:env
```

## 本地开发

```bash
# Monorepo
pnpm dev
pnpm build
pnpm lint
pnpm typecheck

# Web 应用
pnpm --filter @repo/web dev
pnpm --filter @repo/web build
pnpm --filter @repo/web content
pnpm --filter @repo/web lint
pnpm --filter @repo/web typecheck

# 数据库包
pnpm --filter @repo/db db:generate
pnpm --filter @repo/db db:migrate
pnpm --filter @repo/db db:studio
```

在目标环境和凭证明确之前，不要对共享数据库运行数据库迁移。

## Workspace 结构

```text
apps/
  web/              # 完整的 SaaS 应用
packages/
  config/           # 共享的 SaaS 配置和类型
  env/              # 共享的环境验证
  i18n/             # 国际化路由和消息
  db/               # Drizzle 数据库层
  auth/             # 认证核心
  payment/          # 支付领域包
  credits/          # 积分领域包
  mail/             # 事务邮件包
  newsletter/       # 邮件订阅包
  notification/     # 通知包
  storage/          # 对象存储包
  analytics/        # 数据分析包
  shared/           # 共享的纯工具函数、常量和类型
```

当前 UI 位于 `apps/web/src/components/`。目前没有 `packages/ui`，后期增加。

## 部署

推荐的托管部署目标是 Vercel，以 `apps/web` 为根目录。

- Root Directory: `apps/web`
- Install Command: `pnpm install --frozen-lockfile`
- Build Command: `pnpm build`
- Output: Next.js default

Docker 构建从 monorepo 根目录运行：

```bash
docker build -t aelokit .
```

在生产部署提供商中设置生产密钥，不要放在仓库中。

## 许可证和商业使用

本仓库目前使用 MIT 许可证。在分发商业产品或托管衍生作品之前，请查阅 [LICENSE](LICENSE)，如果你的分发模式发生变化，请用你的最终产品许可条款替换本节。
