# Phase 2.4 Fix：修复 auth 改造破坏 DB shim 边界的问题

## 问题描述

Phase 2.4 验证过程中执行了 `pnpm --filter @repo/web auth:schema:generate`，该命令调用 better-auth CLI 生成 schema 并直接覆盖输出文件。

原始命令输出路径为 `src/db/auth.schema.ts`（相对于 `apps/web`），即 `apps/web/src/db/auth.schema.ts`。

Phase 2.3 后，`apps/web/src/db/auth.schema.ts` 应该是兼容 shim：

```ts
export * from '@repo/db/auth-schema';
```

但 better-auth CLI 直接覆盖了该文件，写入了完整的 pgTable 定义，破坏了 shim 边界。

## 根因分析

1. `auth:schema:generate` 脚本在 `apps/web/package.json` 中定义
2. better-auth CLI 必须从 web app 上下文读取 auth 配置（无独立 `better-auth.config` 文件）
3. CLI 的 `--output` 参数直接覆盖目标文件，不检查是否为 shim
4. 原始输出路径指向 `apps/web/src/db/auth.schema.ts`，正好是 shim 位置

## 修复措施

### 1. 恢复 apps/web/src/db shim

所有 `apps/web/src/db/*` 文件已确认为 shim：

- `apps/web/src/db/auth.schema.ts` → `export * from '@repo/db/auth-schema'`
- `apps/web/src/db/app.schema.ts` → `export * from '@repo/db/app-schema'`
- `apps/web/src/db/schema.ts` → `export * from '@repo/db/schema'`
- `apps/web/src/db/index.ts` → `export { getDb } from '@repo/db'; export * from '@repo/db'`

### 2. 修改 auth:schema:generate 输出路径

从 `src/db/auth.schema.ts` 改为 `../../packages/db/src/auth.schema.reference.ts`。

**为什么输出到 reference 文件而不是直接覆盖 `packages/db/src/auth.schema.ts`？**

better-auth CLI 生成的 schema 与手写 schema 存在差异：
- CLI 使用双引号，手写使用单引号
- CLI 自动添加 `relations` 定义
- CLI 添加 `defaultNow()` 和 `$onUpdate()` 默认值
- CLI 移除自定义索引命名（如 `user_customer_id_idx`、`user_role_idx`）
- CLI 移除额外索引（如 `account_account_id_idx`、`account_provider_id_idx`）

直接覆盖会丢失手写索引和注释。因此输出到 `.reference.ts` 作为参考文件，开发者可手动比对后决定是否合并变更。

### 3. 参考文件加入 .gitignore

`packages/db/src/auth.schema.reference.ts` 已加入根 `.gitignore`，不会被提交。

### 4. 新增 check:db-shims 脚本

创建 `scripts/check-db-shims.mjs`，检查 `apps/web/src/db/*` 文件是否包含真实 schema 代码。

检查的禁止模式：`pgTable`、`relations`、`varchar`、`integer`、`boolean`、`timestamp`、`drizzle`、`postgres`

根 `package.json` 新增：

```json
"check:db-shims": "node scripts/check-db-shims.mjs"
```

### 5. 恢复 packages/db/src/auth.schema.ts

使用 `git checkout` 恢复了被 better-auth CLI 覆盖的手写 schema。

## DB Shim 边界规则

- `apps/web/src/db/*` 是兼容 shim，只包含 `export * from '@repo/db/...'` 形式的 re-export
- 真实 schema 所有权在 `packages/db/src/*`
- 任何 schema generate 命令不得写入 `apps/web/src/db/*`
- `auth:schema:generate` 输出到 `packages/db/src/auth.schema.reference.ts`（参考文件，不覆盖手写 schema）
- `db:generate` 读取 `packages/db/src/schema.ts`
- 使用 `pnpm check:db-shims` 验证 shim 边界

## 验证结果

- `pnpm check:db-shims`：✅ 通过（auth:schema:generate 前后均通过）
- `pnpm --filter @repo/db typecheck`：✅ 通过
- `pnpm --filter @repo/auth typecheck`：✅ 通过
- `pnpm typecheck`：✅ 通过
- `pnpm --filter @repo/web build`：✅ 通过
- `pnpm build`：✅ 通过
- `pnpm --filter @repo/web db:generate`：✅ 无新 migration
