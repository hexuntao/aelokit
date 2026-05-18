# `@repo/shared` Package 规则

## Package 定位

`packages/shared` 提供跨 app/package 共享的纯工具函数、常量、类型，以及少量 framework-light 的通用 hooks/context。

## Owns

- 通用 utilities。
- 通用 constants。
- 通用 TypeScript types。
- Generic hooks/context，例如 controlled state、media query、strict context。
- class name/style helper 等低层工具。

## Does not own

- SaaS 业务领域逻辑。
- DB access、auth session、payment、credits、mail、storage、analytics 运行时。
- Next route handler、server action、cookies、headers。
- App-specific UI 或页面组件。

## Allowed dependencies

- `clsx`、`tailwind-merge` 等低层工具。
- React 作为 peer dependency，仅用于 generic hooks/context。

## Forbidden dependencies

- `apps/web` 或 `@/` alias。
- `@repo/db`、`@repo/auth`、`@repo/payment`、`@repo/credits`、`@repo/env/server`。
- Next runtime、provider SDK、业务 package side effects。

## Exports rule

- 公开 exports：`.`、`./utils`、`./hooks`、`./constants`、`./types`、`./context`。
- 不允许 deep import `src/*`。
- 新 helper 必须放进明确 subpath，避免把 `shared` 变成杂物箱。

## Implementation rule

- 保持纯函数优先。
- hooks/context 必须通用，不依赖 app route、auth、i18n 或业务状态。
- 命名要表达真实用途，不使用 `misc`、`common`、`helper` 这类模糊目录。

## Testing / validation command

```bash
pnpm --filter @repo/shared typecheck
pnpm --filter @repo/shared lint
```

## Common mistakes

- 因为“不知道放哪”就放进 shared。
- 在 shared 中读取 env 或 DB。
- 把 app UI 状态 hook 抽成跨 app hook。
