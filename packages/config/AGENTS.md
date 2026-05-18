# `@repo/config` Package 规则

## Package 定位

`packages/config` 提供跨 app/package 共享的核心 SaaS 静态配置和配置类型。

## Owns

- Website/SaaS 配置结构。
- Price plan 和 credits package 的静态配置类型。
- Provider name、feature flag、metadata、social、docs/blog/mail/newsletter/storage/payment 等 typed config。
- 与配置读取相关的纯 helper。

## Does not own

- Secrets 或 env schema。
- DB query、provider SDK 初始化、route handler、server action。
- React UI 或 app 页面。
- AI runtime contracts。

## Allowed dependencies

- `@repo/env`。
- TypeScript 类型和纯 helper 依赖。

## Forbidden dependencies

- `apps/web` 或 `@/` alias。
- `@repo/db`、`@repo/auth`、`@repo/payment`、`@repo/credits` 等业务运行时包。
- React、Next runtime、provider SDK side effects。

## Exports rule

- 只通过 package exports 暴露：`.`、`./website`、`./types`。
- 不允许消费者 deep import `src/*`。
- 新增配置类型时同步确认是否需要新增公开 subpath；默认优先放在现有 exports。

## Implementation rule

- 配置应保持可序列化、明确、低副作用。
- 不在 config 包读取 server secret；secret 归 `@repo/env/server`。
- 不把 app route、UI copy 或动态 session 状态塞进 config。

## Testing / validation command

```bash
pnpm --filter @repo/config typecheck
pnpm --filter @repo/config lint
```

## Common mistakes

- 在 config 中初始化 provider client。
- 把 secret 当作普通配置暴露。
- 为单个 app 页面添加 app-bound 配置，导致 future app 复用困难。
