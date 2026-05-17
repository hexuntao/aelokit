# Env Phase 4: Migrate process.env to @repo/env

## 1. 迁移范围

本阶段将代码中的 `process.env` 使用替换为 `@repo/env/server` 或 `@repo/env/client`，但不改变业务行为。

## 2. 迁移文件列表

### 2.1 迁移到 @repo/env/server

| 文件 | 原变量 | 迁移后 |
|------|--------|--------|
| `packages/auth/src/server.ts` | `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` | `serverEnv.*` |
| `packages/payment/src/providers/stripe.ts` | `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` | `serverEnv.*` |
| `packages/payment/src/providers/creem.ts` | `CREEM_API_KEY`, `CREEM_TEST_MODE` | `serverEnv.*` |
| `packages/mail/src/resend.ts` | `RESEND_API_KEY` | `serverEnv.*` |
| `packages/newsletter/src/providers/resend.ts` | `RESEND_API_KEY` | `serverEnv.*` |
| `packages/newsletter/src/providers/beehiiv.ts` | `BEEHIIV_API_KEY`, `BEEHIIV_PUBLICATION_ID` | `serverEnv.*` |
| `packages/storage/src/config/storage-config.ts` | `STORAGE_*` | `serverEnv.*` |
| `packages/notification/src/registry.ts` | `DISCORD_WEBHOOK_URL`, `FEISHU_WEBHOOK_URL` | `serverEnv.*` |
| `packages/db/src/index.ts` | `DATABASE_URL` | `serverEnv.*` |
| `apps/web/src/lib/captcha.ts` | `TURNSTILE_SECRET_KEY` | `serverEnv.*` |
| `apps/web/src/app/api/distribute-credits/route.ts` | `CRON_JOBS_USERNAME`, `CRON_JOBS_PASSWORD` | `serverEnv.*` |

### 2.2 迁移到 @repo/env/client

| 文件 | 原变量 | 迁移后 |
|------|--------|--------|
| `packages/config/src/website.ts` | `NEXT_PUBLIC_*` | `clientEnv.*` |
| `packages/i18n/src/urls.ts` | `NEXT_PUBLIC_BASE_URL` | `clientEnv.*` |
| `packages/auth/src/utils.ts` | `NEXT_PUBLIC_BASE_URL` | `clientEnv.*` |
| `packages/analytics/src/config.ts` | `NEXT_PUBLIC_*` | `clientEnv.*` |
| `apps/web/src/analytics/*.tsx` | `NEXT_PUBLIC_*` | `clientEnv.*` |
| `apps/web/src/lib/demo.ts` | `NEXT_PUBLIC_DEMO_WEBSITE` | `clientEnv.*` |
| `apps/web/src/components/shared/captcha.tsx` | `NEXT_PUBLIC_TURNSTILE_SITE_KEY` | `clientEnv.*` |
| `apps/web/src/components/chatbox/crisp-chat.tsx` | `NEXT_PUBLIC_CRISP_WEBSITE_ID` | `clientEnv.*` |
| `apps/web/src/components/auth/register-form.tsx` | `NEXT_PUBLIC_TURNSTILE_SITE_KEY` | `clientEnv.*` |
| `apps/web/src/components/auth/login-form.tsx` | `NEXT_PUBLIC_TURNSTILE_SITE_KEY` | `clientEnv.*` |
| `apps/web/src/components/affiliate/promotekit.tsx` | `NEXT_PUBLIC_AFFILIATE_PROMOTEKIT_ID` | `clientEnv.*` |
| `apps/web/src/components/affiliate/affonso.tsx` | `NEXT_PUBLIC_AFFILIATE_AFFONSO_ID` | `clientEnv.*` |

## 3. 保留的 process.env

以下 `process.env` 使用保留，原因如下：

### 3.1 框架环境变量

- `process.env.NODE_ENV` - Next.js 框架变量，允许保留

### 3.2 @repo/env 内部

- `packages/env/src/client.ts` - 读取原始环境变量用于验证
- `packages/env/src/server.ts` - 读取原始环境变量用于验证
- `process.env.SKIP_ENV_VALIDATION` - 仅在 @repo/env 内部使用

### 3.3 平台配置

- `process.env.DOCKER_BUILD` - Docker 构建判断
- `process.env.DISABLE_IMAGE_OPTIMIZATION` - 图片优化配置

### 3.4 CLI/脚本配置

- `packages/db/drizzle.config.ts` - Drizzle CLI 配置
- `apps/web/drizzle.config.ts` - Drizzle CLI 配置
- `apps/web/scripts/*` - 运维脚本

### 3.5 未在 env.example 中的变量

- `process.env.POSTHOG_API_KEY` - PostHog 服务端 API key，不在 env.example 中
- `process.env.NEXT_PUBLIC_ENABLE_ANALYTICS_IN_DEV` - 开发调试变量，不在 env.example 中

## 4. 添加 @repo/env 依赖的 packages

以下 package 添加了 `@repo/env` 依赖：

- `@repo/config`
- `@repo/db`
- `@repo/auth`
- `@repo/i18n`
- `@repo/payment`
- `@repo/mail`
- `@repo/newsletter`
- `@repo/storage`
- `@repo/notification`
- `@repo/analytics`

## 5. 动态 env 访问

无动态 env 访问发现。

## 6. Client/Server 泄漏检查

✅ 通过检查：

- `@repo/env/server` 仅在 server-only 代码中使用
- `@repo/env/client` 在 client components 中正确使用
- 无 server secret 传给 client 的情况

## 7. env.example 修改

未修改 `env.example`。

## 8. .env.example 创建

未创建 `.env.example`。

## 9. 验收命令结果

```bash
pnpm install --no-frozen-lockfile  # ✅ 通过
pnpm typecheck                     # ✅ 通过
pnpm lint                          # ✅ 通过
SKIP_ENV_VALIDATION=true pnpm build # ✅ 通过
```

## 10. 统计

- 初始 `process.env` 命中：约 120 处
- 迁移数量：约 50 处
- 剩余 `process.env`：73 处（全部为允许保留的情况）
- 添加 `@repo/env` 依赖的 packages：10 个

## 11. 下一步

可以进入 Env Phase 5。
