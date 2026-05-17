# Env Phase 2: Create Simple @repo/env Package

## 概述

本阶段创建了最小可用的 `@repo/env` 包，用于统一管理环境变量验证。第一版采用简单结构，不做复杂 provider 分层。

## 为什么第一版使用简单结构

1. **渐进式迁移**：先建立基础架构，验证可行性后再扩展
2. **降低风险**：避免过度设计导致维护负担
3. **真实需求驱动**：等实际使用场景明确后再拆分

## 为什么不创建 `core/*`

1. **YAGNI 原则**：当前没有真实需求需要 `core/*` 抽象层
2. **避免过度工程**：简单结构足以满足当前需求
3. **降低认知负担**：开发者可以快速理解包结构

## server/client env 如何分离

### Server Env (`server.ts`)

包含所有 server-only 环境变量：

- **数据库**：`DATABASE_URL`、`BETTER_AUTH_SECRET`
- **OAuth**：`GITHUB_CLIENT_ID`、`GITHUB_CLIENT_SECRET`、`GOOGLE_CLIENT_ID`、`GOOGLE_CLIENT_SECRET`
- **邮件**：`RESEND_API_KEY`
- **订阅通讯**：`BEEHIIV_API_KEY`、`BEEHIIV_PUBLICATION_ID`
- **存储**：`STORAGE_REGION`、`STORAGE_BUCKET_NAME`、`STORAGE_ACCESS_KEY_ID`、`STORAGE_SECRET_ACCESS_KEY`、`STORAGE_ENDPOINT`、`STORAGE_PUBLIC_URL`
- **支付**：`STRIPE_SECRET_KEY`、`STRIPE_WEBHOOK_SECRET`、`CREEM_API_KEY`、`CREEM_TEST_MODE`
- **通知**：`DISCORD_WEBHOOK_URL`、`FEISHU_WEBHOOK_URL`
- **验证码**：`TURNSTILE_SECRET_KEY`
- **Cron**：`CRON_JOBS_USERNAME`、`CRON_JOBS_PASSWORD`
- **AI**：`AI_GATEWAY_API_KEY`、`FAL_API_KEY`、`FIREWORKS_API_KEY`、`OPENAI_API_KEY`、`REPLICATE_API_TOKEN`、`GOOGLE_GENERATIVE_AI_API_KEY`、`DEEPSEEK_API_KEY`、`OPENROUTER_API_KEY`
- **工具**：`FIRECRAWL_API_KEY`、`DISABLE_IMAGE_OPTIMIZATION`

使用 `experimental__runtimeEnv: process.env` 自动读取所有 server 变量。

### Client Env (`client.ts`)

只包含 `NEXT_PUBLIC_*` 变量：

- **基础**：`NEXT_PUBLIC_BASE_URL`、`NEXT_PUBLIC_PAYMENT_PROVIDER`
- **Stripe 价格**：`NEXT_PUBLIC_STRIPE_PRICE_*`
- **Creem 产品**：`NEXT_PUBLIC_CREEM_PRODUCT_*`
- **功能开关**：`NEXT_PUBLIC_DEMO_WEBSITE`、`NEXT_PUBLIC_ENABLE_CREDITS`
- **分析**：`NEXT_PUBLIC_GOOGLE_ANALYTICS_ID`、`NEXT_PUBLIC_UMAMI_*`、`NEXT_PUBLIC_OPENPANEL_CLIENT_ID`、`NEXT_PUBLIC_PLAUSIBLE_*`、`NEXT_PUBLIC_AHREFS_WEBSITE_ID`、`NEXT_PUBLIC_SELINE_TOKEN`、`NEXT_PUBLIC_DATAFAST_*`、`NEXT_PUBLIC_POSTHOG_*`、`NEXT_PUBLIC_CLARITY_PROJECT_ID`
- **联盟**：`NEXT_PUBLIC_AFFILIATE_AFFONSO_ID`、`NEXT_PUBLIC_AFFILIATE_PROMOTEKIT_ID`
- **验证码**：`NEXT_PUBLIC_TURNSTILE_SITE_KEY`
- **客服**：`NEXT_PUBLIC_CRISP_WEBSITE_ID`

使用显式 `runtimeEnv` 对象，确保每个 `NEXT_PUBLIC_*` 变量都被明确列出。

## `env.example` 是唯一完整 env 参考

- 根目录 `env.example` 包含所有环境变量的完整文档
- 不创建 `.env.example`
- 不拆分 env.example 到各个 package
- 所有环境变量在一个地方维护，便于查找和更新

## 为什么不使用 `.env.example`

1. **历史原因**：项目一直使用 `env.example`
2. **避免混淆**：两种命名方式并存会导致开发者困惑
3. **工具兼容**：某些工具默认查找 `env.example`

## 当前尚未迁移业务代码

本阶段只创建 `@repo/env` 包，不修改业务代码：

- 未修改 `apps/web/next.config.ts`
- 未修改 `packages/db`
- 未修改 `packages/auth`
- 未修改 `packages/payment`
- 未修改 `packages/storage`
- 未修改 `packages/mail`
- 未修改 `packages/newsletter`
- 未修改 `packages/analytics`
- 未替换业务代码中的 `process.env`

## 下一阶段如何接入 apps/web build-time validation

### Phase 3 计划

1. **创建 shim**：在 `apps/web/src/env/` 创建 re-export shim
2. **替换 process.env**：逐步将 `process.env.XXX` 替换为 `serverEnv.XXX` 或 `clientEnv.XXX`
3. **build-time 验证**：在 `next.config.ts` 中导入 env，确保构建时验证
4. **类型安全**：享受 TypeScript 类型推断

### 接入步骤

```ts
// apps/web/src/env/index.ts
export { serverEnv } from '@repo/env/server';
export { clientEnv } from '@repo/env/client';
```

```ts
// apps/web/next.config.ts
import { serverEnv } from './src/env';

const nextConfig = {
  // 使用 serverEnv 替代 process.env
};
```

### 注意事项

- client 代码只能 import `@repo/env/client`
- server 代码可以 import `@repo/env/server`
- 不要在 client 代码中 import server env

## 目录结构

```
packages/env/
  package.json
  tsconfig.json
  src/
    index.ts      # 统一导出
    server.ts     # server-only env
    client.ts     # client-public env
    shared.ts     # server/client 共享 env（当前为空）
    utils.ts      # zod helper
```

## 依赖

- `@t3-oss/env-nextjs`: T3 Env Next.js 集成
- `@t3-oss/env-core`: T3 Env 核心
- `zod`: Schema 验证（使用项目已有版本）

## SKIP_ENV_VALIDATION

支持 `SKIP_ENV_VALIDATION=true` 用于：

- CI/CD 环境没有真实密钥
- Docker 构建阶段
- 类型检查阶段

**警告**：不要在生产环境使用 `SKIP_ENV_VALIDATION=true`。
