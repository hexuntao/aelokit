# Claude Code Rules for AeloKit

本文件是 Claude Code 的短入口。完整工程规则以 root `AGENTS.md` 为准。

## 读取顺序

1. 当前用户 prompt
2. root `AGENTS.md`
3. 目标路径附近的 `AGENTS.md`，如果存在
4. `docs/product/AELOKIT_AI_SAAS_PLATFORM_PRD.md`
5. 相关源码和 package.json

## 最高优先级

- 当前用户 prompt 定义本次任务 scope。
- PRD 定义产品北极星。
- AGENTS.md 定义工程边界。
- 已删除的旧 docs、旧 roadmap、旧版本文档不能作为当前需求。

## 禁止事项

- 不要恢复旧 docs 体系。
- 不要引用不存在的旧文档索引。
- 不要引用已删除的 agent rules 文档树。
- 不要提前拆 `apps/admin`、`apps/landing`、`apps/docs`、`apps/worker`、`apps/gateway`、`apps/studio`。
- 不要提前创建 `packages/design-system`、`packages/ui`、`packages/gateway`、`packages/worker` 等未来包。
- 不要绕过 env schema。
- 不要让 provider secret 进入 client。
- 不要让 package import app。
- 不要修改 DB schema/migration，除非用户明确要求。

## 常用验证

```bash
pnpm check:env
pnpm check:package-exports
pnpm check:db-shims
pnpm --filter @repo/web typecheck
pnpm --filter @repo/web lint
```
