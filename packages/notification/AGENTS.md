# `@repo/notification` Package 规则

## Package 定位

`packages/notification` 是系统通知领域包，提供 notification provider contracts、registry 和通知服务。

## Owns

- Notification types。
- Provider interface。
- Provider registry。
- Discord/Feishu provider。
- Payment/credit distribution notification service 的通用能力。

## Does not own

- App route handler。
- User-facing inbox UI。
- App-specific botName/avatarUrl 组装。
- DB persistence。
- Analytics dashboard。
- Auth/payment/credits workflow ownership。

## Allowed dependencies

- `@repo/config`。
- `@repo/env`。
- Provider 所需的轻量运行时逻辑。

## Forbidden dependencies

- `apps/web` 或 `@/` alias。
- `@repo/mail`、`@repo/newsletter`、`@repo/auth`、`@repo/payment`、`@repo/credits`、`@repo/db`。
- next-intl、React、Next runtime、UI。

## Exports rule

- 公开 exports：`.`、`./types`、`./provider`、`./service`、`./registry`、`./providers`。
- 不允许 deep import `src/providers/*`。
- App-specific provider config 注入留在 app shim。

## Implementation rule

- 通知包提供 provider/service 能力，不决定 app workflow。
- `apps/web/src/notification/index.ts` 注入 botName/avatarUrl 等 app 配置。
- 不把通知记录持久化 schema 放进 notification 包；如未来需要 persistence，先做架构确认。

## Testing / validation command

```bash
pnpm --filter @repo/notification typecheck
pnpm --filter @repo/notification lint
```

## Common mistakes

- 让 notification 包 import payment 或 credits 包。
- 在 provider 中读取 app URL helper。
- 把通知 UI 或 admin dashboard 放进 package。
