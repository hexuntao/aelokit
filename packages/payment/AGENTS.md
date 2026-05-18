# `@repo/payment` Package 规则

## Package 定位

`packages/payment` 是支付领域包，负责 payment provider contracts、registry 和 Stripe/Creem provider 实现。

## Owns

- Payment types。
- Payment provider interface。
- Provider registry。
- Stripe/Creem provider wrapper。
- Checkout、credit checkout、customer portal、webhook event 的 provider-level helper。

## Does not own

- Credits ledger 所有权。
- Auth session lookup。
- Pricing/billing UI。
- Checkout server actions。
- Webhook route handlers。
- App-specific notification 或 credits callback 实现。
- AI usage/credits billing policy。

## Allowed dependencies

- `@repo/config`。
- `@repo/db`。
- `@repo/env`。
- `@repo/shared`。
- `drizzle-orm`。
- `stripe`。
- `zod`。

## Forbidden dependencies

- `apps/web` 或 `@/` alias。
- `@repo/auth`。
- `@repo/credits` 直接依赖。
- React、next-intl、Next runtime、UI。

## Exports rule

- 公开 exports：`.`、`./types`、`./provider`、`./registry`、`./providers`。
- 不允许 deep import `src/providers/*`；需要 provider 时使用 `@repo/payment/providers`。
- 新 provider 必须通过 registry/provider exports 暴露。

## Implementation rule

- App-specific callbacks 由 `apps/web/src/payment/index.ts` 注入。
- Payment 包不得直接 mutate credits ledger；credits 变更通过 app callback 调用 `@repo/credits`。
- Webhook route 负责 HTTP boundary，payment 包负责 provider event 解释和 callback 编排。

## Testing / validation command

```bash
pnpm --filter @repo/payment typecheck
pnpm --filter @repo/payment lint
```

## Common mistakes

- 让 payment 包 import credits service。
- 在 package 中读取 request session。
- 把 pricing/billing React UI 移入 payment 包。
- 把 webhook route handler 放进 package。
