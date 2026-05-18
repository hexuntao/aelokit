# `@repo/newsletter` Package 规则

## Package 定位

`packages/newsletter` 是邮件订阅领域包，提供 newsletter provider interface、registry 和 subscribe/unsubscribe/status 服务。

## Owns

- Newsletter types。
- Provider interface。
- Provider registry。
- Beehiiv/Resend newsletter providers。
- Subscribe/unsubscribe/status service。

## Does not own

- App forms。
- Captcha。
- Auth callbacks。
- Mail template rendering。
- DB schema。
- UI、route handlers、server actions。

## Allowed dependencies

- `@repo/config`。
- `@repo/env`。
- Newsletter provider SDKs，例如 `@beehiiv/sdk`、`resend`。

## Forbidden dependencies

- `apps/web` 或 `@/` alias。
- `@repo/mail`。
- `@repo/auth`、`@repo/payment`、`@repo/credits`、`@repo/db`。
- next-intl、React、Next runtime、UI。

## Exports rule

- 公开 exports：`.`、`./types`、`./provider`、`./service`、`./registry`、`./providers`。
- 不允许 deep import `src/providers/*`。
- 新 provider 必须通过 `./providers` 和 registry 暴露。

## Implementation rule

- Newsletter 包只处理订阅领域和 provider 调用。
- 表单验证、captcha、用户 session、toast/UI 留在 app。
- `@repo/mail` 与 `@repo/newsletter` 不允许互相依赖。

## Testing / validation command

```bash
pnpm --filter @repo/newsletter typecheck
pnpm --filter @repo/newsletter lint
```

## Common mistakes

- 为了发送欢迎邮件让 newsletter import mail。
- 把 newsletter form 放进 package。
- 在 package 里处理 captcha 或 request session。
