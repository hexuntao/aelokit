# `@repo/credits` Package 规则

## Package 定位

`packages/credits` 是积分领域包，拥有 credits ledger、balance、transaction、distribution 和 consumption/reservation 能力的演进边界。

## Owns

- Credit balance 查询和更新。
- Credits ledger mutation。
- Credit transaction types。
- Credits distribution。
- `./ai-billing` 暴露的 AI credits preflight/reservation/settlement/refund gated foundation。

## Does not own

- Payment provider integration。
- Auth session lookup。
- Next route handler、server action、UI。
- AI runtime orchestration。
- App-level AI billing orchestration。

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

- 公开 exports：`.`、`./types`、`./service`、`./ledger`、`./distribute`、`./ai-billing`。
- 不允许 deep import `src/*`。
- 新增公开 subpath 前必须有明确 export plan 和用户确认。

## Implementation rule

- 当前 credits scope 由用户当前 prompt、root `AGENTS.md`、`packages/AGENTS.md` 和 PRD 共同约束；
  历史 roadmap、旧版本文档、历史任务文档和已删除文档不能作为当前需求依据。
- AI usage audit 不等于 credits charging；只有当前用户 prompt 明确打开 AI billing 集成时才接入扣费。
- AI billing 只允许通过 credits 包提供的 `./ai-billing` gated foundation 接入；当前阶段由它承载 preflight/reservation/settlement/refund 领域能力，只有当前用户 prompt 明确打开 AI billing 集成时才允许进入 app-level 编排。
- 不允许 AI runtime 直接改 ledger 表或绕过 credits package。
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
- 把 usage audit 当成已经授权的 credits charging。
