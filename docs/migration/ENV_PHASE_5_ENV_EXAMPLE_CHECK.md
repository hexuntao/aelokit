# Env Phase 5：Env Example 一致性检查

## 背景

项目使用 `env.example` 作为唯一的环境变量参考文件，不使用 `.env.example`。为确保 `packages/env` 中的 schema 与 `env.example` 保持一致，新增 `check:env` 脚本进行自动化检查。

## 为什么使用 `env.example`

1. **单一来源**：`env.example` 是项目唯一的环境变量参考文件，避免多文件混淆
2. **惯例遵循**：许多开源项目（如 Next.js 官方模板）使用 `env.example`
3. **工具兼容**：Vercel、Docker 等部署工具通常默认识别 `env.example`
4. **简洁明了**：没有前导点，在文件列表中更显眼

## 为什么不使用 `.env.example`

1. **避免混淆**：同时存在 `.env.example` 和 `env.example` 会造成困惑
2. **隐藏文件问题**：`.env.example` 作为隐藏文件容易被忽略
3. **一致性**：项目已确定使用 `env.example`，保持统一

## `check:env` 检查内容

脚本 `scripts/check-env-example.mjs` 执行以下检查：

### 必须通过的检查（失败则 exit 1）

1. **env.example 存在**：根目录必须有 `env.example` 文件
2. **.env.example 不存在**：根目录不能有 `.env.example` 文件
3. **无重复变量**：`env.example` 中不能有重复定义的变量
4. **schema 变量覆盖**：`packages/env/src/server.ts` 和 `client.ts` 中声明的所有变量都必须存在于 `env.example`
5. **NEXT_PUBLIC_ 前缀正确**：server schema 中的变量不能以 `NEXT_PUBLIC_` 开头

### 仅警告的检查（不阻止通过）

1. **env.example 多余变量**：`env.example` 中存在但 schema 中没有声明的变量（如预留的 provider 变量、`SKIP_ENV_VALIDATION` 等）

## CI 执行

CI workflow `.github/workflows/ci.yml` 在每次 push 和 PR 时执行：

```yaml
- name: Check env example
  run: pnpm check:env
```

位置在 `check:package-exports` 之后、`typecheck` 之前。

## 后续修改 env schema 的规则

1. **修改 schema 后必须同步 env.example**：
   - 在 `packages/env/src/server.ts` 或 `client.ts` 添加新变量后
   - 必须同时在 `env.example` 中添加对应条目
   - 运行 `pnpm check:env` 验证

2. **不允许创建 `.env.example`**：
   - 项目使用 `env.example`，不要创建 `.env.example`

3. **CI 会自动检查**：
   - 每次 PR 都会运行 `pnpm check:env`
   - 如果 schema 与 env.example 不一致，CI 会失败

4. **本地验证**：
   ```bash
   pnpm check:env
   ```

## 脚本实现

脚本使用简单的文本解析（正则匹配），不依赖 AST：

1. 解析 `env.example`：匹配 `^[A-Z0-9_]+=` 格式的变量定义
2. 解析 schema：匹配 `server: {...}` 和 `client: {...}` 块中的 `KEY_NAME:` 格式
3. 比较两个集合，输出差异

## 相关文件

- `scripts/check-env-example.mjs`：检查脚本
- `env.example`：环境变量参考文件
- `packages/env/src/server.ts`：服务端环境变量 schema
- `packages/env/src/client.ts`：客户端环境变量 schema
- `.github/workflows/ci.yml`：CI workflow

## 验收标准

- [x] `scripts/check-env-example.mjs` 已创建
- [x] `pnpm check:env` 命令可用
- [x] `env.example` 存在
- [x] `.env.example` 不存在
- [x] schema 与 env.example 一致
- [x] CI workflow 已加入 check:env
- [x] 文档已更新
