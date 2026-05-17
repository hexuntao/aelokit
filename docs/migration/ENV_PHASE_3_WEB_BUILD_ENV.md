# Env Phase 3: Web App Build-time Env Integration

## 1. 本阶段目标

将 `@repo/env` 接入 `apps/web` 的 build-time validation，确保：

- `apps/web/package.json` 添加 `@repo/env` 依赖
- `apps/web/next.config.ts` 接入 `@repo/env/server`
- `apps/web/next.config.ts` 的 `transpilePackages` 包含 `@repo/env`、`@t3-oss/env-core`、`@t3-oss/env-nextjs`
- CI 支持 `SKIP_ENV_VALIDATION=true`
- Web build 和 full build 正常通过

本阶段**只做** Web app 构建期 env 校验接入，**不**大规模替换业务代码里的 `process.env`。

## 2. apps/web 如何接入 @repo/env

### 2.1 添加依赖

在 `apps/web/package.json` 的 `dependencies` 中添加：

```json
{
  "dependencies": {
    "@repo/env": "workspace:*"
  }
}
```

### 2.2 next.config.ts 接入

在 `apps/web/next.config.ts` 顶部添加：

```ts
import '@repo/env/server';
```

这会在 Next.js 配置加载时触发 server env validation。如果缺少必需的环境变量，build 会失败。

### 2.3 transpilePackages 更新

在 `transpilePackages` 数组中添加：

```ts
transpilePackages: [
  // ... 其他包
  '@repo/env',
  '@t3-oss/env-core',
  '@t3-oss/env-nextjs',
]
```

这确保 T3 Env 包能正确在 Next.js 中被转译。

## 3. 为什么只接入 build-time validation，不替换业务代码

### 3.1 增量迁移策略

- Phase 3 只确保 build 时 env 校验生效
- 业务代码中的 `process.env` 使用保持不变
- 后续 Phase 可以逐步替换为 `serverEnv`/`clientEnv`
- 避免一次性大规模改动带来的风险

### 3.2 边界清晰

- `next.config.ts` 是唯一接入点
- 业务代码暂不感知 `@repo/env`
- Client component 不会误 import server env

### 3.3 验证优先

- Build 失败 = env 配置错误
- 开发时立即发现问题
- 生产部署前保证 env 完整

## 4. SKIP_ENV_VALIDATION 的用途

### 4.1 何时使用

- CI/CD 环境（如 GitHub Actions）没有真实 secrets
- Docker build 阶段不需要验证 env
- 预构建检查（如 typecheck、lint）

### 4.2 如何使用

在 `env.example` 中：

```env
SKIP_ENV_VALIDATION=false
```

在 CI workflow 中设置环境变量：

```yaml
env:
  SKIP_ENV_VALIDATION: "true"
```

### 4.3 注意事项

- **不要**在生产环境使用
- **不要**在本地开发时使用
- 仅用于没有真实 secrets 的构建环境

## 5. CI 如何处理 env validation

当前项目没有 `.github/workflows/ci.yml`，如需添加 CI：

```yaml
jobs:
  build:
    runs-on: ubuntu-latest
    env:
      SKIP_ENV_VALIDATION: "true"
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v2
      - uses: actions/setup-node@v4
      - run: pnpm install --frozen-lockfile
      - run: pnpm build
```

## 6. env.example 是唯一完整 env 参考

- 根目录 `env.example` 包含所有环境变量
- 不使用 `.env.example`
- 不拆分 env.example
- 修改 env schema 后必须同步 env.example

## 7. 不使用 .env.example

- 根目录只有 `env.example`（无点前缀）
- `.env` 是本地实际使用的文件（不提交）
- `.env.example` 不应存在

## 8. 验收结果

### 8.1 修改的文件

- `apps/web/package.json`：添加 `@repo/env` 依赖
- `apps/web/next.config.ts`：
  - 顶部添加 `import '@repo/env/server'`
  - `transpilePackages` 添加 `@repo/env`、`@t3-oss/env-core`、`@t3-oss/env-nextjs`
- `turbo.json`：`globalEnv` 添加 `SKIP_ENV_VALIDATION`

### 8.2 验收命令结果

```bash
# @repo/env 存在
test -d packages/env && echo "OK"

# env.example 存在
test -f env.example && echo "OK"

# .env.example 不存在
test ! -f .env.example && echo "OK"

# @repo/env typecheck/lint/format 通过
pnpm --filter @repo/env typecheck
pnpm --filter @repo/env lint
pnpm --filter @repo/env format

# Web build 通过
pnpm --filter @repo/web build

# db:generate 不产生 migration
pnpm --filter @repo/web db:generate

# 边界检查通过
pnpm check:package-exports
pnpm check:db-shims

# Full build 通过
pnpm typecheck
pnpm lint
pnpm build
```

### 8.3 Client/Server import 检查

- 业务代码（`apps/web/src`）中没有 `@repo/env/server` import
- 业务代码中没有 `@repo/env/client` import
- Components 中没有 `@repo/env` import
- 只有 `next.config.ts` 可以 import `@repo/env/server`

## 9. 后续阶段

Phase 3 完成后，可以进入：

- **Env Phase 4**：逐步替换业务代码中的 `process.env` 为 `serverEnv`/`clientEnv`
- **Env Phase 5**：其他 packages 接入 `@repo/env`
- **Env Phase 6**：移除冗余 env 声明，统一 schema

## 10. 注意事项

- 不要让 client component import `@repo/env/server`
- 不要把 server secret 暴露给 client
- 不要跳过 typecheck/lint/build
- 不要创建 `.env.example`
- 不要拆分 `env.example`
