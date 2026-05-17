# Phase 2.8：抽取 packages/newsletter

## 概述

本阶段创建了 `packages/newsletter`，将邮件订阅领域能力抽成共享包。

## 创建的文件

### packages/newsletter/

```
packages/newsletter/
  package.json
  tsconfig.json
  src/
    index.ts
    types.ts
    provider.ts
    service.ts
    registry.ts
    providers/
      index.ts
      beehiiv.ts
      resend.ts
```

### 文件说明

- `package.json`：包配置，依赖 `@repo/config`、`@beehiiv/sdk`、`resend`
- `tsconfig.json`：TypeScript 配置，包含 Node types
- `src/types.ts`：newsletter 类型定义
- `src/provider.ts`：NewsletterProvider 接口导出
- `src/registry.ts`：provider registry 和 getNewsletterProvider
- `src/service.ts`：subscribe、unsubscribe、isSubscribed 服务
- `src/providers/beehiiv.ts`：Beehiiv provider 实现
- `src/providers/resend.ts`：Resend provider 实现
- `src/providers/index.ts`：provider 导出
- `src/index.ts`：包主入口

## 从 apps/web/src/newsletter 移出的内容

- `types.ts` → `packages/newsletter/src/types.ts`
- `provider/beehiiv.ts` → `packages/newsletter/src/providers/beehiiv.ts`
- `provider/resend.ts` → `packages/newsletter/src/providers/resend.ts`
- `index.ts` 中的 getNewsletterProvider、subscribe、unsubscribe、isSubscribed → `packages/newsletter/src/registry.ts` 和 `packages/newsletter/src/service.ts`

## 保留在 apps/web 的内容

### Server Actions（必须保留）

- `apps/web/src/actions/subscribe-newsletter.ts` - 使用 'use server'、actionClient、getLocale、sendEmail
- `apps/web/src/actions/unsubscribe-newsletter.ts` - 使用 'use server'、userActionClient
- `apps/web/src/actions/check-newsletter-status.ts` - 使用 'use server'、userActionClient

原因：Server Actions 负责 form state、rate limit、captcha、auth/session、mail 组合，必须留在 app 层。

### UI/Components/Hooks（必须保留）

- `apps/web/src/components/newsletter/newsletter-form.tsx`
- `apps/web/src/components/newsletter/newsletter-card.tsx`
- `apps/web/src/components/settings/notification/newsletter-form-card.tsx`
- `apps/web/src/hooks/use-newsletter.ts`

原因：依赖 React、next-intl、React Query，不能进入 newsletter 包。

### 邮件模板（属于 @repo/mail）

- `apps/web/src/mail/templates/subscribe-newsletter.tsx`

原因：邮件模板属于 `@repo/mail`，不是 `@repo/newsletter`。

## apps/web shim 文件

为了保护现有 import，保留了兼容 shim：

- `apps/web/src/newsletter/index.ts` → `export * from '@repo/newsletter'`
- `apps/web/src/newsletter/types.ts` → `export * from '@repo/newsletter/types'`
- `apps/web/src/newsletter/provider/beehiiv.ts` → `export { BeehiivNewsletterProvider } from '@repo/newsletter/providers'`
- `apps/web/src/newsletter/provider/resend.ts` → `export { ResendNewsletterProvider } from '@repo/newsletter/providers'`

## packages/newsletter/package.json

```json
{
  "name": "@repo/newsletter",
  "version": "0.0.0",
  "private": true,
  "type": "module",
  "sideEffects": false,
  "exports": {
    ".": "./src/index.ts",
    "./types": "./src/types.ts",
    "./provider": "./src/provider.ts",
    "./service": "./src/service.ts",
    "./registry": "./src/registry.ts",
    "./providers": "./src/providers/index.ts"
  },
  "scripts": {
    "lint": "biome check .",
    "format": "biome format --write .",
    "typecheck": "tsc --noEmit"
  },
  "dependencies": {
    "@repo/config": "workspace:*",
    "@beehiiv/sdk": "^0.1.9",
    "resend": "^6.8.0"
  },
  "devDependencies": {
    "@types/node": "^25.0.10",
    "typescript": "^5.9.3"
  }
}
```

## 依赖说明

- `@repo/config`：读取 newsletter provider 配置
- `@beehiiv/sdk`：Beehiiv API SDK
- `resend`：Resend contacts API

## 边界规则

### @repo/newsletter 允许依赖

- `@repo/config`
- `@beehiiv/sdk`
- `resend`

### @repo/newsletter 不允许依赖

- `@repo/mail`
- `@repo/auth`
- `@repo/payment`
- `@repo/credits`
- `@repo/db`
- `next`
- `next-intl`
- `react`
- `better-auth`
- `stripe`
- `creem`
- `drizzle-orm`

### @repo/mail 与 @repo/newsletter 边界

- `@repo/mail` 不依赖 `@repo/newsletter`
- `@repo/newsletter` 不依赖 `@repo/mail`
- 订阅成功后发送欢迎邮件的逻辑由 app action 层组合：

```typescript
// apps/web/src/actions/subscribe-newsletter.ts
const subscribed = await subscribe(email);
if (subscribed) {
  await sendEmail({ to: email, template: 'subscribeNewsletter', ... });
}
```

## apps/web/package.json 更新

添加了：

```json
{
  "dependencies": {
    "@repo/newsletter": "workspace:*"
  }
}
```

## apps/web/next.config.ts 更新

添加了 `@repo/newsletter` 到 transpilePackages：

```typescript
transpilePackages: [
  '@repo/config',
  '@repo/shared',
  '@repo/db',
  '@repo/auth',
  '@repo/payment',
  '@repo/credits',
  '@repo/mail',
  '@repo/newsletter'
]
```

## 验收结果

### 污染检查

- ✅ 无 `@/` import
- ✅ 无 `apps/web` import
- ✅ 无 next-intl import
- ✅ 无 React import
- ✅ 无 Next runtime import
- ✅ 无 better-auth import
- ✅ 无 @repo/auth import
- ✅ 无 @repo/payment import
- ✅ 无 @repo/credits import
- ✅ 无 @repo/mail import
- ✅ 无 stripe import
- ✅ 无 creem import
- ✅ 无 drizzle import
- ✅ 无 notification import

### 循环依赖检查

- ✅ `@repo/newsletter` 不依赖 `@repo/mail`
- ✅ `@repo/mail` 不依赖 `@repo/newsletter`

### DB Shim 边界检查

- ✅ `pnpm check:db-shims` 通过

### Package 级命令

- ✅ `pnpm --filter @repo/newsletter typecheck` 通过
- ✅ `pnpm --filter @repo/newsletter lint` 通过
- ✅ `pnpm --filter @repo/newsletter format` 通过

### 全局命令

- ✅ `pnpm typecheck` 通过
- ✅ `pnpm lint` 通过
- ✅ `pnpm format` 通过
- ✅ `pnpm build` 通过

### Web 验收

- ✅ `pnpm --filter @repo/web build` 通过

## 注释保留

所有原始注释已保留：

- types.ts 中的类型注释
- beehiiv.ts 中的 Beehiiv 文档链接和 API 说明
- resend.ts 中的 Resend 文档链接和 API 说明
- registry.ts 中的 provider 选择逻辑注释
- service.ts 中的 subscribe/unsubscribe/isSubscribed 注释

## 后续维护

每次修改 `packages/newsletter` 后必须执行：

```bash
pnpm --filter @repo/newsletter typecheck
pnpm --filter @repo/newsletter lint
pnpm --filter @repo/newsletter format
pnpm check:db-shims
pnpm --filter @repo/web build
pnpm build
```

## 成功标准

- ✅ `@repo/newsletter` 已创建
- ✅ `@repo/newsletter` 有自己的 lint/format/typecheck scripts
- ✅ `@repo/newsletter` 自己能 typecheck
- ✅ `@repo/newsletter` 自己能 lint
- ✅ `@repo/newsletter` 自己能 format
- ✅ `apps/web build` 通过
- ✅ `pnpm build` 通过
- ✅ `pnpm typecheck/lint/format` 通过
- ✅ `check:db-shims` 通过
- ✅ 原始 newsletter 注释完整保留
- ✅ newsletter Server Actions 仍在 apps/web
- ✅ newsletter UI 仍在 apps/web
- ✅ mail templates 仍在 @repo/mail
- ✅ `packages/newsletter` 不依赖 apps/web
- ✅ `packages/newsletter` 没有 `@/` import
- ✅ `packages/newsletter` 没有 Next runtime 依赖
- ✅ `packages/newsletter` 不依赖 `@repo/mail`
- ✅ `packages/mail` 不依赖 `@repo/newsletter`
- ✅ 没有循环依赖
- ✅ 没有抽 notification/storage/analytics/ui
- ✅ 没有创建新 app
