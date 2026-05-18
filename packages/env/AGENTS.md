# `@repo/env` Package 规则

## Package 定位

`packages/env` 是全仓环境变量验证包，负责 server/client/shared env schema 和 workspace env loading。

## Owns

- `server.ts` server-only env schema。
- `client.ts` `NEXT_PUBLIC_*` client env schema。
- `shared.ts` shared env schema。
- `load.ts` workspace `.env*` 加载逻辑。
- env schema 与根 `env.example` 的一致性。

## Does not own

- 业务配置。
- Provider client 初始化。
- App route、UI、server action。
- 任何 `@repo/*` 领域包逻辑。

## Allowed dependencies

- `@t3-oss/env-core`。
- `@t3-oss/env-nextjs`。
- `zod`。
- Node 内置模块用于 env loading。

## Forbidden dependencies

- 任何 `@repo/*` 包。
- `apps/web` 或 `@/` alias。
- React、Next route runtime、DB、provider SDK。

## Exports rule

- 公开 exports：`.`、`./server`、`./client`、`./shared`、`./load`。
- client 只能包含 `NEXT_PUBLIC_*`。
- server 可以包含 server-only secrets。
- 不允许 client component import `@repo/env/server`。

## Implementation rule

- 新 env 必须同步 schema + `env.example` + `pnpm check:env`。
- 不要直接在业务代码读取 `process.env`，允许例外仅限 `NODE_ENV`、`SKIP_ENV_VALIDATION` 和平台变量。
- AI provider key 必须走 server env，不允许 client 泄露。
- 不创建 `core/*` 子目录，不拆 auth/payment/storage/analytics 子模块。
- 根目录 `env.example` 是唯一完整 env 参考，不创建 `.env.example`。

## Testing / validation command

```bash
pnpm --filter @repo/env typecheck
pnpm --filter @repo/env lint
pnpm check:env
```

## Common mistakes

- 把 server secret 加到 `client.ts`。
- 新增 env 后忘记更新 `env.example`。
- 在业务代码中直接读 `process.env.OPENAI_API_KEY`。
- 让 env 包依赖 config 或其他 `@repo/*` 包。
