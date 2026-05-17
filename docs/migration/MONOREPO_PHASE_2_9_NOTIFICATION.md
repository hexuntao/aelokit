# Phase 2.9：抽取 packages/notification

## 概述

本阶段创建了 `packages/notification`，将系统通知领域能力抽成共享包。

## 创建的文件

### packages/notification/

```
packages/notification/
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
      discord.ts
      feishu.ts
```

### 文件说明

- `package.json`：包配置，依赖 `@repo/config`
- `tsconfig.json`：TypeScript 配置，包含 Node types
- `src/types.ts`：notification 类型定义
- `src/provider.ts`：NotificationProvider 接口导出
- `src/registry.ts`：provider registry 和 getNotificationProvider
- `src/service.ts`：sendPaymentNotification、sendCreditDistributionNotification 服务
- `src/providers/discord.ts`：Discord provider 实现
- `src/providers/feishu.ts`：Feishu provider 实现
- `src/providers/index.ts`：provider 导出
- `src/index.ts`：包主入口

## 从 apps/web/src/notification 积出的内容

- `types.ts` → `packages/notification/src/types.ts`
- `provider/discord.ts` → `packages/notification/src/providers/discord.ts`
- `provider/feishu.ts` → `packages/notification/src/providers/feishu.ts`
- `index.ts` 中的 getNotificationProvider、sendPaymentNotification、sendCreditDistributionNotification → `packages/notification/src/registry.ts` 和 `packages/notification/src/service.ts`

## 保留在 apps/web 的内容

### App 层配置注入（必须保留）

- `apps/web/src/notification/index.ts` - 注入 botName、avatarUrl 等 app 层配置

原因：Discord provider 需要 botName（来自 i18n messages）和 avatarUrl（来自 websiteConfig + getBaseUrl），这些是 app 层特有的配置。

### 无 Server Actions

当前项目没有 notification 相关的 Server Actions。

### 无 Route Handlers

notification 发送由 payment webhook 和 credits distribute route 直接调用，不涉及独立的 route handlers。

## apps/web shim 文件

为了保护现有 import，保留了兼容 shim：

- `apps/web/src/notification/index.ts` → 注入 app 层配置后 re-export `@repo/notification`
- `apps/web/src/notification/types.ts` → `export * from '@repo/notification/types'`
- `apps/web/src/notification/provider/discord.ts` → `export { DiscordProvider } from '@repo/notification/providers'`
- `apps/web/src/notification/provider/feishu.ts` → `export { FeishuProvider } from '@repo/notification/providers'`

## packages/notification/package.json

```json
{
  "name": "@repo/notification",
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
    "@repo/config": "workspace:*"
  },
  "devDependencies": {
    "@types/node": "^25.0.10",
    "typescript": "^5.9.3"
  }
}
```

## 依赖说明

- `@repo/config`：读取 notification provider 配置

## 边界规则

### @repo/notification 允许依赖

- `@repo/config`

### @repo/notification 不允许依赖

- `@repo/mail`
- `@repo/newsletter`
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
- `resend`

### 领域包边界

- `@repo/notification` 不依赖 `@repo/payment`、`@repo/credits`、`@repo/mail`、`@repo/newsletter`
- `@repo/payment` 不依赖 `@repo/notification`
- `@repo/credits` 不依赖 `@repo/notification`
- `@repo/mail` 不依赖 `@repo/notification`
- `@repo/newsletter` 不依赖 `@repo/notification`
- 支付成功后发送通知的逻辑由 app 层组合：

```typescript
// apps/web/src/payment/index.ts
const paymentCallbacks: PaymentProviderCallbacks = {
  ...
  sendPaymentNotification,
  ...
};
```

## Provider 配置参数化

Discord provider 需要 botName 和 avatarUrl，这些来自 app 层：

```typescript
// packages/notification/src/providers/discord.ts
export interface DiscordProviderConfig {
  webhookUrl: string;
  botName?: string;
  avatarUrl?: string;
}

export class DiscordProvider implements NotificationProvider {
  constructor(config: DiscordProviderConfig) {
    this.webhookUrl = config.webhookUrl;
    this.botName = config.botName ?? 'Bot';
    this.avatarUrl = config.avatarUrl;
  }
}
```

App 层注入配置：

```typescript
// apps/web/src/notification/index.ts
import { websiteConfig } from '@repo/config';
import { getBaseUrl } from '@/lib/urls';
import { defaultMessages } from '@/i18n/messages';
import { DiscordProvider, type DiscordProviderConfig } from '@repo/notification/providers';
import { initNotificationRegistry } from '@repo/notification';

initNotificationRegistry({
  discord: (config: DiscordProviderConfig) => {
    const botName = defaultMessages.Metadata.name ?? config.botName ?? 'Bot';
    const logoPath = websiteConfig.metadata?.images?.logoLight;
    const avatarUrl = logoPath ? `${getBaseUrl()}${logoPath}` : config.avatarUrl;
    return new DiscordProvider({ ...config, botName, avatarUrl });
  },
  ...
});
```

## apps/web/package.json 更新

添加了：

```json
{
  "dependencies": {
    "@repo/notification": "workspace:*"
  }
}
```

## apps/web/next.config.ts 更新

添加了 `@repo/notification` 到 transpilePackages：

```typescript
transpilePackages: [
  '@repo/config',
  '@repo/shared',
  '@repo/db',
  '@repo/auth',
  '@repo/payment',
  '@repo/credits',
  '@repo/mail',
  '@repo/newsletter',
  '@repo/notification'
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
- ✅ 无 @repo/newsletter import
- ✅ 无 stripe import
- ✅ 无 creem import
- ✅ 无 drizzle import
- ✅ 无 resend import

### 循环依赖检查

- ✅ `@repo/notification` 不依赖 `@repo/payment`
- ✅ `@repo/notification` 不依赖 `@repo/credits`
- ✅ `@repo/notification` 不依赖 `@repo/mail`
- ✅ `@repo/notification` 不依赖 `@repo/newsletter`
- ✅ `@repo/payment` 不依赖 `@repo/notification`
- ✅ `@repo/credits` 不依赖 `@repo/notification`
- ✅ `@repo/mail` 不依赖 `@repo/notification`
- ✅ `@repo/newsletter` 不依赖 `@repo/notification`

### DB Shim 边界检查

- ✅ `pnpm check:db-shims` 通过

### Package 级命令

- ✅ `pnpm --filter @repo/notification typecheck` 通过
- ✅ `pnpm --filter @repo/notification lint` 通过
- ✅ `pnpm --filter @repo/notification format` 通过

### 全局命令

- ✅ `pnpm typecheck` 通过
- ✅ `pnpm lint` 通过
- ✅ `pnpm format` 通过
- ✅ `pnpm build` 通过

### Web 验收

- ✅ `pnpm --filter @repo/web build` 通过
- ✅ `pnpm --filter @repo/web db:generate` 通过

## 注释保留

所有原始注释已保留：

- types.ts 中的类型注释
- discord.ts 中的 Discord webhook 说明
- feishu.ts 中的 Feishu webhook 说明
- registry.ts 中的 provider 选择逻辑注释
- service.ts 中的 sendPaymentNotification/sendCreditDistributionNotification 注释

## 后续维护

每次修改 `packages/notification` 后必须执行：

```bash
pnpm --filter @repo/notification typecheck
pnpm --filter @repo/notification lint
pnpm --filter @repo/notification format
pnpm check:db-shims
pnpm --filter @repo/web build
pnpm build
```

## 成功标准

- ✅ `@repo/notification` 已创建
- ✅ `@repo/notification` 有自己的 lint/format/typecheck scripts
- ✅ `@repo/notification` 自己能 typecheck
- ✅ `@repo/notification` 自己能 lint
- ✅ `@repo/notification` 自己能 format
- ✅ `apps/web build` 通过
- ✅ `pnpm build` 通过
- ✅ `pnpm typecheck/lint/format` 通过
- ✅ `check:db-shims` 通过
- ✅ 原始 notification 注释完整保留
- ✅ notification Server Actions 仍在 apps/web（无）
- ✅ business composition 仍在 apps/web
- ✅ `packages/notification` 不依赖 apps/web
- ✅ `packages/notification` 没有 `@/` import
- ✅ `packages/notification` 没有 Next runtime 依赖
- ✅ `packages/notification` 不依赖 auth/payment/credits/mail/newsletter/db
- ✅ payment/credits/mail/newsletter 不依赖 notification
- ✅ 没有循环依赖
- ✅ 没有抽 storage/analytics/ui
- ✅ 没有创建新 app
- ✅ README.md、AGENTS.md、CLAUDE.md、docs/migration 已同步更新
