# `@repo/mail` Package 规则

## Package 定位

`packages/mail` 是事务邮件领域包，提供 mail provider interface、render helper、邮件模板和邮件组件。

## Owns

- Mail types。
- Mail provider interface/factory。
- Render helper。
- React Email templates。
- React Email components。
- Resend provider wrapper。

## Does not own

- App-specific PreviewProps。
- Auth callback。
- Route handler。
- Server action。
- DB access。
- Payment/credits/newsletter side effects。
- App-specific locale/message loading。

## Allowed dependencies

- `@repo/config`。
- `@repo/env`。
- `@repo/shared`。
- React Email dependencies。
- `react`、`react-dom` for email rendering。
- `resend`。
- `use-intl` where generic template rendering needs it.

## Forbidden dependencies

- `apps/web` 或 `@/` alias。
- `@repo/auth`、`@repo/payment`、`@repo/credits`、`@repo/db`、`@repo/newsletter`。
- next-intl concrete app messages、Next runtime、server actions。

## Exports rule

- 公开 exports：`.`、`./types`、`./provider`、`./render`、`./templates`、`./components`。
- 不允许 deep import `src/templates/*` 或 `src/components/*`。
- 新模板必须从 `./templates` index 暴露。

## Implementation rule

- 模板使用 generic `Locale` / `Messages` 类型，具体 messages 由 app 层传入。
- PreviewProps 留在 `apps/web/src/mail/templates/*`。
- 不在 mail 包触发业务 side effect；只负责渲染和发送能力。

## Testing / validation command

```bash
pnpm --filter @repo/mail typecheck
pnpm --filter @repo/mail lint
```

## Common mistakes

- 在模板里 import `@/i18n/messages`。
- 在 mail 包里读取 user/session 或 DB。
- 把 auth callback 邮件流程写进 mail 包。
