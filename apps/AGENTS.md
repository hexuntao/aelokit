# Apps 目录规则

本文件适用于 `apps/*`。修改具体 app 前，还必须读取该 app 目录下更近的
`AGENTS.md`。

## 定位

- `apps/*` 是应用层，不是共享领域包。
- app 负责路由、页面组合、HTTP boundary、server actions、部署入口和 app-specific wiring。
- app 不拥有跨 app 共享领域模型；需要复用的逻辑应沉淀到合适的 `packages/*`。
- 当前只有 `apps/web` 是实际应用。

## App 间边界

- app 之间不得互相 import。
- 不允许从一个 app 的 `src` 中复制隐式依赖给另一个 app 使用。
- 如果多个 app 需要同一能力，先确认领域归属，再抽到已有 package 或经过确认的新 package。
- app 可以依赖 package；package 不允许反向依赖 app。

## 当前与未来 apps

- `apps/web` 当前承载完整 SaaS 单体应用。
- `apps/admin`、`apps/landing`、`apps/docs`、`apps/worker`、`apps/gateway`、`apps/studio` 只是未来规划。
- 未来 app 必须在独立任务中创建；不要为了文档、占位或“后面会用”提前创建目录。

## 新 App 创建前置条件

创建任何新 app 前必须具备：

- ownership doc。
- route ownership。
- env plan。
- auth/i18n/analytics plan。
- dependency plan。
- deployment plan。
- user confirmation。

## Common mistakes

- 为了复用页面组件让 app import 另一个 app。
- 在 app 内重写已经属于 `packages/*` 的领域逻辑。
- 没有 route/env/deploy plan 就创建未来 app。
- 把 worker/gateway/studio 当作普通 Next 页面目录提前塞进 `apps/web` 或 `apps/`。
