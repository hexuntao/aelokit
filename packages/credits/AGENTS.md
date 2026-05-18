# `@repo/credits` Package 规则

## Package 定位

`packages/credits` 是积分领域包，拥有 credits ledger、balance、transaction、distribution 和 consumption/reservation 能力的演进边界。

## Owns

- Credit balance 查询和更新。
- Credits ledger mutation。
- Credit transaction types。
- Credits distribution。
- 未来 AI credits preflight/reservation/settlement 的领域能力。

## Does not own

- Payment provider integration。
- Auth session lookup。
- Next route handler、server action、UI。
- AI runtime orchestration。
- AI usage v0.2 的扣费逻辑。

## Allowed dependencies

- `@repo/config`。
- `@repo/db`。
- `drizzle-orm`。
- `date-fns`。

## Forbidden dependencies

- `apps/web` 或 `@/` alias。
- `@repo/payment`。
- `@repo/auth`。
- next-intl、React、Next runtime、AI runtime package。

## Exports rule

- 公开 exports：`.`、`./types`、`./service`、`./ledger`、`./distribute`。
- 不允许 deep import `src/*`。
- 未来 reservation/settlement 如新增，应以明确 subpath 或现有 service/ledger 边界暴露。

## Implementation rule

- AI usage v0.2 只审计，不扣费。
- AI credits 扣费进入 v0.5 后必须通过 credits 包提供的 ledger/reservation/settlement 能力。
- 不允许 AI runtime 直接改 ledger 表。
- Payment 与 credits 不允许互相依赖；支付成功后的 credits 处理通过 app-level callback 编排。

## Testing / validation command

```bash
pnpm --filter @repo/credits typecheck
pnpm --filter @repo/credits lint
```

## Common mistakes

- 在 AI route 中直接写 `credit_transaction`。
- 让 credits 包 import payment provider。
- 把 credits UI 或 checkout action 放进 package。
- 在 v0.2 usage audit 阶段提前做扣费。
