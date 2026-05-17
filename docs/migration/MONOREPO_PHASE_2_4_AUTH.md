# Phase 2.4：抽取 packages/auth

## 概述

将 better-auth 的核心认证配置、服务端 auth 实例、客户端 auth client、认证相关类型/工具抽取为共享包 `@repo/auth`。

## 已创建文件

```
packages/auth/
  package.json
  tsconfig.json
  src/
    index.ts        # 类型和纯工具导出（不含 server/client 实例，避免 bundle 污染）
    server.ts       # better-auth server 配置（createAuth 工厂 + 默认 auth 实例）
    client.ts       # better-auth client 配置（authClientPlugins + 默认 authClient）
    types.ts        # Session / SessionUser 类型
    helpers.ts      # 纯认证 helper（isAdmin / getLocaleFromRequest）
    utils.ts        # getBaseUrl 等纯工具函数
```

## @repo/auth 负责

- better-auth server 配置（`createAuth` 工厂函数 + 默认 `auth` 实例）
- better-auth client 配置（`authClientPlugins` + 默认 `authClient`）
- 认证类型（`Session`、`SessionUser`、`AuthAppCallbacks`）
- 纯认证 helper（`isAdmin`、`getLocaleFromRequest`）
- 纯工具函数（`getBaseUrl`）

## @repo/auth 不包含

- auth 页面（login / register / reset-password 等）
- App Router route handler（`app/api/auth/[...all]/route.ts`）
- proxy.ts / middleware
- React 组件
- Server Actions
- payment 逻辑
- credits 逻辑
- email 模板
- newsletter 逻辑
- storage 逻辑
- notification 逻辑
- next-intl 翻译 hook
- route 常量

## apps/web 兼容 shim

- `apps/web/src/lib/auth.ts`：使用 `createAuth(authCallbacks)` 创建带 app 回调的 auth 实例，包含 `onCreateUser`（newsletter/credits）、`sendResetPassword`、`sendVerificationEmail` 回调
- `apps/web/src/lib/auth-client.ts`：使用 `createAuthClient` + `authClientPlugins` + `inferAdditionalFields<typeof auth>()` 创建带完整类型推断的 auth client
- `apps/web/src/lib/auth-types.ts`：re-export `Session` / `SessionUser` 类型

## 关键设计决策

### 1. createAuth 工厂函数

`packages/auth/src/server.ts` 导出 `createAuth(callbacks?)` 工厂函数，而非直接导出 `auth` 实例。

原因：`onCreateUser`、`sendResetPassword`、`sendVerificationEmail` 依赖 `@/mail`、`@/newsletter`、`@/credits`、`@/lib/price-plan`、`@/i18n/routing` 等 app 层模块，不能放入共享包。

默认 `auth` 实例（`export const auth = await createAuth()`）不包含这些回调，仅用于类型推断。

### 2. client.ts 不导入 server.ts

`packages/auth/src/client.ts` 不从 `./server` 导入，避免将 server-only 代码（`@repo/db`、`postgres`）拉入客户端 bundle。

`inferAdditionalFields<typeof auth>()` 必须在 app 层（`apps/web/src/lib/auth-client.ts`）使用，因为需要引用本地 `auth` 实例类型。

`client.ts` 导出 `authClientPlugins`（预配置的插件列表），app 层使用 `...authClientPlugins` 展开后添加 `inferAdditionalFields`。

### 3. getBaseUrl 独立文件

`getBaseUrl` 放在 `packages/auth/src/utils.ts`，server.ts 和 client.ts 都从 utils.ts 导入，避免 client.ts 间接依赖 server.ts。

### 4. index.ts 不导出 server/client 实例

`packages/auth/src/index.ts` 只导出类型和纯工具函数，不导出 `auth`、`authClient`、`createAuth` 等实例/工厂，防止客户端组件意外引入 server-only 代码。

使用路径：
- `@repo/auth/server` → server 端 auth 实例和工厂
- `@repo/auth/client` → client 端 authClient 和插件
- `@repo/auth/types` → 类型
- `@repo/auth/helpers` → 纯 helper
- `@repo/auth/utils` → 纯工具函数
- `@repo/auth` → 类型和纯工具（安全桶文件）

## 依赖方向

```
@repo/shared（无依赖）
@repo/config（无依赖）
@repo/db → drizzle-orm, postgres
@repo/auth → @repo/db + @repo/config + @repo/shared + better-auth
apps/web → @repo/auth + @repo/db + @repo/config + @repo/shared
```

无循环依赖。

## 验证命令

```bash
pnpm --filter @repo/auth typecheck
pnpm --filter @repo/auth lint
pnpm --filter @repo/auth format
pnpm typecheck
pnpm lint
pnpm format
pnpm build
pnpm --filter @repo/web db:generate
pnpm check:db-shims
```

## 已知问题与修复

### auth:schema:generate 覆盖 DB shim

`pnpm --filter @repo/web auth:schema:generate` 会调用 better-auth CLI 生成 schema。

**问题**：better-auth CLI 会直接覆盖输出文件，如果输出路径指向 `apps/web/src/db/auth.schema.ts`，会破坏 Phase 2.3 建立的 shim 边界。

**修复**（Phase 2.4 Fix）：
- `auth:schema:generate` 输出路径改为 `packages/db/src/auth.schema.reference.ts`（参考文件）
- 参考文件不覆盖手写 schema（`packages/db/src/auth.schema.ts`）
- 参考文件已加入 `.gitignore`
- 新增 `pnpm check:db-shims` 边界检查脚本
- 详见 `docs/migration/MONOREPO_PHASE_2_4_FIX_DB_SHIM.md`
