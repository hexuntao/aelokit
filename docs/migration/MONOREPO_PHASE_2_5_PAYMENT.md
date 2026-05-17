# Phase 2.5：抽取 packages/payment

## 概述

本阶段创建了 `packages/payment`，将支付领域的类型、Provider 接口、Stripe/Creem Provider 实现、Provider Registry、支付 Helper 抽成共享包。

## `@repo/payment` 负责

- 支付领域类型（PaymentScene, PaymentStatus, Customer, Subscription, Payment, CreateCheckoutParams, CreateCreditCheckoutParams, CheckoutResult, CreatePortalParams, PortalResult, getSubscriptionsParams）
- PaymentProvider interface
- StripeProvider 实现
- CreemProvider 实现
- Provider Registry（getPaymentProvider, createCheckout, createCreditCheckout, createCustomerPortal, handleWebhookEvent）
- 支付 Helper（isSubscriptionActive, isPaymentProviderName）

## `@repo/payment` 不包含

- Auth session 获取
- Server Actions
- Route handlers
- UI 组件
- Credits ledger 消费逻辑
- Mail / Newsletter / Notification
- next-intl / React / Next runtime 依赖

## 架构设计：依赖注入回调模式

由于 StripeProvider 和 CreemProvider 的 webhook 处理逻辑依赖 app 层的 credits、notification、price-plan 等模块，本阶段采用**依赖注入回调模式**：

- Provider 构造函数接受 `callbacks` 参数（StripeWebhookCallbacks / CreemWebhookCallbacks）
- callbacks 包含 app 层提供的函数：findPlanByPlanId, findPriceInPlan, findPlanByPriceId, getCreditPackageById, addCredits, addSubscriptionCredits, addLifetimeMonthlyCredits, sendPaymentNotification, paymentRecordRetryAttempts, paymentRecordRetryDelay
- `apps/web/src/payment/index.ts` 作为 shim，组装 app 层回调后委托给 `@repo/payment`

这种设计确保 `@repo/payment` 不依赖 `@repo/auth`、next-intl、React 或 Next runtime，同时保持完整的 webhook 处理能力。

## 类型关系

`@repo/payment/types.ts` 从 `@repo/config` re-export 配置相关类型（PaymentTypes, PlanIntervals, PaymentProviderName 等），避免类型分裂。`@repo/payment` 自身只定义支付领域操作类型。

## `apps/web/src/payment/*` 兼容 shim

- `types.ts`：re-export `@repo/payment/types`
- `provider/stripe.ts`：re-export StripeProvider
- `provider/creem.ts`：re-export CreemProvider
- `index.ts`：组装 app 层回调，委托给 `@repo/payment/registry`

## 仍保留在 `apps/web` 的内容

- checkout actions（create-checkout-session, create-customer-portal-session, create-credit-checkout-session）
- webhook route handlers（app/api/webhooks/stripe, app/api/webhooks/creem）
- pricing/billing UI 页面
- price-config, credits-config
- credits 模块

## 依赖方向

```
@repo/shared
@repo/config
@repo/db
@repo/auth → @repo/db + @repo/config + @repo/shared
@repo/payment → @repo/db + @repo/config + @repo/shared
apps/web → all packages
```

无循环依赖。

## 验证命令

每次修改 `packages/payment` 后必须执行：

```bash
pnpm --filter @repo/payment typecheck
pnpm --filter @repo/payment lint
pnpm --filter @repo/payment format
pnpm check:db-shims
pnpm typecheck
pnpm lint
pnpm format
pnpm build
```
