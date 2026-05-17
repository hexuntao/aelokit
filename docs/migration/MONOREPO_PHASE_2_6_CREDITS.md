# Phase 2.6：抽取 packages/credits

## 概述

本阶段创建了 `packages/credits`，将积分领域的类型、余额查询、积分增加/扣减、订阅赠送积分、终身月度积分、积分流水等核心业务逻辑抽成共享包。

## 创建的文件

### packages/credits/

```
packages/credits/
├── package.json
├── tsconfig.json
└── src/
    ├── index.ts
    ├── types.ts
    ├── service.ts
    ├── ledger.ts
    └── distribute.ts
```

### package.json

```json
{
  "name": "@repo/credits",
  "version": "0.0.0",
  "private": true,
  "type": "module",
  "sideEffects": false,
  "exports": {
    ".": "./src/index.ts",
    "./types": "./src/types.ts",
    "./service": "./src/service.ts",
    "./ledger": "./src/ledger.ts",
    "./distribute": "./src/distribute.ts"
  },
  "types": "./src/index.ts",
  "scripts": {
    "lint": "biome check .",
    "format": "biome format --write .",
    "typecheck": "tsc --noEmit"
  },
  "dependencies": {
    "@repo/config": "workspace:*",
    "@repo/db": "workspace:*",
    "date-fns": "^4.1.0",
    "drizzle-orm": "^0.39.3"
  },
  "devDependencies": {
    "@types/node": "^25.0.10",
    "typescript": "^5.9.3"
  }
}
```

## 迁移的内容

### types.ts

- `CREDIT_TRANSACTION_TYPE` 枚举
- `CreditTransaction` 接口
- Re-export `CreditPackage`、`CreditPackagePrice` from `@repo/config`

### service.ts

- `getAllCreditPackages()` - 获取所有积分包
- `getCreditPackageById()` - 根据 ID 获取积分包

### ledger.ts

- `getUserCredits()` - 获取用户积分余额
- `updateUserCredits()` - 更新用户积分余额
- `saveCreditTransaction()` - 写入积分流水记录
- `addCredits()` - 增加积分（注册赠送、月度、购买等）
- `hasEnoughCredits()` - 检查积分是否足够
- `consumeCredits()` - 消费积分（FIFO，按过期时间）
- `processExpiredCredits()` - 处理过期积分（已废弃，见 distribute.ts）
- `canAddCreditsByType()` - 检查是否可以添加特定类型的积分
- `addRegisterGiftCredits()` - 添加注册赠送积分
- `addMonthlyFreeCredits()` - 添加免费月度积分
- `addSubscriptionCredits()` - 添加订阅积分
- `addLifetimeMonthlyCredits()` - 添加终身月度积分

### distribute.ts

- `distributeCreditsToAllUsers()` - 分发积分给所有用户（cron job 调用）
- `batchAddMonthlyFreeCredits()` - 批量添加免费月度积分
- `batchAddLifetimeMonthlyCredits()` - 批量添加终身月度积分
- `batchAddYearlyUsersMonthlyCredits()` - 批量添加年度订阅用户的月度积分
- `batchProcessExpiredCredits()` - 批量处理过期积分
- `batchProcessExpiredCreditsForUsers()` - 批量处理指定用户的过期积分

## apps/web 兼容 shim

以下文件改为 re-export 自 `@repo/credits`：

- `apps/web/src/credits/types.ts` → `export * from '@repo/credits/types'`
- `apps/web/src/credits/server.ts` → `export * from '@repo/credits/service'`
- `apps/web/src/credits/credits.ts` → `export * from '@repo/credits/ledger'`
- `apps/web/src/credits/distribute.ts` → `export * from '@repo/credits/distribute'`

## 保留在 apps/web 的内容

以下内容仍保留在 `apps/web`：

- `apps/web/src/credits/client.ts` - 依赖 `useTranslations` from next-intl
- `apps/web/src/config/credits-config.tsx` - React hook 使用 next-intl
- `apps/web/src/actions/*credit*` - Server Actions
- `apps/web/src/actions/create-credit-checkout-session.ts`
- `apps/web/src/app/[locale]/(protected)/settings/credits/` - UI 页面
- `apps/web/src/components/settings/credits/` - UI 组件

## 依赖关系

### @repo/credits 依赖

- `@repo/config` - 配置和类型
- `@repo/db` - 数据库层
- `date-fns` - 日期处理
- `drizzle-orm` - ORM

### @repo/credits 不依赖

- `@repo/payment` - 支付包
- `@repo/auth` - 认证包
- `next-intl` - 国际化
- `react` - React
- Next.js runtime

### @repo/payment 与 @repo/credits 边界

- `@repo/payment` 不依赖 `@repo/credits`
- `@repo/credits` 不依赖 `@repo/payment`
- `apps/web` 负责在 payment callbacks 中注入 credits 函数

## 配置更新

### apps/web/package.json

添加依赖：

```json
{
  "dependencies": {
    "@repo/credits": "workspace:*"
  }
}
```

### apps/web/next.config.ts

添加 transpilePackages：

```ts
transpilePackages: [
  '@repo/config',
  '@repo/shared',
  '@repo/db',
  '@repo/auth',
  '@repo/payment',
  '@repo/credits'
]
```

## @repo/config 更新

为支持 credits 包，在 `@repo/config` 中添加了 price-plan helpers：

### packages/config/src/price-plan.ts

- `getAllPricePlans()` - 获取所有价格计划
- `findPlanByPlanId()` - 根据 planId 查找计划
- `findPlanByPriceId()` - 根据 priceId 查找计划
- `findPriceInPlan()` - 在计划中查找价格

### apps/web/src/lib/price-plan.ts

改为 shim：

```ts
export {
  getAllPricePlans,
  findPlanByPlanId,
  findPlanByPriceId,
  findPriceInPlan,
} from '@repo/config';
```

## 验证命令

```bash
# Credits 包命令
pnpm --filter @repo/credits typecheck
pnpm --filter @repo/credits lint
pnpm --filter @repo/credits format

# 边界检查
pnpm check:db-shims

# 全局命令
pnpm typecheck
pnpm lint
pnpm format
pnpm build

# Web 验收
pnpm --filter @repo/web build
pnpm --filter @repo/web db:generate
```

## 污染检查结果

✅ 无 `@/` import
✅ 无 `apps/web` import
✅ 无 next-intl import
✅ 无 React/UI 依赖
✅ 无 Next runtime 依赖
✅ 无 better-auth / @repo/auth import
✅ 无 @repo/payment import
✅ 无 Stripe/Creem SDK import

## 循环依赖检查结果

✅ `packages/payment/package.json` 不依赖 `@repo/credits`
✅ `packages/credits/package.json` 不依赖 `@repo/payment`

## 成功标准

- [x] `@repo/credits` 已创建
- [x] `@repo/credits` 有自己的 `lint/format/typecheck` scripts
- [x] `@repo/credits` 自己能 typecheck
- [x] `@repo/credits` 自己能 lint
- [x] `@repo/credits` 自己能 format
- [x] `apps/web build` 通过
- [x] `pnpm build` 通过
- [x] `pnpm typecheck/lint/format` 通过
- [x] `check:db-shims` 通过
- [x] 原始 credits 注释完整保留
- [x] credit checkout action 仍在 apps/web
- [x] payment webhook route handlers 仍在 apps/web
- [x] credits UI 仍在 apps/web
- [x] `packages/credits` 不依赖 apps/web
- [x] `packages/credits` 没有 `@/` import
- [x] `packages/credits` 没有 Next runtime 依赖
- [x] `packages/credits` 不依赖 `@repo/payment`
- [x] `packages/payment` 不依赖 `@repo/credits`
- [x] 没有循环依赖
- [x] 没有抽 mail/storage/newsletter/notification/ui
- [x] 没有创建新 app
- [x] README.md、AGENTS.md、CLAUDE.md 已同步更新

## 下一步建议

Phase 2.7 可以考虑：

1. 抽取 `packages/notification` - 通知领域包
2. 抽取 `packages/storage` - 存储领域包
3. 抽取 `packages/newsletter` - 订阅通讯领域包
4. 抽取 `packages/mail` - 邮件领域包

或者开始拆分应用：

1. `apps/admin` - 管理后台
2. `apps/landing` - 落地页
3. `apps/docs` - 文档站
