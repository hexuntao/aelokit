# 支付系统全流程说明

## 1. 架构概览
- 支付层通过 `apps/web/src/payment/index.ts` 暴露统一的 `createCheckout`、`createCreditCheckout`、`createCustomerPortal` 与 `handleWebhookEvent` 接口，内部根据 `websiteConfig.payment.provider` 实例化 `StripeProvider` 或 `CreemProvider`。
- 所有支付网关都实现 `apps/web/src/payment/types.ts` 中的 `PaymentProvider` 接口，统一了创建结算、客户门户以及处理 webhook 的行为。
- 数据落库集中在 `payment` 表（`apps/web/src/db/schema.ts:46` 起），字段包含 `type`、`scene`、`status`、`invoice_id`、`session_id`、`subscription_id` 等，用于区分订阅 / 一次性 / 积分支付并做幂等控制（`invoice_id` 上有唯一索引）。
- 积分余额与流水由 `user_credit`、`credit_transaction` 表维护，增减逻辑封装在 `apps/web/src/credits/credits.ts`。

## 2. 订阅支付时序
1. 用户在 Pricing 页面点击订阅按钮：`CheckoutButton`（`apps/web/src/components/pricing/create-checkout-button.tsx`）调用 `createCheckoutAction`（`apps/web/src/actions/create-checkout-session.ts`）。
   - 该 action 校验 `planId`/`priceId`，拼入用户信息与本地化后的 `successUrl`（`/payment?session_id={CHECKOUT_SESSION_ID}&callback=/settings/billing`）。
   - 元信息中会写入 `userId`、`userName`，供 webhook 回填用户。
2. `createCheckoutAction` 通过 `createCheckout` 分发到具体 Provider：
   - **Creem**：`CreemProvider.createCheckout`（`apps/web/src/payment/provider/creem.ts:409`）校验计划 → 组装请求体 → 调 Creem `/v1/checkouts` API。由于 Creem 不会回传 Stripe 风格的 SessionId，占位符被替换成 `CREEM`，并额外把 `checkout_id`、`order_id` 带回到 success URL。
   - **Stripe**：`StripeProvider.createCheckout`（`apps/web/src/payment/provider/stripe.ts:120` 起）创建或复用 Customer → 构造 `stripe.checkout.sessions` 请求，注入 metadata、locale、成功/取消地址。
3. 用户完成支付后，第三方会重定向回 `/payment`，页面组件是 `PaymentCard`（`apps/web/src/components/payment/payment-card.tsx`）。
   - `PaymentCard` 读取 URL 中的 `session_id`/`checkout_id`，通过 `usePaymentCompletion`（`apps/web/src/hooks/use-payment-completion.ts`）轮询 `checkPaymentCompletionAction`（`apps/web/src/actions/check-payment-completion.ts`）。
   - 该 action 查询 `payment.session_id` 对应记录是否 `paid=true`。检测成功后页面会刷新 React Query 缓存并跳转到 `callback`（默认 `/settings/billing`）。
4. Webhook 写入订阅数据：
   - **Creem**：
     - `checkout.completed`（`apps/web/src/payment/provider/creem.ts:640` 起）首先尝试判定是否为订阅。若 payload 带 `subscription`，调用 `upsertSubscriptionRecord` 写入 / 更新 `payment`（类型 `subscription`，状态映射为 `completed` → `completed`，后续会被 `subscription.paid` 提升为 `active`）。
     - `subscription.paid`（`apps/web/src/payment/provider/creem.ts:804`）将同一 `subscription_id` 记录更新为 `status=active`、`paid=true`、回填 `period_start/period_end/interval`、`invoice_id` 等；并触发 `addSubscriptionCredits` 发放当月积分。
     - 其它事件如 `subscription.canceled`、`subscription.expired` 会同步收尾状态。
   - **Stripe**：
     - `checkout.session.completed`（`apps/web/src/payment/provider/stripe.ts:566`）负责首次插入订阅记录，写入 `subscription_id`、`status` 等基础信息。
     - `invoice.paid`（`apps/web/src/payment/provider/stripe.ts:643`）确保金额到账：查找对应 `payment` 记录，更新 `paid=true`、`invoice_id`、`period`。为了幂等，`invoice_id` 在表层唯一。
     - `customer.subscription.updated/deleted` 用于处理取消、暂停等状态。
5. 订阅积分/月更：成功入库后，`addSubscriptionCredits`（`apps/web/src/credits/credits.ts:482`）会按计划配置发积分，并利用 `CREDIT_TRANSACTION_TYPE.SUBSCRIPTION_RENEWAL` 做按月去重。

## 3. 一次性 / 终身支付流程
- 前端仍沿用 `CheckoutButton` 和 `createCheckoutAction`，区别在于 `plan.prices` 中 `type=one_time`，success URL 会把用户带回 `/payment?session_id=...&callback=/settings/billing`。
- Webhook：
  - **Creem** 的 `checkout.completed` 若识别到产品不属于订阅，而是普通产品，会写入 `payment` 记录：`type=one_time`、`scene` 根据产品判断是 `lifetime` 还是 `credit`（`apps/web/src/payment/provider/creem.ts:763`）。
    - 终身计划会触发 `addLifetimeMonthlyCredits`，后续每月补发积分。
  - **Stripe** 在 `checkout.session.completed` 中同样会根据 `mode=payment` 插入 `ONE_TIME` 记录，并调用 `invoice.paid` 保证 `paid=true`，然后触发 `addLifetimeMonthlyCredits`。
- 支付完成后的轮询、回调与订阅一致，均通过 `payment.session_id` 判断支付是否完成。

## 4. 积分套餐支付流程
1. UI 中 `PurchaseCreditsButton`（位于 `apps/web/src/components/settings/credits/credit-packages.tsx`）调用 `createCreditCheckoutSession`（`apps/web/src/actions/create-credit-checkout-session.ts`）。
   - Action 会校验套餐、写入 metadata（`type=credit_purchase`、`packageId`、`credits` 等），并把成功页面设为 `/payment?callback=/settings/credits`。
2. Provider 层：
   - **Creem**：`createCreditCheckout`（`apps/web/src/payment/provider/creem.ts:437`）从套餐配置中取 `price.priceId` 作为产品 ID 生成 checkout。
   - **Stripe**：`StripeProvider.createCreditCheckout` 会把 metadata 放到 `payment_intent`，并开启发票自动生成，确保 webhook 能取到 invoice。
3. Webhook：
   - Creem 在 `checkout.completed` 中判定产品属于积分包 → 写入 `payment`（`scene=credit`）→ `addCredits`（`apps/web/src/credits/credits.ts:84`）增加用户积分并记录流水。
   - Stripe 在 `checkout.session.completed` + `invoice.paid` 组合中完成同样逻辑，最后同样调用 `addCredits`。
4. `/payment` 页面轮询成功后会刷新 `['credits']` Query 缓存并跳回 `/settings/credits`，用户可立即看到余额变化。

## 5. Webhook 工作原理
- Next.js API Route：
  - Creem: `POST /api/webhooks/creem`（`apps/web/src/app/api/webhooks/creem/route.ts`）直接读取 JSON 体后传给 `handleWebhookEvent`。由于模板默认不校验签名，若上线建议结合 Creem Secret 验证。
  - Stripe: `POST /api/webhooks/stripe`（`apps/web/src/app/api/webhooks/stripe/route.ts`）读取原始文本与 `stripe-signature`，由 `StripeProvider.handleWebhookEvent` 使用官方 SDK 验签。
- `handleWebhookEvent` 内部会根据事件类型调用不同处理函数，所有写库操作集中在 Provider 类中：
  - 统一插入 / 更新 `payment` 表，并通过 `invoice_id`（唯一）、`session_id` 去重，防止重复收到同一事件时写两条。
  - 同步 `user.customer_id`，确保后续可打开客户门户。
  - 根据支付场景触发积分发放、终身计划月度积分等副作用。
- 如果 webhook 处理抛错，Route 会返回 400，第三方会按其策略重试，因此代码中保持了幂等与重试安全。

## 6. 当前套餐的定位方式
1. 客户端组件使用 `useCurrentPlan`（`apps/web/src/hooks/use-payment.ts`）。该 Hook 同时发起：
   - `useActiveSubscription` → 调用 `getActiveSubscriptionAction`（`apps/web/src/actions/get-active-subscription.ts`），筛选 `payment` 表中 `type=subscription`、`paid=true` 的记录，并选最近且 `status` 为 `active/trialing` 的一条。
   - `useLifetimeStatus` → 调用 `getLifetimeStatusAction`（`apps/web/src/actions/get-lifetime-status.ts`），查询 `scene=lifetime` 且 `paid=true` 的一次性记录。
2. `useCurrentPlan` 拿到原始记录后，将 `subscription.priceId` 或终身订单的 priceId 映射到 `websiteConfig.price.plans` 中的配置，最终返回 `{ currentPlan, subscription }`。
3. 前端诸如 `PricingTable`（`apps/web/src/components/pricing/pricing-table.tsx`）、`BillingCard`（`apps/web/src/components/settings/billing/billing-card.tsx`）、`UpgradeCard`（`apps/web/src/components/dashboard/upgrade-card.tsx`）都会使用该数据：
   - 如果当前计划为付费计划，则 Pricing 页对应卡片会展示 “当前套餐” 并禁用重复购买按钮。
   - 如果无订阅且不是终身用户，侧边栏的 `<UpgradeCard />` 会出现引导升级的按钮。

## 7. 扩展新的订阅套餐（示例：Plus 订阅）
1. **准备价格 ID**：在支付平台（Stripe 或 Creem）创建对应产品/价格，记录价格 ID。
   - Stripe 示例：`NEXT_PUBLIC_STRIPE_PRICE_PLUS_MONTHLY`、`NEXT_PUBLIC_STRIPE_PRICE_PLUS_YEARLY`。
   - Creem 示例：`NEXT_PUBLIC_CREEM_PRODUCT_PLUS_MONTHLY`、`NEXT_PUBLIC_CREEM_PRODUCT_PLUS_YEARLY`。
   - 将环境变量写入 `.env` 并同步至 `env.example`。
2. **扩展 `websiteConfig`**（`apps/web/src/config/website.tsx`）：
   - 在 `PRICE_IDS` 部分添加 Plus 对应的键值。
   - 在 `price.plans` 下新增 `plus` 配置，参考 `pro` 的结构，设置 `prices`、`credits`、`popular` 标记等。
3. **补充国际化描述**：
   - `usePricePlans`（`apps/web/src/config/price-config.tsx`）当前只处理 `free/pro/lifetime`，需要仿照现有写法新增 `plus` 分支。
   - 在 `messages/**/pricing.json`（具体路径视语言文件而定）添加 Plus 文案、特性列表。
4. **UI 排序与展示**：若需要特定排序，可在 `PricingTable` 渲染前调整 plans 顺序，或在 `websiteConfig.price.plans` 中控制。
5. **积分配置**（可选）：如需给 Plus 用户附带月度积分，在 `plus.credits` 中设置 `enable/amount/expireDays`。Webhook 会自动调用 `addSubscriptionCredits`，不需要额外代码。
6. **回归验证**：
   - 在 Pricing 页确认 Plus 套餐出现且按钮指向正确价格。
   - 实际走一遍支付 → webhook → `/settings/billing`，检查 `payment` 表 `price_id`、`type=subscription`、`status=active`。
   - 验证 `useCurrentPlan` 返回的 plan id 为 `plus`，Pricing 卡片呈现 “当前套餐”，Upgrade 卡片隐藏。

## 8. 调试与排错建议
- 查询支付记录：`SELECT * FROM payment WHERE user_id = '...';` 可快速确认 webhook 是否落库、`status/paid` 是否正确。
- 针对重复入库，确认 `invoice_id`、`session_id` 是否缺失。如果第三方 payload 没有提供，需要在 Provider 中补充；否则唯一索引会抛出冲突以提醒问题。
- 若 `/payment` 页面长时间处于加载，检查 URL 中是否存在有效 `session_id`/`checkout_id`，以及 `payment.session_id` 是否被成功写入。
- Webhook 调试时建议将事件 payload 记录在日志，或使用第三方提供的回放工具（如 Stripe CLI、Creem dashboard）重放。
