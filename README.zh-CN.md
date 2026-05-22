![AeloKit Open Graph](apps/web/public/aelokit-og.png)

# AeloKit

AeloKit 是一个 AI-native SaaS engineering foundation，用于构建生产就绪的 AI 工作空间、Agent-enabled SaaS 产品和可自托管 AI 平台。

它不是普通 chatbot starter。AeloKit 将生产级 SaaS 底座与 AI 工作空间的第一层能力结合在一起：认证、计费、积分、内容、存储、应用界面、AI contracts、流式聊天、持久化、记忆、知识库、检索 metadata 和 usage audit foundation。

## AeloKit 是什么？

AeloKit 是一个 pnpm + Turborepo workspace，以 `apps/web` 中的 Next.js App Router 应用为中心，并通过 `packages/*` 提供可复用领域包。

当前产品方向由 `docs/product/AELOKIT_AI_SAAS_PLATFORM_PRD.md` 定义：构建一个 AI-native SaaS engineering foundation，支持生产级 AI 工作空间、Agent-enabled 产品和未来可自托管平台层。

## 为什么选择 AeloKit？

- 从真实 SaaS 底座开始，而不是从零连接 auth、dashboard、billing、credits、email、storage、analytics、docs、env validation 和 deployment conventions。
- 让 AI UI、runtime wiring、contracts、persistence、DB schema、provider secrets 和 credits ownership 留在清晰模块中。
- 先跑通 AI workspace 闭环：流式响应、对话状态持久化、citation/tool status foundation 和 usage audit，再扩展更重的 Agent platform 能力。

## 当前能力

- `apps/web` 中的 Next.js App Router web app。
- `apps/web` 内置 SaaS marketing、docs、dashboard、settings、admin、pricing、auth、payment、knowledge 和 chat surfaces。
- Better Auth 集成。
- `@repo/db` 中的 Drizzle + PostgreSQL 数据库包。
- `@repo/payment` 中的 Stripe / Creem-ready payment package。
- `@repo/credits` 中的 credits package 和 ledger primitives。
- 通过 `@repo/env` 做 env validation。
- Fumadocs content pipeline。
- Storage、mail、newsletter、notification、analytics、i18n、config 和 shared utility packages。
- `apps/web/src/components` 中的 app-local UI components，包括 shadcn/ui-style primitives。

## AI 平台能力

### 已实现基础

- `@repo/ai` AI contracts package，覆盖 providers、models、agents、tools、skills、memory、knowledge、MCP、usage、permissions、errors、AI SDK adapters、Mastra adapters 和 runtime types。
- `apps/web/src/components/ai` 中基于 assistant-ui 的 chat workspace components。
- Vercel AI SDK streaming route：`POST /api/ai/chat`。
- web app AI runtime layer 中的 OpenAI provider wiring。
- 数据库层中的 AI thread、message、message part、tool call 和 usage audit persistence。
- Tool call persistence foundation。
- Mastra memory integration。
- Manual knowledge source ingestion。
- Embedding、vector retrieval 和 citation metadata foundation。
- AI usage audit、cost event 和 credits billing foundation。
- Admin usage audit surface。
- 通过 env validation 保持 AI provider 和 embedding secrets server-side。

### 进行中 / 未来方向

以下是 PRD 中的产品方向，不代表当前代码库已经完整支持：

- Full agent runtime。
- Full MCP platform。
- Public gateway。
- 用于 background AI jobs、embedding、indexing、summaries、retries 和 long-running runs 的 worker。
- 用于 agent、skill、workflow、prompt、tool 和 eval 配置的 studio。
- 用于 logs、traces、evals、cost dashboards、model performance 和 workflow inspection 的 observability platform。
- Full BYOK。
- Multi-tenant enterprise org/workspace support。
- Full eval system。
- 当 app-local AI presentation components 稳定且 dependency-clean 后，再沉淀 shared design system package。

## 技术栈

- Turborepo + pnpm workspace
- Next.js App Router + React + TypeScript
- Tailwind CSS + shadcn/ui-style primitives
- PostgreSQL + Drizzle ORM
- Better Auth
- Vercel AI SDK
- assistant-ui
- Mastra
- Stripe / Creem-ready payment package
- Resend-ready mail and newsletter flows
- S3-compatible object storage
- Fumadocs MDX content
- Biome for linting and formatting

## 快速开始

```bash
pnpm install
cp env.example .env
pnpm dev
```

从 Next.js 打印的本地 URL 打开 web app。

## 环境变量

`env.example` 是本仓库唯一完整的环境变量参考文件。复制为 `.env` 用于本地开发，并为你启用的 providers 填写真实值。

不要提交 secrets。应用代码应通过 `@repo/env/server` 或 `@repo/env/client` 读取业务环境变量，不要临时直接访问 `process.env`。

常用验证命令：

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

# Web app
pnpm --filter @repo/web dev
pnpm --filter @repo/web build
pnpm --filter @repo/web content
pnpm --filter @repo/web lint
pnpm --filter @repo/web typecheck

# Database package
pnpm --filter @repo/db db:generate
pnpm --filter @repo/db db:migrate
pnpm --filter @repo/db db:studio
```

在目标环境和凭证明确之前，不要对共享数据库运行 database migrations。

## Workspace 结构

```text
apps/
  web/

packages/
  ai/
  analytics/
  auth/
  config/
  credits/
  db/
  env/
  i18n/
  mail/
  newsletter/
  notification/
  payment/
  shared/
  storage/
```

当前 UI 位于 `apps/web/src/components/`。目前没有 `packages/ui` 或 `packages/design-system`。

## 重要边界

- `apps/web` 是当前完整 SaaS app。不要在用户确认任务打开 scope 前拆分 future apps。
- `packages/*` 拥有可复用领域逻辑，不得 import app code。
- Drizzle schema 和真实 migrations 归 `packages/db/src` 所有。
- `apps/web/src/db/*` 是 compatibility shim 区域。
- `@repo/ai` 拥有 contracts、types、adapters 和 runtime type definitions；不拥有 route handlers、React UI、DB queries、schema、migrations、provider SDK initialization 或 live runtime execution。
- `apps/web/src/ai` 拥有 web app AI runtime wiring。
- AI chat route 是 `POST /api/ai/chat`；不要创建 generic `/api/chat` route。
- Provider 和 embedding secrets 必须保持 server-side。
- AI usage audit 与 credits ledger mutation 分离。

## 验证命令

```bash
pnpm check:env
pnpm check:package-exports
pnpm check:db-shims
pnpm --filter @repo/web typecheck
pnpm --filter @repo/web lint
pnpm --filter @repo/db typecheck
pnpm --filter @repo/ai typecheck
```

除非任务明确要求完整验证，否则只运行与本次改动相关的检查。

## 部署

推荐的托管部署目标是 Vercel，以 `apps/web` 为 root directory。

- Root Directory: `apps/web`
- Install Command: `pnpm install --frozen-lockfile`
- Build Command: `pnpm build`
- Output: Next.js default

Docker builds 从 monorepo root 运行：

```bash
docker build -t aelokit .
```

在部署提供商中设置生产 secrets，不要放在仓库里。

## 文档

产品北极星位于：

- `docs/product/AELOKIT_AI_SAAS_PLATFORM_PRD.md`

工程规则位于：

- `AGENTS.md`
- `CLAUDE.md`

## License

本仓库目前使用 MIT License。在分发商业产品或托管衍生作品前，请阅读 [LICENSE](LICENSE)，如果分发模式发生变化，请用最终产品许可条款替换本节。
