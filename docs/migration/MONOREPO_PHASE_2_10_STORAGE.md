# Phase 2.10：抽取 packages/storage

## 概述

本阶段创建了 `packages/storage`，将对象存储领域能力抽成共享包。

## 创建的文件

### packages/storage/

```
packages/storage/
  package.json
  tsconfig.json
  src/
    index.ts
    types.ts
    provider.ts
    service.ts
    registry.ts
    providers/
      index.ts
      s3.ts
    config/
      storage-config.ts
```

## `@repo/storage` 职责

- Storage types（StorageConfig, StorageProvider, UploadFileParams, UploadFileResult 等）
- Storage provider interface
- S3 provider（使用 s3mini）
- Provider registry
- Storage service（uploadFile, deleteFile）
- Storage configuration（从环境变量读取）

## `@repo/storage` 不负责

- 客户端上传函数（保留在 `apps/web/src/storage/client.ts`）
- Upload Server Actions（当前无）
- Upload API route handlers（保留在 `apps/web/src/app/api/storage/upload/route.ts`）
- React 上传组件（保留在 `apps/web/src/components/settings/profile/update-avatar-card.tsx`）
- Auth session 获取
- Database record 写入

## `@repo/storage` 依赖

- `@repo/config`：读取 websiteConfig.storage.provider
- `s3mini`：S3/R2 兼容客户端

## `@repo/storage` 不允许依赖

- `@repo/auth`
- `@repo/payment`
- `@repo/credits`
- `@repo/mail`
- `@repo/newsletter`
- `@repo/notification`
- `@repo/db`
- next
- next-intl
- react
- better-auth
- stripe
- creem
- drizzle-orm
- resend

## apps/web/src/storage/* shim

所有文件改为 re-export 自 `@repo/storage`：

- `index.ts` → `export * from '@repo/storage'`
- `types.ts` → `export * from '@repo/storage/types'`
- `provider/s3.ts` → `export { S3Provider } from '@repo/storage/providers'`
- `config/storage-config.ts` → `export { storageConfig } from '@repo/storage/config'`
- `client.ts` → 保留在 `apps/web`，修改 import 指向 `@repo/storage`

## 保留在 apps/web 的内容

- `apps/web/src/storage/client.ts`：浏览器专用上传函数
- `apps/web/src/app/api/storage/upload/route.ts`：Upload API route handler
- `apps/web/src/components/settings/profile/update-avatar-card.tsx`：React 上传组件

## apps/web/package.json 更新

添加依赖：

```json
{
  "dependencies": {
    "@repo/storage": "workspace:*"
  }
}
```

## apps/web/next.config.ts 更新

添加 transpilePackages：

```ts
transpilePackages: [
  // ...
  '@repo/storage',
],
```

## 验收命令

每次修改 `packages/storage` 后必须执行：

```bash
pnpm --filter @repo/storage typecheck
pnpm --filter @repo/storage lint
pnpm --filter @repo/storage format
pnpm check:db-shims
pnpm --filter @repo/web build
pnpm build
```

## 边界检查

```bash
# 不允许出现以下 import
grep -R "@repo/auth" packages/storage || true
grep -R "@repo/db" packages/storage || true
grep -R "@repo/payment" packages/storage || true
grep -R "@repo/credits" packages/storage || true
grep -R "@repo/mail" packages/storage || true
grep -R "@repo/newsletter" packages/storage || true
grep -R "@repo/notification" packages/storage || true
grep -R "next-intl" packages/storage || true
grep -R "react" packages/storage || true
```

## 成功标准

- `@repo/storage` 已创建
- `@repo/storage` 自己能 typecheck/lint/format
- `apps/web build` 通过
- `pnpm build` 通过
- `check:db-shims` 通过
- 原始 storage 注释完整保留
- Upload API route 仍在 apps/web
- Upload UI 仍在 apps/web
- `packages/storage` 不依赖 auth/db/payment/credits/mail/newsletter/notification
- 其他 packages 不依赖 storage
- 没有未使用 dependency
- 没有循环依赖
