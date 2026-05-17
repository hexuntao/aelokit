# Phase 2.12: Monorepo Package Boundary Audit Report

**Date**: 2026-05-14
**Status**: ✅ PASSED (with minor notes)

---

## 1. Packages 列表

当前已拆分的 packages：

| Package | 职责 | 依赖 |
|---------|------|------|
| `@repo/config` | 核心 SaaS 静态配置和配置类型 | 无 |
| `@repo/shared` | 纯工具函数、常量、类型 | clsx, tailwind-merge |
| `@repo/db` | Drizzle 数据库层 | drizzle-orm, postgres |
| `@repo/auth` | 认证核心层 | @repo/config, @repo/db, @repo/shared, better-auth |
| `@repo/payment` | 支付领域包 | @repo/config, @repo/db, @repo/shared, stripe, zod |
| `@repo/credits` | 积分领域包 | @repo/config, @repo/db, date-fns, drizzle-orm |
| `@repo/mail` | 事务邮件领域包 | @repo/config, @repo/shared, react-email, resend, use-intl |
| `@repo/newsletter` | 邮件订阅领域包 | @repo/config, @beehiiv/sdk, resend |
| `@repo/notification` | 系统通知领域包 | @repo/config |
| `@repo/storage` | 对象存储领域包 | @repo/config, s3mini |
| `@repo/analytics` | 统计分析领域包 | @repo/config |

---

## 2. Package Scripts 完整性

所有 packages 都具备完整的 scripts：

| Package | lint | format | typecheck | db:* |
|---------|------|--------|-----------|------|
| @repo/config | ✅ | ✅ | ✅ | N/A |
| @repo/shared | ✅ | ✅ | ✅ | N/A |
| @repo/db | ✅ | ✅ | ✅ | ✅ |
| @repo/auth | ✅ | ✅ | ✅ | N/A |
| @repo/payment | ✅ | ✅ | ✅ | N/A |
| @repo/credits | ✅ | ✅ | ✅ | N/A |
| @repo/mail | ✅ | ✅ | ✅ | N/A |
| @repo/newsletter | ✅ | ✅ | ✅ | N/A |
| @repo/notification | ✅ | ✅ | ✅ | N/A |
| @repo/storage | ✅ | ✅ | ✅ | N/A |
| @repo/analytics | ✅ | ✅ | ✅ | N/A |

---

## 3. Package Exports 有效性

所有 package exports 指向的文件都存在：

| Package | Exports | Status |
|---------|---------|--------|
| @repo/config | `.`, `./website`, `./types` | ✅ |
| @repo/shared | `.`, `./utils`, `./constants`, `./types` | ✅ |
| @repo/db | `.`, `./schema`, `./auth-schema`, `./app-schema`, `./types` | ✅ |
| @repo/auth | `.`, `./server`, `./client`, `./types`, `./helpers`, `./utils` | ✅ |
| @repo/payment | `.`, `./types`, `./provider`, `./registry`, `./providers` | ✅ |
| @repo/credits | `.`, `./types`, `./service`, `./ledger`, `./distribute` | ✅ |
| @repo/mail | `.`, `./types`, `./provider`, `./render`, `./templates`, `./components` | ✅ |
| @repo/newsletter | `.`, `./types`, `./provider`, `./service`, `./registry`, `./providers` | ✅ |
| @repo/notification | `.`, `./types`, `./provider`, `./service`, `./registry`, `./providers` | ✅ |
| @repo/storage | `.`, `./types`, `./provider`, `./service`, `./registry`, `./providers`, `./config` | ✅ |
| @repo/analytics | `.`, `./types`, `./client`, `./server`, `./events`, `./provider`, `./registry`, `./config`, `./helpers` | ✅ |

---

## 4. 未使用 Dependency 检查

未发现明显未使用的 dependency。所有声明的依赖都在代码中被实际使用。

---

## 5. 越界 Import 检查

### 5.1 `@/` import 泄漏

✅ **未发现** - packages 中没有 `@/` import

### 5.2 `apps/web` import 泄漏

⚠️ **仅在注释中出现** - 以下文件在注释/文档字符串中提及 `apps/web`：
- `packages/analytics/src/server.ts` - 注释说明实现应在 apps/web
- `packages/analytics/src/index.ts` - 注释说明 React Provider 在 apps/web
- `packages/analytics/src/client.ts` - 注释说明实现应在 apps/web

这些是文档性质的注释，不是实际 import，**可接受**。

### 5.3 Next.js runtime 泄漏

✅ **未发现** - packages 中没有 import `next/navigation`, `next/headers`, `next/server`

### 5.4 next-intl 泄漏

✅ **未发现** - packages 中没有 import `next-intl` 或 `useTranslations`

---

## 6. 循环依赖检查

### 依赖图

```
@repo/config (无依赖)
@repo/shared (无业务包依赖)
    ↓
@repo/db → @repo/config
    ↓
@repo/auth → @repo/config, @repo/db, @repo/shared
@repo/payment → @repo/config, @repo/db, @repo/shared
@repo/credits → @repo/config, @repo/db
@repo/mail → @repo/config, @repo/shared
@repo/newsletter → @repo/config
@repo/notification → @repo/config
@repo/storage → @repo/config
@repo/analytics → @repo/config
    ↓
apps/web → all packages
```

### 重点禁止检查

| 检查项 | 状态 |
|--------|------|
| `@repo/payment` <-> `@repo/credits` 循环 | ✅ 无循环 |
| `@repo/mail` <-> `@repo/newsletter` 循环 | ✅ 无循环 |
| `@repo/notification` 被业务包直接依赖 | ✅ 无依赖 |
| `@repo/storage` 被业务包直接依赖 | ✅ 无依赖 |
| `@repo/analytics` 被业务包直接依赖 | ✅ 无依赖 |
| `@repo/db` 依赖业务包 | ✅ 无依赖 |
| `@repo/config` 依赖业务包 | ✅ 无依赖 |
| `@repo/shared` 依赖业务包 | ✅ 无依赖 |

---

## 7. transpilePackages 完整性

`apps/web/next.config.ts` 中的 `transpilePackages` 包含所有 packages：

```ts
transpilePackages: [
  '@repo/config',
  '@repo/shared',
  '@repo/db',
  '@repo/auth',
  '@repo/payment',
  '@repo/credits',
  '@repo/mail',
  '@repo/newsletter',
  '@repo/notification',
  '@repo/storage',
  '@repo/analytics',
]
```

✅ **完整** - 所有 11 个 packages 都已包含

---

## 8. apps/web Workspace Dependencies 完整性

`apps/web/package.json` 中的 workspace dependencies：

```json
{
  "@repo/auth": "workspace:*",
  "@repo/config": "workspace:*",
  "@repo/credits": "workspace:*",
  "@repo/db": "workspace:*",
  "@repo/mail": "workspace:*",
  "@repo/newsletter": "workspace:*",
  "@repo/notification": "workspace:*",
  "@repo/payment": "workspace:*",
  "@repo/shared": "workspace:*",
  "@repo/storage": "workspace:*",
  "@repo/analytics": "workspace:*"
}
```

✅ **完整** - 所有 11 个 packages 都已声明

---

## 9. DB Shims 有效性

`pnpm check:db-shims` 结果：

```
✅ apps/web/src/db/auth.schema.ts: shim OK
✅ apps/web/src/db/app.schema.ts: shim OK
✅ apps/web/src/db/schema.ts: shim OK
✅ apps/web/src/db/index.ts: shim OK

✅ All DB shim boundary checks passed
```

所有 DB shim 都是纯 re-export，不包含真实 schema 代码。

---

## 10. Storage Client/Server 边界

### `packages/storage/src/service.ts`

- 使用 `getStorageProvider()` 获取 provider
- 调用 provider 的 `uploadFile` 和 `deleteFile` 方法
- ✅ 不依赖浏览器专用 API

### `apps/web/src/storage/client.ts`

- 使用 `fetch` 调用 API route `/api/storage/upload`
- 只 import type `UploadFileResult` from `@repo/storage`
- ✅ 不直接 import server storage provider
- ✅ 安全用于浏览器环境

---

## 11. Analytics Client/Server 边界

### `packages/analytics/src/client.ts`

- 只检查 `typeof window` 和 `process.env.NODE_ENV`
- ✅ 不 import `server.ts`
- ✅ 不使用 Node-only SDK
- ✅ 浏览器安全

### `packages/analytics/src/server.ts`

- 可以读取 `process.env.POSTHOG_API_KEY`
- ✅ 不依赖 React 或 Next runtime
- ✅ 所有参数通过函数参数传入

---

## 12. Mail/Newsletter 边界

### `@repo/mail`

- 允许使用 React Email (React + React Email SDK)
- ✅ 不依赖 `@repo/newsletter`
- ✅ 不依赖 auth/db/payment/credits

### `@repo/newsletter`

- ✅ 不依赖 `@repo/mail`
- ✅ 不依赖 auth/db/payment/credits

---

## 13. Payment/Credits 边界

### `@repo/payment`

- ✅ 不依赖 `@repo/credits`
- ✅ 不依赖 `@repo/auth`
- ✅ 不依赖 mail/newsletter/notification/storage/analytics

### `@repo/credits`

- ✅ 不依赖 `@repo/payment`
- ✅ 不依赖 `@repo/auth`
- ✅ 不依赖 mail/newsletter/notification/storage/analytics

---

## 14. Notification 边界

### `@repo/notification`

- ✅ 只依赖 `@repo/config`
- ✅ 不被其他业务包直接依赖
- ✅ 通过 apps/web shim 注入 app 层配置

---

## 15. Generated/Reference 文件

### `packages/db/src/auth.schema.reference.ts`

**文件状态确认**：

| 检查项 | 状态 |
|--------|------|
| 文件是否存在 | ✅ 存在 (`packages/db/src/auth.schema.reference.ts`) |
| 是否被 git tracked | ✅ 未被 tracked (`git ls-files` 返回空) |
| 是否被 `.gitignore` 忽略 | ✅ 已在 `.gitignore` 中声明 |
| 是否被 package exports 暴露 | ✅ 未暴露 (exports 只有 `./auth-schema` 指向 `auth.schema.ts`) |
| 是否被正式代码 import | ✅ 未被 import (仅在文档/注释中提及) |
| 是否被 drizzle.config 读取 | ✅ 未读取 (drizzle.config 只读取 `./src/schema.ts`) |
| 是否被 typecheck/lint/format 扫描 | ⚠️ 是 (biome 会扫描，但不影响正式 build) |

**结论**：
- 该文件是 better-auth CLI 生成的参考文件
- 作为本地参考存在，不会被提交到 git
- 不参与正式 schema、exports 或 drizzle 迁移
- 会被 biome 扫描并格式化，但不影响正式 build

---

## 16. README.md / AGENTS.md / CLAUDE.md 同步

所有文档都已同步到当前 packages 列表：

| 文档 | 状态 |
|------|------|
| README.md | ✅ 包含所有 11 个 packages |
| AGENTS.md | ✅ 包含所有 11 个 packages |
| CLAUDE.md | ✅ 包含所有 11 个 packages |

---

## 17. docs/migration 完整性

已存在的 migration 文档：

| Phase | 文档 | 状态 |
|-------|------|------|
| Phase 1 | MONOREPO_PHASE_1.md | ✅ |
| Phase 2.1 | MONOREPO_PHASE_2.1.md | ✅ |
| Phase 2.2 | MONOREPO_PHASE_2_2_SHARED.md | ✅ |
| Phase 2.3 | MONOREPO_PHASE_2_3_DB.md | ✅ |
| Phase 2.4 | MONOREPO_PHASE_2_4_AUTH.md | ✅ |
| Phase 2.4 Fix | MONOREPO_PHASE_2_4_FIX_DB_SHIM.md | ✅ |
| Phase 2.5 | MONOREPO_PHASE_2_5_PAYMENT.md | ✅ |
| Phase 2.6 | MONOREPO_PHASE_2_6_CREDITS.md | ✅ |
| Phase 2.7 | MONOREPO_PHASE_2_7_MAIL.md | ✅ |
| Phase 2.8 | MONOREPO_PHASE_2_8_NEWSLETTER.md | ✅ |
| Phase 2.9 | MONOREPO_PHASE_2_9_NOTIFICATION.md | ✅ |
| Phase 2.10 | MONOREPO_PHASE_2_10_STORAGE.md | ✅ |
| Phase 2.11 | MONOREPO_PHASE_2_11_ANALYTICS.md | ✅ |
| Phase 2.12 | MONOREPO_PHASE_2_12_AUDIT.md (本文档) | ✅ |

---

## 18. CI/Workflow 适配

### `.github/workflows/distribute-credits.yml`

```yaml
- name: Install dependencies
  run: pnpm install --frozen-lockfile

- name: Run credit distribution
  run: pnpm --filter @repo/web distribute-credits
```

✅ 使用 monorepo 命令格式
✅ 使用 `--filter` 指定 package

---

## 19. Vercel/Docker 配置

### Vercel

推荐配置：
- Root Directory: `apps/web`
- Install Command: `pnpm install --frozen-lockfile`
- Build Command: `pnpm build`

### Dockerfile

```dockerfile
COPY package.json pnpm-lock.yaml* pnpm-workspace.yaml turbo.json ./
COPY apps/web/package.json ./apps/web/package.json
COPY apps/web/source.config.ts ./apps/web/source.config.ts
COPY apps/web/content ./apps/web/content
RUN npm install -g pnpm && pnpm i --frozen-lockfile

RUN npm install -g pnpm \
  && DOCKER_BUILD=true pnpm --filter @repo/web build
```

✅ 使用 monorepo 结构
✅ 设置 `DOCKER_BUILD=true` 启用 standalone
✅ `outputFileTracingRoot` 已在 `next.config.ts` 中配置

---

## 20. 验收命令执行结果

| 命令 | 结果 |
|------|------|
| `pnpm install` | ✅ 通过 |
| `pnpm check:db-shims` | ✅ 通过 |
| `pnpm --filter @repo/* typecheck` | ✅ 全部通过 |
| `pnpm --filter @repo/* lint` | ✅ 通过 (有 4 个 warnings) |
| `pnpm --filter @repo/* format` | ✅ 通过 |
| `pnpm typecheck` | ✅ 通过 |
| `pnpm lint` | ✅ 通过 |
| `pnpm format` | ✅ 通过 |
| `pnpm --filter @repo/db db:generate` | ✅ 通过 (无变更) |
| `pnpm --filter @repo/web db:generate` | ✅ 通过 (代理到 @repo/db，无变更) |
| `pnpm --filter @repo/web build` | ✅ 通过 |
| `pnpm build` | ✅ 通过 |

---

## 21. 自动修复的问题

1. **格式化 `auth.schema.reference.ts`**
   - 该文件存在于 `packages/db/src/auth.schema.reference.ts`
   - 文件使用双引号，与项目单引号规范不一致
   - 执行 `pnpm --filter @repo/db format` 修复格式问题
   - 该文件已在 `.gitignore` 中，不会被 git tracked
   - 不影响正式 build 或 schema

---

## 22. 需要后续处理的问题

### 22.1 Lint Warnings (低优先级)

`@repo/credits` 中有 4 个 `useOptionalChain` warnings：

- `src/distribute.ts:356` - 可使用 optional chain 简化
- `src/distribute.ts:502` - 可使用 optional chain 简化
- `src/ledger.ts:481` - 可使用 optional chain 简化
- `src/ledger.ts:533` - 可使用 optional chain 简化

这些是代码风格建议，不影响功能，可在后续代码清理时处理。

### 22.2 credits shim 缺失 index.ts

`apps/web/src/credits/` 目录没有 `index.ts` shim 文件，但存在以下文件：
- `client.ts`
- `credits.ts`
- `distribute.ts`
- `server.ts`
- `types.ts`

**建议**：后续可考虑添加 `index.ts` shim 统一 re-export，或保持现状（因为 credits 的 app 层逻辑较复杂，不适合纯 shim）。

---

## 23. Phase 2.12 成功标准检查

| 标准 | 状态 |
|------|------|
| 所有 packages 有完整 scripts | ✅ |
| 所有 packages 单独 typecheck/lint/format 通过 | ✅ |
| 所有 package exports 有效 | ✅ |
| 没有明显未使用 dependency | ✅ |
| 没有 `@/` import 泄漏进 packages | ✅ |
| 没有 `apps/web` import 泄漏进 packages | ✅ |
| 没有不合理循环依赖 | ✅ |
| apps/web transpilePackages 完整 | ✅ |
| apps/web dependencies 完整 | ✅ |
| DB shims 仍有效 | ✅ |
| auth schema reference 不参与正式 schema | ✅ |
| analytics client/server 边界清晰 | ✅ |
| storage server provider 不进 client bundle | ✅ |
| mail/newsletter 边界清晰 | ✅ |
| payment/credits 不互相依赖 | ✅ |
| notification 不被业务包直接依赖 | ✅ |
| README.md、AGENTS.md、CLAUDE.md、docs/migration 已同步 | ✅ |
| `pnpm typecheck/lint/format/build` 全部通过 | ✅ |
| `pnpm --filter @repo/web build` 通过 | ✅ |
| `pnpm --filter @repo/web db:generate` 通过 | ✅ |
| 没有创建新 app | ✅ |
| 没有抽 UI | ✅ |
| 没有业务行为变更 | ✅ |

---

## 24. 结论与建议

### ✅ Phase 2.12 审计通过

所有 package 边界、依赖关系、shim 结构、文档同步均符合预期。monorepo 结构健康，可以进入下一阶段。

### 建议后续方向

1. **Phase 3: 拆分 apps**
   - 可考虑拆分 `apps/docs`（文档站）
   - 可考虑拆分 `apps/landing`（落地页）
   - 可考虑拆分 `apps/admin`（管理后台）

2. **packages/ui 抽取**
   - 当前 UI 组件仍在 `apps/web/src/components`
   - 如需跨 app 共享，可抽取 `packages/ui`
   - 建议在 Phase 3 之后再评估是否需要

3. **Lint Warnings 清理**
   - 可在后续代码清理时处理 `@repo/credits` 中的 optional chain warnings

---

**审计完成时间**: 2026-05-14
**审计人**: Claude (AI Agent)

---

## 25. Phase 2.12 Fix 补充验收

### 25.1 web db:generate wrapper 验收

```bash
pnpm --filter @repo/web db:generate
```

结果：
- ✅ 通过
- ✅ 正确代理到 `pnpm --filter @repo/db db:generate`
- ✅ 无新 migration 产生
- ✅ 输出 "No schema changes, nothing to migrate"

### 25.2 auth.schema.reference.ts 详细状态

| 检查项 | 结果 |
|--------|------|
| 文件是否存在 | ✅ 存在 |
| `git ls-files` 是否 tracked | ✅ 未 tracked (返回空) |
| `.gitignore` 是否忽略 | ✅ 已声明 `packages/db/src/auth.schema.reference.ts` |
| package exports 是否暴露 | ✅ 未暴露 |
| 正式代码是否 import | ✅ 未 import |
| drizzle.config 是否读取 | ✅ 未读取 |
| typecheck/lint/format 是否扫描 | ⚠️ 是 (biome 扫描，但不影响正式) |

**结论**：该文件状态正确，不阻塞 Phase 3。
