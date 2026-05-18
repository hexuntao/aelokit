# `@repo/i18n` Package 规则

## Package 定位

`packages/i18n` 提供跨 app/package 共享的 next-intl routing、navigation、messages、docs i18n、hreflang 和 URL helper。

## Owns

- Locale 类型和 routing helper。
- next-intl navigation/request 工厂。
- message merge/getter helper。
- hreflang/alternates/locale URL helper。
- docs i18n config helper。

## Does not own

- App copy 内容本身。
- Page/component composition。
- Auth/session、DB、payment、credits 状态。
- App-specific navigation tree 或 redirect policy。

## Allowed dependencies

- `@repo/config`。
- `@repo/env`。
- `next-intl`。
- `deepmerge`。
- docs helper 类型需要的轻量 dev/runtime 依赖。

## Forbidden dependencies

- `apps/web` 或 `@/` alias。
- `@repo/db`、`@repo/auth`、`@repo/payment`、`@repo/credits`。
- React UI 组件、Next route handlers、server actions。

## Exports rule

- 公开 exports：`.`、`./routing`、`./navigation`、`./messages`、`./request`、`./hreflang`、`./urls`、`./docs`、`./types`。
- 不允许 deep import `src/*`。
- 新增 i18n 能力必须按 routing/navigation/messages/docs 等真实边界暴露。

## Implementation rule

- 保持 i18n helper 可跨 app 使用，不写 `apps/web` 专属路径假设。
- App-specific messages、routes、sidebar 组合留在 app。
- 涉及 public URL 时同时考虑 locale prefix、default locale 和 canonical/hreflang。

## Testing / validation command

```bash
pnpm --filter @repo/i18n typecheck
pnpm --filter @repo/i18n lint
```

## Common mistakes

- 把某个页面的文案或导航树放进 i18n 包。
- 在 i18n helper 中读取 session 或数据库。
- 绕过 exports deep import `src/routing.ts`。
