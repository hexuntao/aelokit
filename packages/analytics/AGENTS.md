# `@repo/analytics` Package 规则

## Package 定位

`packages/analytics` 是 product analytics contracts/helpers 包，提供 analytics types、event names、provider contracts、config helpers 和 client/server-safe helper。

## Owns

- Analytics event names。
- Provider interface。
- Provider registry。
- Analytics config helper。
- Client-safe analytics helper。
- Server-safe analytics helper。
- Product analytics contracts。

## Does not own

- React Provider。
- Script injection。
- Dashboard/admin analytics UI。
- DB persistence。
- Auth/payment/credits workflow。
- Operational observability、traces、evals、logs、cost dashboards。

## Allowed dependencies

- `@repo/config`。
- `@repo/env`。

## Forbidden dependencies

- `apps/web` 或 `@/` alias。
- `@repo/auth`、`@repo/payment`、`@repo/credits`、`@repo/mail`、`@repo/newsletter`、`@repo/notification`、`@repo/storage`、`@repo/db`。
- next-intl、Next runtime、React。

## Exports rule

- 公开 exports：`.`、`./types`、`./client`、`./server`、`./events`、`./provider`、`./registry`、`./config`、`./helpers`。
- client/server helper 必须保持边界清楚。
- 不允许 deep import `src/*`。

## Implementation rule

- AI usage audit 和 operational observability 不要混为一谈。
- Product analytics 可以记录产品事件，例如 model selected、AI workspace opened、tool used summary。
- 未来 traces/evals/logs/cost observability 可独立 package，不塞进 analytics。
- React Provider 和 script injection 留在 `apps/web/src/analytics`。

## Testing / validation command

```bash
pnpm --filter @repo/analytics typecheck
pnpm --filter @repo/analytics lint
```

## Common mistakes

- 把 PostHog/analytics React Provider 移入 package。
- 把 AI trace/eval/log persistence 当成 product analytics。
- 在 analytics 包里 import DB 或 auth。
