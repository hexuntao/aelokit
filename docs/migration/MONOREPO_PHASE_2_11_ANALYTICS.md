# Phase 2.11：抽取 packages/analytics

## 概述

本阶段创建了 `@repo/analytics` 包，将统计分析领域逻辑抽取为共享包。

## 创建的包

### packages/analytics

统计分析领域包，提供：

- **types.ts**：Analytics 类型定义
  - `AnalyticsProviderName`：支持的 analytics provider 名称
  - `AnalyticsEventName`：事件名称类型
  - `AnalyticsProperties`：事件属性类型
  - `AnalyticsUser`：用户身份类型
  - `TrackEventParams`：track 事件参数
  - `IdentifyUserParams`：identify 用户参数
  - `PageViewParams`：page view 参数
  - `CaptureEventParams`：server-side capture 参数
  - `AnalyticsProvider`：provider interface

- **events.ts**：事件名称常量
  - `AUTH_EVENTS`：认证相关事件
  - `PAYMENT_EVENTS`：支付相关事件
  - `CREDITS_EVENTS`：积分相关事件
  - `NEWSLETTER_EVENTS`：订阅通讯相关事件
  - `STORAGE_EVENTS`：存储相关事件

- **config.ts**：配置读取 helpers
  - `isPostHogEnabled()` / `getPostHogConfig()`
  - `isOpenPanelEnabled()` / `getOpenPanelConfig()`
  - `isGoogleAnalyticsEnabled()` / `getGoogleAnalyticsConfig()`
  - `isPlausibleEnabled()` / `getPlausibleConfig()`
  - `isUmamiEnabled()` / `getUmamiConfig()`
  - `isClarityEnabled()` / `getClarityConfig()`
  - `isAhrefsEnabled()` / `getAhrefsConfig()`
  - `isSelineEnabled()` / `getSelineConfig()`
  - `isDataFastEnabled()` / `getDataFastConfig()`
  - `isVercelAnalyticsEnabled()` / `isSpeedInsightsEnabled()`
  - `getAnalyticsStatus()`：获取所有 provider 状态

- **client.ts**：browser-safe helpers
  - `trackEvent()`：track 事件
  - `trackPageView()`：track page view
  - `identifyUser()`：identify 用户
  - `resetAnalyticsUser()`：reset 用户
  - `setAnalyticsProperties()`：设置属性

- **server.ts**：server-safe helpers
  - `captureServerEvent()`：server-side capture
  - `identifyServerUser()`：server-side identify
  - `captureServerEventBatch()`：批量 capture
  - `setServerAnalyticsProperties()`：server-side 设置属性
  - `flushAnalytics()`：flush pending events
  - `isServerAnalyticsEnabled()`：检查 server analytics 是否启用

- **provider.ts**：provider interface
  - `AnalyticsProvider` interface

- **registry.ts**：provider registry
  - `getEnabledAnalyticsProviders()`：获取启用的 providers
  - `hasEnabledAnalyticsProvider()`：检查是否有启用的 provider
  - `getPrimaryAnalyticsProvider()`：获取主要 provider
  - `registerAnalyticsProvider()`：注册 provider
  - `getAnalyticsProvider()`：获取 provider
  - `getAnalyticsProviders()`：获取所有 providers

- **helpers.ts**：工具函数
  - `createScopedEventName()`：创建 scoped event name
  - `mergeProperties()`：合并属性
  - `withTimestamp()`：添加时间戳
  - `withContext()`：添加上下文
  - `sanitizeProperties()`：清理属性
  - `shouldEnableAnalytics()`：检查是否启用 analytics
  - `createSafeTracker()`：创建安全的 tracker

## apps/web shim

创建了以下 shim 文件，re-export 自 `@repo/analytics`：

- `apps/web/src/analytics/index.ts`
- `apps/web/src/analytics/types.ts`
- `apps/web/src/analytics/client.ts`
- `apps/web/src/analytics/server.ts`
- `apps/web/src/analytics/events.ts`

## 保留在 apps/web 的内容

以下 React 组件和 Script 注入组件仍保留在 `apps/web/src/analytics/`：

- `analytics.tsx`：Analytics 组件集合
- `posthog-analytics.tsx`：PostHog React Provider
- `open-panel-analytics.tsx`：OpenPanel 组件
- `google-analytics.tsx`：Google Analytics 组件
- `plausible-analytics.tsx`：Plausible Script
- `umami-analytics.tsx`：Umami Script
- `clarity-analytics.tsx`：Clarity Script
- `ahrefs-analytics.tsx`：Ahrefs Script
- `seline-analytics.tsx`：Seline Script
- `data-fast-analytics.tsx`：DataFast Script

原因：
- 这些组件使用 React、`'use client'`、`next/script` 等 Next.js runtime 特性
- React Provider 组件属于 app UI/runtime 层
- Script 注入属于 Next app runtime 层

## 依赖关系

### @repo/analytics 允许依赖

- `@repo/config`：读取 websiteConfig.analytics

### @repo/analytics 不允许依赖

- `@repo/auth`、`@repo/db`、`@repo/payment`、`@repo/credits`
- `@repo/mail`、`@repo/newsletter`、`@repo/notification`、`@repo/storage`
- `next`、`next-intl`、`react`
- `better-auth`、`stripe`、`drizzle-orm`、`resend`

### 其他包不允许依赖 @repo/analytics

- `@repo/payment`、`@repo/credits`、`@repo/mail`、`@repo/newsletter`、`@repo/notification`、`@repo/storage`
- analytics 事件上报应在 apps/web 的 composition layer 进行

## client/server 边界

### client.ts

- 只能使用 browser-safe API
- 只能读取 `NEXT_PUBLIC_*` 环境变量
- 不能 import `server.ts`
- 不能 import Node-only SDK
- 不能 import `next/headers`、`next/server`

### server.ts

- 可以读取 server 环境变量
- 可以使用 Node analytics SDK
- 不依赖 React
- 不依赖 Next route handler
- 所有参数通过函数参数传入

## 配置更新

### apps/web/next.config.ts

添加 `@repo/analytics` 到 `transpilePackages`。

### apps/web/package.json

添加 `"@repo/analytics": "workspace:*"` 到 dependencies。

## 验收命令

```bash
pnpm install

pnpm --filter @repo/analytics typecheck
pnpm --filter @repo/analytics lint
pnpm --filter @repo/analytics format

pnpm check:db-shims

pnpm typecheck
pnpm lint
pnpm format

pnpm --filter @repo/web build
pnpm build
```

## 边界检查

```bash
# 检查 @repo/analytics 不依赖禁止的包
grep -R "@repo/auth" packages/analytics || true
grep -R "@repo/db" packages/analytics || true
grep -R "@repo/payment" packages/analytics || true
grep -R "@repo/credits" packages/analytics || true
grep -R "@repo/mail" packages/analytics || true
grep -R "@repo/newsletter" packages/analytics || true
grep -R "@repo/notification" packages/analytics || true
grep -R "@repo/storage" packages/analytics || true

# 检查其他包不依赖 @repo/analytics
grep -R "@repo/analytics" packages/auth packages/db packages.payment packages/credits packages/mail packages/newsletter packages/notification packages/storage || true

# 检查 client.ts 不读取 server-only env
grep -R "process.env" packages/analytics/src/client.ts || true
```

## 成功标准

- ✅ `@repo/analytics` 已创建
- ✅ `@repo/analytics` 有自己的 `lint/format/typecheck` scripts
- ✅ `@repo/analytics` 自己能 typecheck、lint、format
- ✅ `apps/web build` 通过
- ✅ `pnpm build` 通过
- ✅ `check:db-shims` 通过
- ✅ React analytics Provider 仍在 apps/web
- ✅ Next Script 注入仍在 apps/web
- ✅ `packages/analytics` 不依赖禁止的包
- ✅ 其他 packages 不依赖 analytics
- ✅ client.ts 不读取 server-only env
- ✅ README.md、AGENTS.md、CLAUDE.md 已同步更新
