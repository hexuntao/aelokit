# 仓库规范

本文件是 AeloKit 全仓的 AI 编码 Agent 基线规则。子目录可以用自己的
`AGENTS.md` 进一步收紧规则，但不得放宽这里的安全、阶段性架构和禁止事项。

最后更新：2026-05-18

## AGENTS.md 优先级

- 根目录 `AGENTS.md` 定义全仓通用规则。
- 子目录 `AGENTS.md` 定义该目录下更具体的规则。
- 当规则冲突时，以离目标文件最近的 `AGENTS.md` 为准。
- 但子目录规则不得违反根目录的安全规则、阶段性约束和禁止事项。
- Codex / AI 编码 Agent 修改文件前，必须先读取目标路径上所有相关 `AGENTS.md`。

## Monorepo 当前结构

本项目使用 pnpm workspace + Turborepo 管理。

- `apps/web/`：当前完整 SaaS 单体应用。
- `apps/`：应用层目录；当前只有 `apps/web` 是实际应用。
- `packages/config/`：跨 app/package 共享的核心 SaaS 静态配置和配置类型（`@repo/config`）。
- `packages/shared/`：跨 app/package 共享的纯工具函数、常量、类型和少量通用 hook/context（`@repo/shared`）。
- `packages/env/`：跨 app/package 共享的环境变量验证（`@repo/env`）。
- `packages/i18n/`：跨 app/package 共享的国际化路由和消息工具（`@repo/i18n`）。
- `packages/db/`：跨 app/package 共享的 Drizzle 数据库层（`@repo/db`）。
- `packages/auth/`：跨 app/package 共享的认证核心层（`@repo/auth`）。
- `packages/payment/`：跨 app/package 共享的支付领域包（`@repo/payment`）。
- `packages/credits/`：跨 app/package 共享的积分领域包（`@repo/credits`）。
- `packages/mail/`：跨 app/package 共享的事务邮件领域包（`@repo/mail`）。
- `packages/newsletter/`：跨 app/package 共享的邮件订阅领域包（`@repo/newsletter`）。
- `packages/notification/`：跨 app/package 共享的系统通知领域包（`@repo/notification`）。
- `packages/storage/`：跨 app/package 共享的对象存储领域包（`@repo/storage`）。
- `packages/analytics/`：跨 app/package 共享的统计分析领域包（`@repo/analytics`）。
- `packages/ai/`：v0.1 已创建的 AI contracts/types/adapters/runtime-types 包（`@repo/ai`）。
- `packages/`：后续拆包位置，但当前不要随意创建业务包。
- `packages/design-system` 是未来规划，不是当前已存在目录。
- 根目录：workspace 编排、turbo、CI、工程文档、AI 编码规则；不要放业务源码。

## 常用命令

```bash
# Monorepo 级命令
pnpm install
pnpm dev
pnpm build
pnpm lint
pnpm format
pnpm typecheck

# Web 应用
pnpm --filter @repo/web dev
pnpm --filter @repo/web build
pnpm --filter @repo/web content
pnpm --filter @repo/web typecheck
pnpm --filter @repo/web lint
pnpm --filter @repo/web format

# DB 包
pnpm --filter @repo/db db:generate
pnpm --filter @repo/db db:migrate
pnpm --filter @repo/db db:push
pnpm --filter @repo/db db:studio
pnpm --filter @repo/db typecheck
pnpm --filter @repo/db lint
pnpm --filter @repo/db format

# 任一 package
pnpm --filter @repo/<package-name> typecheck
pnpm --filter @repo/<package-name> lint
pnpm --filter @repo/<package-name> format

# 边界检查
pnpm check:db-shims
pnpm check:package-exports
pnpm check:env

# 快捷命令
pnpm web:dev
pnpm web:build
pnpm web:content
pnpm web:db:generate
```

## 项目结构与模块组织

- 路由和服务器操作位于 `apps/web/src/app`，本地化页面放在 `[locale]`。
- 可复用和业务 UI 组件当前都位于 `apps/web/src/components`。
- 共享逻辑、领域服务和 package-owned 能力应放在对应 `packages/*`。
- Drizzle schema 和真实迁移所有权在 `packages/db/src`。
- `apps/web/src/db` 是兼容 shim，不是真实 schema 所有权位置。
- 事务性邮件 app wiring 位于 `apps/web/src/mail`，可复用模板/组件在 `packages/mail`。
- 分析脚本注入和 React Provider 仍在 `apps/web/src/analytics`，通用 analytics contracts/helper 在 `packages/analytics`。
- 静态资源在 `apps/web/public/`，运维脚本在 `apps/web/scripts/`，营销/文档内容在 `apps/web/content/`。

## 阶段性架构约束

- 当前不要提前拆 `apps/admin`、`apps/landing`、`apps/docs`、`apps/worker`、`apps/gateway`、`apps/studio`。
- `packages/ai` 已在 v0.1 创建；不要把它升级成 runtime、route、UI、DB query 或 provider SDK 初始化层。
- 当前不要提前创建 `packages/design-system`。
- 这不是永久禁止，而是阶段性约束。
- 只有进入明确任务阶段、有 Scope Freeze、有 Architecture/Migration Plan、有用户确认后，才允许创建这些未来 app/package。
- 未来目录如果需要规则，先在根 `AGENTS.md` 或规划文档中说明；不要为了占位创建目录。

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

## Design System Guardrail

- 未来目标是 `packages/design-system`，不是狭义 `packages/ui`。
- 当前所有组件仍在 `apps/web/src/components`。
- `packages/design-system` 后期可包含 `ui/`、`blocks/`、`marketing/`、`ai/`、`dashboard/`、`forms/`、`layouts/`、`icons/`、`tokens/`、`styles/`、`hooks/`、`utils/`。
- 当前不要创建 `packages/design-system`。
- 不允许把业务数据请求、server actions、auth session、payment/credits 逻辑放入未来 design-system。
- 组件未来要沉淀到 design-system，必须先消除 app route/action/auth/payment/credits 依赖，并有组件依赖审计和用户确认。

## Shim 边界规则

### DB Shim

- `apps/web/src/db/*` 是兼容 shim；source shim 文件应只做 `@repo/db` re-export。
- 现存历史 migration 文件不改变所有权；不要新增或生成真实 schema/migration 到 `apps/web/src/db/*`。
- 真实 schema 所有权在 `packages/db/src/*`。
- 任何 schema generate 命令不得写入 `apps/web/src/db/*`。
- `auth:schema:generate` 输出到 `packages/db/src/auth.schema.reference.ts`（参考文件，不覆盖手写 schema）。
- `db:generate` 读取 `packages/db/src/schema.ts`。
- 使用 `pnpm check:db-shims` 验证 shim 边界。
- 使用 `pnpm check:package-exports` 验证 package exports 边界。

### Payment Shim

- `apps/web/src/payment/*` 是兼容 shim 和 app wiring，re-export 或委托给 `@repo/payment`。
- 真实支付领域逻辑所有权在 `packages/payment/src/*`。
- `apps/web/src/payment/index.ts` 注入 app 层回调（credits、notification、price-plan 等），然后委托给 `@repo/payment`。
- checkout actions、webhook route handlers、pricing/billing UI 仍保留在 `apps/web`。
- `@repo/payment` 不依赖 `@repo/auth`、`@repo/credits`、next-intl、React、Next runtime。

### Credits Shim

- `apps/web/src/credits/*` 是兼容 shim 和 app-local client helper，re-export 或委托给 `@repo/credits`。
- 真实积分领域逻辑所有权在 `packages/credits/src/*`。
- credit checkout actions、credits UI 仍保留在 `apps/web`。
- `@repo/credits` 不依赖 `@repo/payment`、`@repo/auth`、next-intl、React、Next runtime。
- `@repo/payment` 与 `@repo/credits` 不允许互相依赖。

### Mail Shim

- `apps/web/src/mail/*` 是 app wiring，复用并包装 `@repo/mail`。
- 真实邮件领域逻辑所有权在 `packages/mail/src/*`。
- 邮件模板、组件、渲染逻辑在 `packages/mail/src/templates` 和 `packages/mail/src/components`。
- `apps/web/src/mail/templates/*` 保留 PreviewProps 配置用于 email preview。
- Server Actions、route handlers、auth callbacks 仍保留在 `apps/web`。
- `@repo/mail` 不依赖 `@repo/auth`、`@repo/payment`、`@repo/credits`、`@repo/db`、next-intl、Next runtime。
- `@repo/mail` 使用 generic `Locale` 和 `Messages` 类型，具体类型由 app 层提供。

### Newsletter Shim

- `apps/web/src/newsletter/*` 是兼容 shim，re-export 自 `@repo/newsletter`。
- 真实邮件订阅领域逻辑所有权在 `packages/newsletter/src/*`。
- newsletter provider、subscribe/unsubscribe 服务在 `packages/newsletter`。
- Server Actions、UI、hooks 仍保留在 `apps/web`。
- `@repo/newsletter` 不依赖 `@repo/mail`、`@repo/auth`、`@repo/payment`、`@repo/credits`、`@repo/db`、next-intl、Next runtime。
- `@repo/mail` 与 `@repo/newsletter` 不允许互相依赖。

### Notification Shim

- `apps/web/src/notification/*` 是兼容 shim 和 app wiring，re-export 或委托给 `@repo/notification`。
- 真实系统通知领域逻辑所有权在 `packages/notification/src/*`。
- notification provider、sendNotification 服务在 `packages/notification`。
- Server Actions、route handlers 仍保留在 `apps/web`。
- `@repo/notification` 不依赖 `@repo/mail`、`@repo/newsletter`、`@repo/auth`、`@repo/payment`、`@repo/credits`、`@repo/db`、next-intl、Next runtime。
- `@repo/notification` 只依赖 `@repo/config` 和 `@repo/env`。
- `apps/web/src/notification/index.ts` 注入 app 层配置（botName、avatarUrl 等），然后委托给 `@repo/notification`。

### Storage Shim

- `apps/web/src/storage/*` 是兼容 shim 和 app-local browser upload helper，re-export 或委托给 `@repo/storage`。
- 真实对象存储领域逻辑所有权在 `packages/storage/src/*`。
- storage provider、uploadFile/deleteFile 服务在 `packages/storage`。
- `apps/web/src/storage/client.ts` 是浏览器专用上传函数，保留在 `apps/web`。
- Server Actions、route handlers、upload UI 仍保留在 `apps/web`。
- `@repo/storage` 不依赖 `@repo/auth`、`@repo/payment`、`@repo/credits`、`@repo/mail`、`@repo/newsletter`、`@repo/notification`、`@repo/db`、next-intl、Next runtime。
- `@repo/storage` 只依赖 `@repo/config`、`@repo/env` 和 `s3mini`。

### Analytics Shim

- `apps/web/src/analytics/*` 包含兼容 shim、React Provider 和 Script injection。
- 真实统计分析 contracts/helper 所有权在 `packages/analytics/src/*`。
- analytics types、provider interface、config helpers、event names 在 `packages/analytics`。
- React Provider 组件、Script 注入组件仍保留在 `apps/web/src/analytics/*.tsx`。
- dashboard analytics UI、admin analytics UI 仍保留在 `apps/web`。
- `@repo/analytics` 不依赖 `@repo/auth`、`@repo/payment`、`@repo/credits`、`@repo/mail`、`@repo/newsletter`、`@repo/notification`、`@repo/storage`、`@repo/db`、next-intl、Next runtime、React。
- `@repo/analytics` 只依赖 `@repo/config` 和 `@repo/env`。
- client.ts 只能使用 browser-safe 逻辑和 `NEXT_PUBLIC_*` 环境变量。
- server.ts 可以使用 server env 和 Node SDK。

## Env 边界规则

- `packages/env/` 是环境变量验证包（`@repo/env`）。
- 第一版使用简单结构：`server.ts` / `client.ts` / `shared.ts`。
- 不创建 `core/*` 子目录，不拆 `auth/payment/storage/analytics` 子模块。
- `@repo/env` 不依赖任何 `@repo/*` 包。
- client.ts 只能声明 `NEXT_PUBLIC_*` 变量，不能读取 server secret。
- server.ts 可以声明所有 server-only 变量。
- 根目录 `env.example` 是唯一完整 env 参考文件。
- 不使用 `.env.example`，不要创建 `.env.example`。
- 支持 `SKIP_ENV_VALIDATION=true` 用于 CI/build 环境。
- `@repo/env` 已接入 web build-time validation（`apps/web/next.config.ts`）。
- 不允许 client component import `@repo/env/server`。
- 修改 env schema 后必须同步 `env.example`。
- CI 可使用 `SKIP_ENV_VALIDATION=true` 跳过验证。
- CI 会执行 `pnpm check:env` 验证 schema 与 env.example 一致性。
- 新代码不要直接使用业务 env 的 `process.env`，使用 `@repo/env/server` 或 `@repo/env/client`。
- `process.env.NODE_ENV` 可以保留。
- 允许保留的 `process.env`：`NODE_ENV`、`SKIP_ENV_VALIDATION`、平台变量（如 `DOCKER_BUILD`、`DISABLE_IMAGE_OPTIMIZATION`）。
- 新增环境变量必须同步更新：schema + `env.example` + 运行 `pnpm check:env`。
- AI provider key 必须走 server env，不允许 client 泄露。

## 依赖归属规则

- 每个 workspace 必须声明自己直接 import 的依赖，包括 `@repo/*` 内部包。
- root 只放 monorepo 编排、workspace-wide tooling 和 root scripts 直接使用的 CLI。
- 不要依赖 `apps/web` 的依赖穿透。
- package 不允许 import app。
- app 之间不得互相 import。
- package 必须使用明确 exports；不允许 deep import 内部实现。
- 新增 import 必须同步更新所属 workspace 的 `package.json`。
- 不确定依赖不要删除，先标记 `needs-manual-review`。

## UI 边界规则

- 当前没有 `packages/ui`，也没有 `packages/design-system`。
- UI 组件位于 `apps/web/src/components/`。
- `ui/` 目录包含 shadcn/ui 原语。
- `magicui/`、`animate-ui/`、`tailark/`、`diceui/` 是第三方库组件，不抽入未来 design-system，除非经过审计和重包装。
- `blocks/`、`auth/`、`admin/`、`settings/`、`pricing/`、`dashboard/`、`docs/` 是业务或 app-bound 组件，不提前抽入未来 design-system。
- 未来抽取 design-system 前需完成 UI 边界审计、dependency cleanup、exports plan 和用户确认。

## 代码风格与命名规范

- Biome (`biome.json`) 强制执行两空格缩进、单引号、ES5 尾随逗号和必需的分号。
- 模块文件名使用短横线命名法（`dashboard-sidebar.tsx`）。
- Hook 使用 `use-` 前缀（`use-session.ts`）。
- 工具函数默认使用命名导出。
- Tailwind 工具类位于 `apps/web/src/styles`；在那里扩展设计令牌，而不是分散使用魔法值。
- 服务器端专用代码放在标记了 `"use server"` 的文件中，避免将这些模块引入客户端 Hook。

## 测试与验证

- 只运行与本次改动相关的检查，除非用户明确要求全量测试。
- 自动化测试尚未完整集成到所有 package 脚本中；文档或轻量改动至少做文件范围和边界检查。
- 添加测试运行器时，将测试文件与功能放在同一目录下，使用 `.test.ts(x)` 或 `.spec.ts(x)` 后缀，并在 PR 中记录相关命令。
- 数据、schema、migration 变更必须独立任务确认；本规则文档任务不得生成 migration。

## 提交与合并请求规范

- 提交信息格式：`<类型>(<范围>): <简短描述>`。
- 类型：`feat`、`fix`、`refactor`、`test`、`chore`、`docs`。
- 每次提交只包含一个逻辑改动。
- 不在同一次提交中混入格式改动和逻辑改动。
- PR 描述必须包含：改了什么 / 为什么改 / 如何测试。
- 当环境变量变更时必须更新 `env.example` 并说明验证命令。

## 配置与密钥

- 运行命令前将 `env.example` 复制为 `.env`，但 AI Agent 不得私自修改 `.env`。
- 生产环境凭证存储在部署提供商（Vercel、Cloudflare）处，切勿提交密钥。
- 为 `opennextjs-cloudflare` 或 `wrangler` 使用有作用域的 API 密钥。
- 轮换与 provider 关联的密钥必须由用户明确授权。
- 合并前移除临时调试日志。

## 禁止事项

- 不要创建根 `src/`。
- 不要把业务文件放回根目录。
- 不要让 package import `apps/web`。
- 不要提前拆未来 apps：`apps/admin`、`apps/landing`、`apps/docs`、`apps/worker`、`apps/gateway`、`apps/studio`。
- 不要提前创建未来 packages：`packages/design-system`、`packages/api-client`、`packages/logger`、`packages/observability`、`packages/testing`。
- 不要把 `packages/ai` 用作 runtime、route、UI、DB query、schema、migration 或 provider SDK 初始化层。
- 不要创建 `common`、`misc`、`core` 这类无边界杂物包。
- 不要绕过 env schema 直接读取业务 env。
- 不要在 `apps/web/src/db` 写真实 schema。
- 不要让 schema generate 写入 `apps/web/src/db`。
- 不要把业务组件提前抽到未来 design-system。
- 不要把 i18n/auth/payment/credits/server action 依赖组件放入未来 design-system。
- 不要创建 `.env.example`；根目录 `env.example` 是唯一完整 env 参考。
- 不要写业务代码、API routes、schema 或 migration，除非任务明确要求。
- 不要创建 `/api/chat` 作为 AI chat route。
- 不要让 provider secret 进入 client。
- 不要让 usage audit 调用 credits ledger。
- 不要实现 v0.3+ memory/RAG/MCP/credits charging。
- 不要删除现有 SaaS 功能。
- 不要私自替换技术栈。
