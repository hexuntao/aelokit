# Web App 规则

本文件适用于 `apps/web/**`。修改文件前必须先读取根 `AGENTS.md`、`apps/AGENTS.md`
和本文件。

## 定位

- `apps/web` 当前是完整 SaaS 单体应用。
- 当前承载 marketing、docs、auth、dashboard、billing、admin 初版、settings、AI workspace 初版。
- `apps/web` 可以做 app-specific wiring，但不拥有跨 app contracts、DB schema 所有权或 package 领域逻辑。

## Next.js App Router 规则

- 路由位于 `apps/web/src/app`。
- 本地化页面位于 `apps/web/src/app/[locale]`。
- server-only 逻辑不要 import 到 client component。
- server action 必须明确边界，不能被抽到 package 或未来 design-system。
- API route 只做 HTTP boundary、auth/session、validation、调用 service/runtime。
- 路由文件不要直接承载可复用领域模型；可复用领域模型应在对应 `packages/*`。
- 需要读取 env 时使用 `@repo/env/server` 或 `@repo/env/client`，不要在业务代码绕过 env schema。

## AI Web App 边界

当前 AI Web App 边界：

```txt
apps/web/src/ai              # app-level runtime wiring
apps/web/src/components/ai   # app-local AI UI
apps/web/src/app/api/ai      # AI API routes
```

- `apps/web/src/ai` 可以连接 `@repo/auth`、`@repo/storage`、`@repo/db`、`@repo/analytics` 和已创建的 `@repo/ai` contracts。
- `apps/web/src/ai` 负责 web app runtime wiring，包括 provider 初始化、session/context 注入、model/agent/tool selection、Mastra/AI SDK runtime 连接、usage audit 和 app policy；不应该定义跨 app contracts。
- `apps/web/src/components/ai` 负责 app-local AI UI，不应该做 provider 初始化、credits ledger mutation、DB schema。
- `apps/web/src/app/api/ai/chat/route.ts` 是当前 AI chat stream route，对外为 `POST /api/ai/chat`。
- 不要使用 `/api/chat` 作为 AI chat route。
- Usage audit 不等于 credits charging；AI runtime 不得直接改 credits ledger。
- Credits preflight/reservation/settlement 必须通过 `@repo/credits`，且只能在当前用户 prompt 明确打开 AI billing 集成时实现。
- 涉及 assistant-ui、Vercel AI SDK、Mastra 或 provider SDK 时，必须先执行 External Docs Gate，查官方最新文档，不允许凭旧 API 或记忆实现。
- 当前 AI scope 由用户当前 prompt、root `AGENTS.md` 和 PRD 共同约束；三者冲突时先报告冲突并等待确认。
- 历史 roadmap、旧版本文档、历史任务文档和已删除文档不能作为当前需求依据。
- 默认不接真实 third-party MCP，不启用 local stdio MCP，不接 Assistant Cloud，不做 credits charging，除非当前用户 prompt 和必要确认明确打开。
- 没有当前用户 prompt 和明确确认，不创建 worker/gateway/studio/design-system split。

## UI 组件边界

- 当前 UI 组件在 `apps/web/src/components`。
- shadcn/ui 原语在 `apps/web/src/components/ui`。
- `magicui/`、`animate-ui/`、`tailark/`、`diceui/` 是当前 app 内第三方组件来源或改造件。
- 业务组件留在 app，包括 auth、admin、settings、pricing、billing、dashboard、docs、payment、credits、newsletter。
- 不要提前抽 design-system。
- 如果组件未来要沉淀到 design-system，必须先消除 app route/action/auth/payment/credits 依赖，并以 props/slots 接收数据。

## 文档和内容边界

- `apps/web/content/docs` 是当前 docs 内容位置。
- 不要因为未来有 `apps/docs` 规划就提前移动 docs。
- docs app 拆分必须独立任务，包含 route map、search/indexing plan、redirect plan、i18n plan 和用户确认。

## App-local Shim 规则

- `apps/web/src/db` 只做 DB shim；不要新增或生成真实 schema/migration 到这里。
- `apps/web/src/payment` 可以注入 app 回调后委托 `@repo/payment`。
- `apps/web/src/credits` 可以保留 app-local client helpers 和对 `@repo/credits` 的委托。
- `apps/web/src/mail` 可以保留 email preview props、locale/message 注入和 app-specific provider wiring。
- `apps/web/src/analytics` 可以保留 React Provider 和 Script 注入，通用 analytics contracts/helper 在 `@repo/analytics`。
- `apps/web/src/storage/client.ts` 是浏览器上传 helper；storage provider/service 所有权在 `@repo/storage`。

## 验证命令

- 文档或 app 规则变更：检查文件范围和 forbidden path。
- UI/route/runtime 变更：优先运行 `pnpm --filter @repo/web typecheck` 和 `pnpm --filter @repo/web lint`。
- docs 内容变更：按需运行 `pnpm --filter @repo/web content`。
- schema/migration/db 命令需要用户确认后再执行。

## Common mistakes

- 把 route handler 写成业务服务层。
- 在 client component import server-only env、auth 或 DB。
- 先创建 `/api/chat`，绕开已规划的 `/api/ai/chat`。
- 在 `components/ai` 初始化 provider 或写 credits ledger。
- 因为未来要有 `apps/docs` 就移动当前 docs 内容。
