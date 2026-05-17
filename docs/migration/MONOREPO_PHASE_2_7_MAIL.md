# Phase 2.7：抽取 packages/mail

## 概述

本阶段创建了 `packages/mail`，将事务邮件领域能力抽成共享包。

## 创建的文件

### packages/mail/

```
packages/mail/
├── package.json
├── tsconfig.json
└── src/
    ├── index.ts           # 主导出
    ├── types.ts           # 邮件类型定义
    ├── render.ts          # 邮件渲染 helper
    ├── provider.ts        # Provider 工厂
    ├── resend.ts          # Resend provider 实现
    ├── components/
    │   ├── index.ts
    │   ├── email-button.tsx
    │   └── email-layout.tsx
    └── templates/
        ├── index.ts
        ├── verify-email.tsx
        ├── forgot-password.tsx
        ├── contact-message.tsx
        └── subscribe-newsletter.tsx
```

## @repo/mail 职责

负责：
- 邮件类型定义（`types.ts`）
- 邮件 provider interface
- Resend provider 实现
- 邮件渲染 helper（`renderEmailHtml`、`toPlainText`）
- 邮件模板（React Email 组件）
- 邮件组件（EmailButton、EmailLayout）

不负责：
- newsletter 订阅服务
- notification 服务
- auth session 获取
- Server Actions
- App Router route handlers
- React 页面 UI
- next-intl 页面翻译
- payment provider
- credits ledger
- storage
- analytics

## 依赖关系

`@repo/mail` 允许依赖：
- `@repo/config`
- `@repo/shared`
- `react`
- `@react-email/components`
- `resend`
- `use-intl`（仅用于 `createTranslator`）

`@repo/mail` 不允许依赖：
- `@repo/auth`
- `@repo/payment`
- `@repo/credits`
- `@repo/db`
- `next`
- `next-intl`（完整包）
- `better-auth`
- `stripe`
- `creem`
- `drizzle-orm`

## 类型设计

`@repo/mail` 使用 generic 类型：

```typescript
export type Locale = string;
export type Messages = Record<string, any>;
```

具体类型由 app 层提供，通过 `BaseEmailProps` 传入模板。

## apps/web shim 结构

`apps/web/src/mail/` 是兼容 shim：

- `index.ts` - 组合 `@repo/mail` 与 app 层消息加载
- `types.ts` - re-export 并定义 `EmailTemplates` registry
- `provider/resend.ts` - 包装 `@repo/mail` 的 ResendProvider，添加 template 渲染
- `components/*` - re-export 自 `@repo/mail/components`
- `templates/*` - re-export 自 `@repo/mail/templates` 并添加 PreviewProps

## Email Preview Script

email preview script 保持不变：

```json
{
  "email": "email dev --dir src/mail/templates --port 3333"
}
```

因为 `apps/web/src/mail/templates/*` 包含 PreviewProps 配置。

## Auth 与 Mail 的连接

Auth 邮件发送通过 `apps/web/src/lib/auth.ts` 中的 `authCallbacks` 实现：

```typescript
const authCallbacks: AuthAppCallbacks = {
  sendResetPassword: async (user, url, request) => {
    await sendEmail({
      to: user.email,
      template: 'forgotPassword',
      context: { url, name: user.name },
      locale,
    });
  },
  sendVerificationEmail: async (user, url, token, request) => {
    await sendEmail({
      to: user.email,
      template: 'verifyEmail',
      context: { url, name: user.name },
      locale,
    });
  },
};
```

`@repo/auth` 不依赖 `@repo/mail`，邮件发送由 app 层组合。

## 验证命令

```bash
pnpm --filter @repo/mail typecheck
pnpm --filter @repo/mail lint
pnpm --filter @repo/mail format
pnpm check:db-shims
pnpm typecheck
pnpm lint
pnpm build
```

## 污染检查结果

- 无 `@/` import
- 无 `apps/web` 引用
- 无 next-intl 完整包依赖（仅 `use-intl/core`）
- 无 Next runtime 依赖
- 无 better-auth / @repo/auth 依赖
- 无 payment/credits 依赖
- 无 stripe/creem 依赖
- 无 drizzle/db 依赖
- 无 newsletter/notification 模块依赖

## 循环依赖检查

- `@repo/mail` 不依赖任何其他领域包
- 无循环依赖

## 保留在 apps/web 的内容

- `apps/web/src/actions/send-message.ts` - Server Action
- `apps/web/src/actions/subscribe-newsletter.ts` - Server Action
- `apps/web/src/lib/auth.ts` - Auth 回调组合层
- `apps/web/src/newsletter/` - Newsletter 领域
- `apps/web/src/notification/` - Notification 领域

## 下一步建议

Phase 2.8 可考虑：
- 抽取 `packages/newsletter`（newsletter 订阅服务）
- 抽取 `packages/notification`（Discord/Feishu 通知）
- 抽取 `packages/storage`（S3 存储服务）
