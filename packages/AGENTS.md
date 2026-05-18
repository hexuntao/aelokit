# Packages 目录规则

本文件适用于 `packages/*`。修改具体 package 前，还必须读取该 package
目录下更近的 `AGENTS.md`。

## 定位

- `packages/*` 是跨 app 共享领域包。
- package 拥有稳定、可复用、可测试的领域边界。
- package 不拥有 app route、page composition、server action、React provider 注入或部署入口。

## Dependency rules

- package 不允许 import app。
- package 必须声明自己直接 import 的依赖，包括 `@repo/*` 内部包。
- 不允许依赖 `apps/web` 的依赖穿透。
- package 必须使用明确 exports。
- 不允许 deep import 内部实现，例如 `@repo/db/src/...`。
- 需要区分 server-only 和 client-safe exports 时，必须用明确 subpath 表达。

## Package creation rules

- 不允许创建 `common`、`misc`、`core` 这类无边界杂物包。
- 新 package 必须有：
  - scope freeze。
  - ownership。
  - allowed dependencies。
  - forbidden dependencies。
  - exports plan。
  - validation commands。
  - user confirmation。
- `packages/ai`、`packages/design-system` 是未来规划；当前不要创建。

## Implementation rules

- package 内部实现要围绕自身领域，不要因为调用方便吸收 app policy。
- package 可以暴露接口、provider registry、service、types，但不要接管 app-specific callbacks。
- package 中新增 import 时，同步更新本 package 的 `package.json`。
- 新 exports 必须和 package 边界一致，不要导出未稳定的内部实现。

## Validation

- 常规 package 改动：`pnpm --filter @repo/<package-name> typecheck`。
- 需要 lint 时：`pnpm --filter @repo/<package-name> lint`。
- 格式化：`pnpm --filter @repo/<package-name> format`。
- export/shim 相关改动：补充运行 `pnpm check:package-exports`，DB shim 相关补充 `pnpm check:db-shims`。
- schema/migration/db push 必须用户确认后再运行。

## Common mistakes

- package import `apps/web` 或 `@/` alias。
- 把 app session、cookies、headers、server action 放进 package。
- 创建没有明确消费者和边界的新包。
- 通过 deep import 绕过 package exports。
- 忘记在 package 自己的 `package.json` 声明直接依赖。
