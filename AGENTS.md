# 仓库规范

本文件是 AeloKit 全仓 AI coding agent 的永久工程规则入口。子目录可以用自己的
`AGENTS.md` 进一步收紧规则，但不得放宽这里的安全、scope、package、DB、env
和 secret 边界。

最后更新：2026-05-22

## 1. 文档入口与产品依据

- AeloKit 的产品北极星是 `docs/product/AELOKIT_AI_SAAS_PLATFORM_PRD.md`。
- 当前任务 scope 由用户当前 prompt 明确指定。
- 如果用户 prompt 与 PRD 冲突，先报告冲突，不要猜测执行。
- 历史 roadmap、旧版本文档、旧 task list、旧 validation report 不能作为当前需求依据。
- 本仓库不再依赖已删除的旧文档索引作为文档入口。
- 本文件定义工程边界，不定义某个历史版本或未来版本的产品 scope。

## 2. 当前文档保留策略

- 长期保留：`AGENTS.md`、`CLAUDE.md`、`README.md`、`docs/product/AELOKIT_AI_SAAS_PLATFORM_PRD.md`。
- 不要重新创建旧 docs 体系。
- 新增文档必须有明确用户要求。
- 临时开发计划优先写在 Codex 任务输出中，不默认落地成长期文档。

## 3. AGENTS.md 优先级

- 根目录 `AGENTS.md` 定义全仓通用永久规则。
- 子目录 `AGENTS.md` 定义该目录下更具体的规则。
- 当规则冲突时，以离目标文件最近的 `AGENTS.md` 为准。
- 子目录规则不得违反根目录的安全、scope、package、DB、env 和 secret 边界。
- 修改文件前，必须先读取目标路径上所有相关 `AGENTS.md`。
- 如果用户 prompt、PRD 和工程规则之间存在冲突，报告冲突并等待确认，不要猜。

## 4. Monorepo 当前结构

本项目使用 pnpm workspace + Turborepo 管理。

- `apps/web/`: 当前完整 SaaS 单体应用。
- `apps/`: 应用层目录；当前只有 `apps/web` 是实际应用。
- `packages/ai/`: AI contracts/types/adapters/runtime-types 包（`@repo/ai`）。
- `packages/analytics/`: 统计分析领域包（`@repo/analytics`）。
- `packages/auth/`: 认证核心层（`@repo/auth`）。
- `packages/config/`: 核心 SaaS 静态配置和配置类型（`@repo/config`）。
- `packages/credits/`: 积分领域包（`@repo/credits`）。
- `packages/db/`: Drizzle 数据库层（`@repo/db`）。
- `packages/env/`: 环境变量验证（`@repo/env`）。
- `packages/i18n/`: 国际化路由和消息工具（`@repo/i18n`）。
- `packages/mail/`: 事务邮件领域包（`@repo/mail`）。
- `packages/newsletter/`: 邮件订阅领域包（`@repo/newsletter`）。
- `packages/notification/`: 系统通知领域包（`@repo/notification`）。
- `packages/payment/`: 支付领域包（`@repo/payment`）。
- `packages/shared/`: 纯工具函数、常量、类型和少量通用 hook/context（`@repo/shared`）。
- `packages/storage/`: 对象存储领域包（`@repo/storage`）。
- 根目录: workspace 编排、turbo、CI、工程文档、AI coding rules；不要放业务源码。

## 5. 常用命令

```bash
pnpm install
pnpm dev
pnpm build
pnpm lint
pnpm format
pnpm typecheck

pnpm --filter @repo/web dev
pnpm --filter @repo/web build
pnpm --filter @repo/web content
pnpm --filter @repo/web typecheck
pnpm --filter @repo/web lint
pnpm --filter @repo/web format

pnpm --filter @repo/db db:generate
pnpm --filter @repo/db db:migrate
pnpm --filter @repo/db db:push
pnpm --filter @repo/db db:studio
pnpm --filter @repo/db db:enable-pgvector
pnpm --filter @repo/db typecheck

pnpm check:db-shims
pnpm check:package-exports
pnpm check:env
```

## 6. App 与 Package Ownership

- 路由、页面组合、HTTP boundary、server actions、部署入口和 app-specific wiring 位于 `apps/*`。
- 当前完整 SaaS 单体应用在 `apps/web`。
- 可复用领域逻辑、contracts、provider interface、schema exports 和 shared services 应放在对应 `packages/*`。
- package 不允许 import app。
- app 之间不得互相 import。
- 每个 workspace 必须声明自己直接 import 的依赖，包括 `@repo/*` 内部包。
- package 必须使用明确 exports；不允许 deep import 内部实现。
- 新增 import 必须同步更新所属 workspace 的 `package.json`。
- root `package.json` 只放 monorepo 编排、workspace-wide tooling 和 root scripts 直接使用的 CLI。

## 7. 阶段性架构约束

- 当前不要提前拆 `apps/admin`, `apps/landing`, `apps/docs`, `apps/worker`, `apps/gateway`, `apps/studio`。
- 当前不要提前创建 `packages/design-system`, `packages/ui`, `packages/api-client`, `packages/logger`, `packages/observability`, `packages/testing`, `packages/worker`, `packages/gateway`。
- 不要创建 `common`, `misc`, `core` 这类无边界杂物包。
- 未来 app/package 必须有明确用户确认的 scope、ownership、dependency plan、exports/deployment plan 和 validation commands。
- 不要为了占位创建未来目录。
- 后续开发应由当前 PRD + 用户任务确认，不再由旧 roadmap 自动决定。

## 8. AI Infrastructure Guardrail

- AeloKit 的产品北极星是 `docs/product/AELOKIT_AI_SAAS_PLATFORM_PRD.md`。
- `packages/ai` 的职责是 AI contracts、provider/model/agent/tool/skill/memory/knowledge/MCP/usage/permission/types、lightweight AI SDK/Mastra adapter-compatible types 和 runtime type definitions。
- `packages/ai` 不负责 React UI、assistant-ui components、Next route handlers、cookies、server actions、app session、DB schema、DB query、credits ledger mutation、provider SDK initialization 或 live runtime execution。
- `apps/web/src/ai` 负责 web app runtime wiring：provider 初始化、session/context 注入、model/agent/tool selection、Mastra/AI SDK runtime 连接、审计和 app policy。
- `apps/web/src/components/ai` 负责 app-local AI UI。
- `apps/web/src/app/api/ai/chat/route.ts` 是当前 AI chat stream route，对外为 `POST /api/ai/chat`。
- 不要创建 `/api/chat` 作为 AI chat route。
- Usage audit 不等于 credits charging；AI usage 不得直接调用 credits ledger。
- Credits preflight/reservation/settlement 必须通过 `@repo/credits`，且只能在当前任务明确打开后实现。
- 不默认启用真实 third-party MCP、local stdio MCP、Assistant Cloud、worker/gateway/studio split 或 destructive migration。

## 9. DB 与 Shim 边界

- Drizzle schema 和真实 migration 所有权在 `packages/db/src`。
- `packages/db/src/schema.ts` 是 Drizzle schema aggregation entrypoint。
- `apps/web/src/db/*` 是兼容 shim；source shim 文件应只做 `@repo/db` re-export。
- 不要新增或生成真实 schema/migration 到 `apps/web/src/db/*`。
- 任何 schema generate 命令不得写入 `apps/web/src/db/*`。
- `auth:schema:generate` 输出到 `packages/db/src/auth.schema.reference.ts`，它是参考文件，不覆盖手写 schema。
- `db:generate` 读取 `packages/db/src/schema.ts`。
- 运行 migration、db push、db reset、db:enable-pgvector 或任何会修改 DB 状态的命令前，必须有用户明确确认。
- 使用 `pnpm check:db-shims` 验证 DB shim 边界。
- 使用 `pnpm check:package-exports` 验证 package exports 边界。

## 10. Domain Shim 边界

- `apps/web/src/payment/*` 是兼容 shim 和 app wiring；真实支付领域逻辑在 `packages/payment/src/*`。
- `apps/web/src/credits/*` 是兼容 shim 和 app-local client helper；真实积分领域逻辑在 `packages/credits/src/*`。
- `apps/web/src/mail/*` 是 app wiring；真实邮件领域逻辑在 `packages/mail/src/*`。
- `apps/web/src/newsletter/*` 是兼容 shim；真实订阅通讯领域逻辑在 `packages/newsletter/src/*`。
- `apps/web/src/notification/*` 是兼容 shim 和 app wiring；真实系统通知领域逻辑在 `packages/notification/src/*`。
- `apps/web/src/storage/*` 是兼容 shim 和 app-local browser upload helper；真实对象存储领域逻辑在 `packages/storage/src/*`。
- `apps/web/src/analytics/*` 包含兼容 shim、React Provider 和 Script injection；真实 analytics contracts/helper 在 `packages/analytics/src/*`。
- package 不得吸收 app route、server action、auth session、cookies、headers、React provider 注入或 app-specific callback。
- `@repo/payment` 与 `@repo/credits` 不允许互相依赖。
- `@repo/mail` 与 `@repo/newsletter` 不允许互相依赖。

## 11. Env 与 Secret 边界

- `packages/env/` 是环境变量验证包（`@repo/env`）。
- `@repo/env` 不依赖任何 `@repo/*` 包。
- client env 只能声明 `NEXT_PUBLIC_*` 变量，不能读取 server secret。
- server env 可以声明 server-only 变量。
- 根目录 `env.example` 是唯一完整 env 参考文件。
- 不使用、不要创建 `.env.example`。
- AI Agent 不得私自修改 `.env` 或真实 secret。
- 新增环境变量必须同步更新 schema + `env.example`，并运行 `pnpm check:env`。
- 新代码不要绕过 env schema 直接读取业务 env；使用 `@repo/env/server` 或 `@repo/env/client`。
- 允许保留的直接 `process.env`：`NODE_ENV`, `SKIP_ENV_VALIDATION`, 平台变量。
- Provider secret、embedding secret、payment secret、storage secret 只能 server-side 使用，不允许进入 client component、client hook、browser payload 或 `NEXT_PUBLIC_*`。
- 轮换或暴露凭证/API key 必须由用户明确授权。

## 12. UI 与 Design System 边界

- 当前没有 `packages/ui`，也没有 `packages/design-system`。
- 当前 UI 组件位于 `apps/web/src/components/`。
- `apps/web/src/components/ui` 是 shadcn/ui 原语。
- `magicui/`, `animate-ui/`, `tailark/`, `diceui/` 是 app 内第三方组件来源或改造件。
- `blocks/`, `auth/`, `admin/`, `settings/`, `pricing/`, `dashboard/`, `docs/` 是业务或 app-bound 组件，不提前抽入未来 design-system。
- 未来目标是 `packages/design-system`，不是狭义 `packages/ui`。
- 组件未来要沉淀到 design-system，必须先消除 app route/action/auth/payment/credits 依赖，并有组件依赖审计和用户确认。

## 13. 代码风格与命名

- Biome (`biome.json`) 强制两空格缩进、单引号、ES5 尾随逗号和必需分号。
- 模块文件名使用短横线命名法，例如 `dashboard-sidebar.tsx`。
- Hook 使用 `use-` 前缀，例如 `use-session.ts`。
- 工具函数默认使用命名导出。
- Tailwind 工具类扩展放在 `apps/web/src/styles`。
- server-only 代码必须避免被 client component 或 client hook import。

## 14. 测试与验证

- 只运行与本次改动相关的检查，除非用户明确要求全量测试。
- 文档或轻量规则改动至少做文件范围检查、forbidden path 检查和 `git diff --stat`。
- package export/shim/env 相关改动补充运行 `pnpm check:package-exports` 和 `pnpm check:env`。
- UI/route/runtime 改动优先运行目标 workspace 的 typecheck/lint。
- schema、migration、真实 DB 命令必须独立任务确认。
- Runtime smoke 不能只用代码审查替代；无法执行时必须标记 blocked/PARTIAL，不能标记 PASS。

## 15. 提交与 PR 规范

- 提交信息格式：`<类型>(<范围>): <简短描述>`。
- 类型：`feat`, `fix`, `refactor`, `test`, `chore`, `docs`。
- 每次提交只包含一个逻辑改动。
- 不在同一次提交中混入格式改动和逻辑改动。
- PR 描述必须包含：改了什么、为什么改、如何测试。
- 当环境变量变更时必须更新 `env.example` 并说明验证命令。

## 16. 禁止事项

- 不要创建根 `src/`。
- 不要把业务文件放回根目录。
- 不要让 package import `apps/web` 或 `@/` alias。
- 不要提前拆 future apps 或 future packages。
- 不要把 `packages/ai` 用作 runtime、route、UI、DB query、schema、migration 或 provider SDK initialization 层。
- 不要绕过 env schema 直接读取业务 env。
- 不要在 `apps/web/src/db` 写真实 schema。
- 不要让 schema generate 写入 `apps/web/src/db`。
- 不要把业务组件提前抽到未来 design-system。
- 不要把 i18n/auth/payment/credits/server action 依赖组件放入未来 design-system。
- 不要创建 `.env.example`。
- 不要创建 `/api/chat` 作为 AI chat route。
- 不要让 provider secret 进入 client。
- 不要让 usage audit 调用 credits ledger。
- 不要默认接入真实 third-party MCP。
- 不要默认执行 destructive migration。
- 不要删除现有 SaaS 功能。
- 不要私自替换技术栈。
