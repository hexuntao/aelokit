# `@repo/storage` Package 规则

## Package 定位

`packages/storage` 是对象存储领域包，提供 S3/R2 provider、provider registry、upload/delete service 和 storage config。

## Owns

- Storage types。
- Storage provider interface。
- S3/R2-compatible provider。
- Upload/delete service。
- Storage provider config。
- AI attachments / knowledge source files 可复用的 file storage 能力。

## Does not own

- App route auth。
- Browser upload UI。
- Direct upload route handler。
- AI message metadata。
- DB schema。
- Payment/credits/auth workflow。

## Allowed dependencies

- `@repo/config`。
- `@repo/env`。
- `s3mini`。

## Forbidden dependencies

- `apps/web` 或 `@/` alias。
- `@repo/auth`、`@repo/payment`、`@repo/credits`、`@repo/mail`、`@repo/newsletter`、`@repo/notification`、`@repo/db`。
- next-intl、React、Next runtime、UI。

## Exports rule

- 公开 exports：`.`、`./types`、`./provider`、`./service`、`./registry`、`./providers`、`./config`。
- 不允许 deep import `src/providers/*` 或 `src/config/*`。
- 新 provider 必须通过 `./providers` 和 registry 暴露。

## Implementation rule

- 存储文件，不负责 app route auth。
- AI attachments / knowledge source files 存文件；AI message metadata 归 DB。
- 浏览器 upload UI 和 `/api/storage/upload` route 留在 app。
- 不在 storage 包读取 request session。

## Testing / validation command

```bash
pnpm --filter @repo/storage typecheck
pnpm --filter @repo/storage lint
```

## Common mistakes

- 把 upload form 或 drag/drop UI 放进 storage 包。
- 在 storage service 中检查 app session。
- 把 AI message metadata 写进 object storage config。
