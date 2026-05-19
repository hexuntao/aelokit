# Claude Code 规则

本文件是 Claude Code 使用的仓库规则摘要。若与根目录 `AGENTS.md` 冲突，以根目录 `AGENTS.md` 为准。

最后更新：2026-05-19

## 项目概述

本项目是一个 pnpm workspace + Turborepo monorepo，当前只有一个应用 `apps/web`。

## 目录结构

- `apps/web/`：完整 SaaS 单体应用
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
- `packages/ai/`：v0.1 已创建的 AI contracts/types/adapters/runtime-types 包（`@repo/ai`）
- `packages/`：后续拆包位置
- 根目录：workspace 编排、turbo、CI、工程文档

## 关键路径

- App Router：`apps/web/src/app/`
- Fumadocs content：`apps/web/content/`
- Drizzle schema：`packages/db/src/`（`apps/web/src/db/` 是兼容 shim，不是真实 schema 所有权位置）
- 国际化消息：`apps/web/messages/`
- 国际化包：`packages/i18n/`（`@repo/i18n`，路由配置、消息处理、URL 本地化、hreflang 生成）
- 业务脚本：`apps/web/scripts/`
- 静态资源：`apps/web/public/`
- 邮件模板：`packages/mail/src/templates/`（`apps/web/src/mail/` 是兼容 shim，包含 PreviewProps 配置）
- 共享邮件包：`packages/mail/`（`@repo/mail`，邮件类型、Provider 接口、Resend 实现、渲染、模板、组件）
- 支付模块：`packages/payment/`（`@repo/payment`，支付类型、Provider 接口、Stripe/Creem 实现、registry）
- `apps/web/src/payment/`：兼容 shim，注入 app 层回调后委托给 `@repo/payment`
- 积分模块：`packages/credits/`（`@repo/credits`，积分类型、余额查询、add/consume、订阅赠送、lifetime monthly、批量分发）
- `apps/web/src/credits/`：兼容 shim，re-export 自 `@repo/credits`
- 存储模块：`apps/web/src/storage/`（兼容 shim，re-export 自 `@repo/storage`）
- 共享存储包：`packages/storage/`（`@repo/storage`，storage provider、uploadFile/deleteFile、S3 实现）
- 通知模块：`apps/web/src/notification/`（兼容 shim，re-export 自 `@repo/notification`）
- 共享通知包：`packages/notification/`（`@repo/notification`，notification provider、sendNotification、Discord/Feishu 实现）
- 订阅通讯：`apps/web/src/newsletter/`（兼容 shim，re-export 自 `@repo/newsletter`）
- 共享订阅通讯包：`packages/newsletter/`（`@repo/newsletter`，newsletter provider、subscribe/unsubscribe、Beehiiv/Resend 实现）
- 共享通知包：`packages/notification/`（`@repo/notification`，notification provider、sendNotification、Discord/Feishu 实现）
- 分析模块：`apps/web/src/analytics/`（兼容 shim，re-export 自 `@repo/analytics`；React Provider 组件保留在 `apps/web/src/analytics/*.tsx`）
- 共享分析包：`packages/analytics/`（`@repo/analytics`，analytics types、provider interface、config helpers、event names、client/server helpers）
- AI runtime wiring：`apps/web/src/ai/`（当前 v0.2/v0.3 runtime wiring，包含 provider、Mastra、memory、knowledge、policy 等 app-local 能力）
- AI contracts 包：`packages/ai/`（`@repo/ai`，v0.1 已创建；只放 contracts/types/adapters/runtime-types）
- 配置文件：`apps/web/src/config/`
- 共享配置包：`packages/config/`（`@repo/config`，`websiteConfig` 的来源）
- 共享工具包：`packages/shared/`（`@repo/shared`，纯工具函数 `cn`/`formatPrice`/`formatDate` 等）
- 共享数据库包：`packages/db/`（`@repo/db`，Drizzle schema + db client + migrations）
- 共享认证包：`packages/auth/`（`@repo/auth`，better-auth server/client config + types + helpers）
- 共享支付包：`packages/payment/`（`@repo/payment`，支付类型、Provider 接口、Stripe/Creem 实现、registry、helpers）
- 共享积分包：`packages/credits/`（`@repo/credits`，积分类型、余额查询、add/consume、订阅赠送、lifetime monthly、批量分发）
- 共享订阅通讯包：`packages/newsletter/`（`@repo/newsletter`，newsletter provider、subscribe/unsubscribe、Beehiiv/Resend 实现）

## 配置文件位置

- Next.js 配置：`apps/web/next.config.ts`
- Fumadocs 配置：`apps/web/source.config.ts`
- Drizzle 配置：`packages/db/drizzle.config.ts`
- shadcn/ui 配置：`apps/web/components.json`
- PostCSS 配置：`apps/web/postcss.config.mjs`
- TypeScript 配置：`apps/web/tsconfig.json`
- 全局类型声明：`apps/web/global.d.ts`
- Vercel 配置：`apps/web/vercel.json`

## 根目录配置

- Biome：`biome.json`（workspace 级）
- TypeScript 基础：`tsconfig.base.json`
- Turborepo：`turbo.json`
- pnpm workspace：`pnpm-workspace.yaml`
- Docker：`Dockerfile`（根目录，适配 monorepo）
- 环境变量模板：`env.example`

## 运行命令

优先使用 `pnpm --filter @repo/web` 来运行 web 应用命令：

```bash
pnpm --filter @repo/web dev
pnpm --filter @repo/web build
pnpm --filter @repo/web content
pnpm --filter @repo/web db:generate
pnpm --filter @repo/web db:migrate
pnpm --filter @repo/web db:push
pnpm --filter @repo/web db:studio
pnpm --filter @repo/web email
pnpm --filter @repo/web lint
pnpm --filter @repo/web format
```

DB 包命令：

```bash
pnpm --filter @repo/db db:enable-pgvector
```

Monorepo 级命令：

```bash
pnpm install
pnpm dev
pnpm build
pnpm lint
pnpm format
pnpm typecheck
```

快捷命令：

```bash
pnpm web:dev
pnpm web:build
pnpm web:content
pnpm web:db:generate
```

## 包管理

- 根 `package.json` 只放 monorepo 编排、workspace-wide tooling 和 root scripts 直接使用的 CLI，不放业务 runtime 依赖
- 每个 workspace 必须声明自己直接 import 的依赖，包括 `@repo/*` 内部包
- 不要依赖 `apps/web` 的依赖穿透
- 新增 import 必须同步更新所属 workspace 的 `package.json`
- 不确定依赖不要删除，先标记 `needs-manual-review`
- Web 应用包名：`@repo/web`

## 路径别名

- `@/*` → `apps/web/src/*`
- `@/content/*` → `apps/web/content/*`
- `@/public/*` → `apps/web/public/*`

当前已抽取 `@repo/config`（配置）、`@repo/shared`（纯工具/类型）、`@repo/env`（环境验证）、`@repo/i18n`（国际化路由和消息）、`@repo/db`（Drizzle 数据库层）、`@repo/auth`（认证核心层）、`@repo/payment`（支付领域包）、`@repo/credits`（积分领域包）、`@repo/mail`（事务邮件领域包）、`@repo/newsletter`（邮件订阅领域包）、`@repo/notification`（系统通知领域包）、`@repo/storage`（对象存储领域包）、`@repo/analytics`（统计分析领域包）和 `@repo/ai`（AI contracts/types/adapters/runtime-types），其余 `@repo/*` 业务包尚未拆分。

## AI Infrastructure Guardrail

- AeloKit 的产品北极星是 `docs/product/AELOKIT_AI_SAAS_PLATFORM_PRD.md`。
- `packages/ai` 已在 v0.1 创建，当前职责仍是 AI contracts、provider/model/agent/tool/skill/memory/knowledge/MCP/usage/permission/types、lightweight AI SDK/Mastra adapter-compatible types 和 runtime type definitions。
- `packages/ai` 不负责 React UI、assistant-ui components、Next route handlers、cookies、server actions、app session、DB schema、DB query、credits ledger mutation、provider SDK 初始化或 live runtime execution。
- `apps/web/src/ai` 负责 web app runtime wiring：provider 初始化、session/context 注入、model/agent/tool 选择、Mastra/AI SDK runtime 连接、审计和 app policy。
- `apps/web/src/components/ai` 负责 web app 当前 AI UI。
- `apps/web/src/app/api/ai/chat/route.ts` 是首个 AI chat route 的规划命名，对外为 `POST /api/ai/chat`。
- 不要使用 `/api/chat` 作为首个 AI route。
- v0.2 usage 初期只做 audit，不接 credits 扣费。
- credits preflight/reservation/settlement 后续进入 v0.5，并且必须通过 `@repo/credits` 提供的能力完成。

## v0.2 AI Chat Gate

- v0.2 执行入口文档是 `docs/product/AI_CHAT_V0_2_*`。
- 后续每次只执行一个 `docs/product/AI_CHAT_V0_2_IMPLEMENTATION_PLAN.md` 中定义的 TASK。
- TASK-002 前必须执行 External Docs Gate：涉及 assistant-ui、Vercel AI SDK、Mastra、provider SDK、streaming response、message shape、tool call、usage metadata 或 persistence 兼容性时，必须查官方最新文档。
- 不允许凭旧 API、旧示例、记忆或猜测实现 assistant-ui / AI SDK / Mastra / provider SDK 接入。
- 如果官方文档与当前代码或 v0.2 文档冲突，先暂停并说明冲突点，不要硬写。
- v0.2 禁止创建 `/api/chat`，禁止 provider secret 进入 client，禁止 usage audit 调用 credits ledger。
- v0.2 禁止创建 worker/gateway/studio/design-system split，禁止实现 v0.3+ memory/RAG/MCP/credits charging。

## v0.2 Dependency Gate

- TASK-003 只输出 dependency install plan：exact package list、版本范围、安装命令、影响文件和兼容关系。
- 只有 TASK-003B 可以实际安装 v0.2 AI dependencies。
- TASK-003B 只能在用户确认 TASK-003 install plan 后执行。
- TASK-003B 只允许修改 `apps/web/package.json` 和 `pnpm-lock.yaml`。
- 其他 TASK 不允许顺手修改 `apps/web/package.json`、root `package.json` 或 `pnpm-lock.yaml`。

## v0.2 Schema Gate

- TASK-004 固定输出 `docs/product/AI_CHAT_V0_2_SCHEMA_DESIGN.md`。
- TASK-004 不创建 schema，不生成 migration，不运行 DB 命令。
- TASK-004 不允许把 schema design 写进 dependency research。
- TASK-005 只有在用户确认 schema design 和 migration 策略后，才允许创建 `packages/db/src/ai.schema.ts`、更新 `packages/db/src/schema.ts` 并生成 migration。
- AI schema 仍归 `packages/db`，不要把 DB query、schema 或 migration 放进 `packages/ai`。

## v0.3 Mastra Memory / Knowledge Gate

- v0.3 执行入口文档是 `docs/product/AI_MASTRA_MEMORY_KNOWLEDGE_V0_3_*`。
- Mastra runtime 只能在 `apps/web/src/ai/**`；`packages/ai` 仍只放 contracts/types/adapters/runtime-types。
- `/api/ai/chat` 仍是唯一 chat stream route；不要创建 `/api/chat`，不要绕过 v0.2 persistence 和 usage audit。
- v0.3 不接 MCP、credits charging、worker/gateway/studio split 或超出 Scope Freeze 的 v0.4+ 能力。
- memory/knowledge 必须有用户控制开关、确认流程或明确产品策略；knowledge source ownership、visibility 和 citation provenance 不能丢失。
- `knowledge.schema.ts` 只保存 AeloKit-owned metadata，不要扩展成 Mastra RAG internals mirror。

## v0.3 Env / PgVector / Validation

- Embedding env 在 `@repo/env/server`：`AI_EMBEDDING_PROVIDER`、`AI_EMBEDDING_MODEL`、`AI_EMBEDDING_BASE_URL`、`AI_EMBEDDING_API_KEY`；`AI_EMBEDDING_API_KEY` 可 fallback 到 `OPENAI_API_KEY`。
- `DATABASE_URL` 会影响 Mastra `PostgresStore`、PgVector 和 runtime smoke；provider/embedding secrets 不允许进入 client。
- `packages/db/scripts/enable-pgvector.ts` 和 `.sql` 用于启用 `vector` extension；`pgvector` 是 knowledge retrieval 前置条件，运行 DB extension 脚本前必须有用户确认。
- v0.3 验证至少运行：`pnpm check:env`、`pnpm check:package-exports`、`pnpm --filter @repo/ai typecheck`、`pnpm --filter @repo/db typecheck`、`pnpm --filter @repo/web typecheck`、`pnpm --filter @repo/web build`。
- Runtime Smoke 不能只用代码审查替代；无法完成 authenticated browser smoke 时必须标记 blocked/PARTIAL，不能标记 PASS。

## UI / Design System 边界规则

- 当前没有 `packages/ui`，也没有 `packages/design-system`。
- UI 组件位于 `apps/web/src/components/`。
- 未来目标是 `packages/design-system`，不是狭义 `packages/ui`。
- `packages/design-system` 后期可包含 `ui/`、`blocks/`、`marketing/`、`ai/`、`dashboard/`、`forms/`、`layouts/`、`icons/`、`tokens/`、`styles/`、`hooks/`、`utils/`。
- 当前不要创建 `packages/design-system`。
- `magicui/`、`animate-ui/`、`tailark/`、`diceui/` 是第三方库组件，不抽入未来 design-system，除非经过审计和重包装。
- `blocks/`、`auth/`、`admin/`、`settings/`、`pricing/`、`dashboard/`、`docs/` 是业务或 app-bound 组件，不提前抽入未来 design-system。
- 不允许把业务数据请求、server actions、auth session、payment/credits 逻辑放入未来 design-system。
- 组件未来要沉淀到 design-system，必须先消除 app route/action/auth/payment/credits 依赖，并有组件依赖审计和用户确认。

## 禁止事项

- 不要创建根 `src/` 目录
- 不要把业务文件放回根目录
- 不要提前拆 `apps/admin`、`apps/landing`、`apps/docs`、`apps/worker`、`apps/gateway`、`apps/studio`
- 不要提前创建 `packages/design-system`、`packages/api-client`、`packages/logger`、`packages/observability`、`packages/testing`
- 不要把 `packages/ai` 用作 runtime、route、UI、DB query、schema、migration 或 provider SDK 初始化层
- 不要把业务组件提前抽到未来 design-system
- 不要把 i18n/auth/payment/credits/server action 依赖组件放入未来 design-system
- 不要创建 `/api/chat` 作为 AI chat route
- 不要让 provider secret 进入 client
- 不要让 usage audit 调用 credits ledger
- 不要把 v0.3 memory/knowledge 扩展成 MCP、credits charging、worker/gateway/studio 或 v0.4+ RAG/agent workflow scope
- 不要改技术栈
- 不要删除现有功能
- 不要移除 `[locale]` 路由结构
- 不要移除 `[...rest]` catch-all 路由
- 不要移除 middleware/proxy

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
- `@repo/notification` 只依赖 `@repo/config`
- `apps/web/src/notification/index.ts` 注入 app 层配置（botName、avatarUrl 等），然后委托给 `@repo/notification`

## Storage Shim 边界规则

- `apps/web/src/storage/*` 是兼容 shim，re-export 自 `@repo/storage`
- 真实对象存储领域逻辑所有权在 `packages/storage/src/*`
- storage provider、uploadFile/deleteFile 服务在 `packages/storage`
- `apps/web/src/storage/client.ts` 是浏览器专用上传函数，保留在 `apps/web`
- Server Actions、route handlers、upload UI 仍保留在 `apps/web`
- `@repo/storage` 不依赖 `@repo/auth`、`@repo/payment`、`@repo/credits`、`@repo/mail`、`@repo/newsletter`、`@repo/notification`、`@repo/db`、next-intl、Next runtime
- `@repo/storage` 只依赖 `@repo/config` 和 `s3mini`

## Analytics Shim 边界规则

- `apps/web/src/analytics/*` 是兼容 shim，re-export 自 `@repo/analytics`
- 真实统计分析领域逻辑所有权在 `packages/analytics/src/*`
- analytics types、provider interface、config helpers、event names 在 `packages/analytics`
- React Provider 组件、Script 注入组件仍保留在 `apps/web/src/analytics/*.tsx`
- dashboard analytics UI、admin analytics UI 仍保留在 `apps/web`
- `@repo/analytics` 不依赖 `@repo/auth`、`@repo/payment`、`@repo/credits`、`@repo/mail`、`@repo/newsletter`、`@repo/notification`、`@repo/storage`、`@repo/db`、next-intl、Next runtime、React
- `@repo/analytics` 只依赖 `@repo/config`
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
- AI provider key 和 embedding key 必须走 server env，不允许进入 client

## Agent skills

### Issue tracker

Issues and PRDs are tracked in GitHub Issues for `hexuntao/aelokit`. See `docs/agents/issue-tracker.md`.

### Triage labels

Use the default five-label triage vocabulary: `needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`. See `docs/agents/triage-labels.md`.

### Domain docs

Single-context layout: root `CONTEXT.md` and `docs/adr/` when present, with `docs/product/` as product source of truth and `docs/architecture/` as architecture source of truth. See `docs/agents/domain.md`.
