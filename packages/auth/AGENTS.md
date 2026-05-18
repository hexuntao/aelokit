# `@repo/auth` Package 规则

## Package 定位

`packages/auth` 是 Better Auth core 层，提供认证核心、server/client helper、auth 类型和 app callback contracts。

## Owns

- Better Auth server/client core。
- Session/User 类型。
- Auth helper，例如 admin 判断、locale request helper。
- App callback contract 类型。
- user/session/role/API key 基础能力。

## Does not own

- App-specific mail sending。
- 注册赠送 credits、newsletter side effects、notification side effects。
- UI、auth pages、forms。
- App route handler。
- AI runtime 权限逻辑本身。
- Payment/credits workflow orchestration。

## Allowed dependencies

- `@repo/config`。
- `@repo/db`。
- `@repo/env`。
- `@repo/shared`。
- `better-auth`、`better-auth-harmony`、`cookie`。

## Forbidden dependencies

- `apps/web` 或 `@/` alias。
- `@repo/payment`、`@repo/credits`、`@repo/mail`、`@repo/newsletter`。
- React UI、Next page components、server actions。
- AI runtime provider/model/tool execution。

## Exports rule

- 公开 exports：`.`、`./server`、`./client`、`./types`、`./helpers`、`./utils`。
- 不允许 deep import `src/*`。
- Server-only 和 client-safe helper 必须分开 exports。

## Implementation rule

- App-specific callback 由 `apps/web` 注入，不在 auth 包里直接发邮件、发 credits、订阅 newsletter。
- Auth 包可以提供 user/session/role/API key 基础，但不直接做 AI runtime permission policy。
- 不把 auth UI 或页面放进 package。

## Testing / validation command

```bash
pnpm --filter @repo/auth typecheck
pnpm --filter @repo/auth lint
```

## Common mistakes

- 在 auth callback 里直接 import app mail/credits/newsletter。
- 把登录表单或页面组件放进 auth 包。
- 让 AI route 具体权限策略沉入 auth core。
