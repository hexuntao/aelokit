# AI Contracts Foundation Codex Prompt

下面的提示词用于后续 v0.1 编码实现。每次只复制并执行一个指定 TASK。

```txt
你正在 AeloKit repo 的 dev 分支执行 v0.1：AI Contracts + Data Model Foundation。

只执行我指定的单个 TASK。不要一次性完成所有 TASK。不要进入 v0.2/v0.3/v0.4/v0.5。

开始前必须读取：

- AGENTS.md
- packages/AGENTS.md
- docs/product/AELOKIT_AI_SAAS_PLATFORM_PRD.md
- docs/product/AI_CONTRACTS_FOUNDATION_ENTRYPOINT.md
- docs/product/AI_CONTRACTS_FOUNDATION_SCOPE_FREEZE.md
- docs/product/AI_CONTRACTS_FOUNDATION_ACCEPTANCE.md
- docs/product/AI_CONTRACTS_FOUNDATION_IMPLEMENTATION_PLAN.md
- docs/product/AI_CONTRACTS_FOUNDATION_OPEN_QUESTIONS.md

如果任务会修改 packages/ai，且 packages/ai/AGENTS.md 已存在，也必须读取：

- packages/ai/AGENTS.md

如果任务涉及 DB data model 文档或 schema 边界，也必须读取：

- packages/db/AGENTS.md

执行规则：

1. 只执行用户指定的单个 TASK。
2. 不允许一次性完成所有 TASK。
3. 每个 TASK 执行前必须输出 3-5 条实现计划。
4. 遵守 TASK 中的允许修改文件和禁止修改文件。
5. TASK-001 才允许创建 packages/ai。
6. 不允许创建 apps/web/src/app/api/ai/**。
7. 不允许创建 apps/web/src/ai/**。
8. 不允许创建 apps/web/src/components/ai/**。
9. 不允许创建 packages/db/src/ai.schema.ts。
10. 不允许生成 migration。
11. 不允许安装依赖，除非我明确确认。
12. 不允许修改 .env 或真实密钥。
13. 不允许运行 db generate / migrate / push。
14. 不允许实现真实 AI SDK runtime 调用。
15. 不允许创建真实 Mastra agent instance。
16. 不允许 provider SDK 初始化。
17. 不允许 DB query。
18. 不允许 React UI。
19. 不允许 assistant-ui。
20. 不允许 credits ledger mutation 或 credits charging。

代码质量规则：

后续实现代码必须是高质量生产级代码。
复杂逻辑、边界条件、权限判断、状态转换、AI runtime adapter、usage/cost 相关逻辑必须使用详细英文注释说明设计意图。
简单 getter、普通类型定义、显而易见的代码不需要注释噪音。

类型与边界规则：

- 代码命名、文件名、类型名、接口名使用英文。
- Public contracts 不使用无意义 any。
- 需要 unknown input 的地方必须显式表达 unknown boundary。
- packages/ai 不 import apps/web。
- packages/ai 不使用 @/ alias。
- packages/ai 不包含 React UI、Next route、cookies、headers、session lookup、DB schema、DB query。
- packages/ai 只包含 contracts、types、lightweight adapter type surface、errors、permissions、usage/cost types。
- 所有导出必须通过 package exports，不允许 deep import。
- 所有新增 package 依赖必须声明在自己的 package.json。

验证规则：

必须执行：

- pnpm --filter @repo/ai format
- pnpm --filter @repo/ai lint
- pnpm --filter @repo/ai typecheck
- pnpm check:package-exports
- pnpm typecheck

按需执行：

- pnpm build

不需要执行：

- test，除非本任务新增测试或已有相关测试脚本
- db generate / migrate / push

如果某个命令无法运行，必须说明：

- 失败命令
- 失败原因
- 是否已修复
- 是否阻塞
- 当前代码是否可提交
- 建议下一步

提交规则：

每个任务完成后，如果有文件变更，且本地 Git 环境允许提交，则必须提交。
commit message 使用 Conventional Commits：

<type>(<scope>): <summary>

允许 type：

feat / fix / docs / refactor / test / chore / build / ci

示例：

feat(ai): add provider and model contracts
docs(ai): freeze AI contracts foundation scope
chore(ai): configure package exports

阻塞时提交规则：

如果任务被阻塞：
- 已产生有价值且不破坏构建的文档/代码变更，可以提交，并在总结中说明 blocked 状态。
- 如果变更是半成品、破坏构建、或只是无效尝试，应先回滚无效变更，不要提交为正常完成任务。
- 如果沙箱环境不能提交，输出建议 commit message 和未提交原因。

完成后必须输出：

- 修改文件列表
- 实现摘要
- 验证命令和结果
- 是否满足验收标准
- 未完成事项
- git commit hash；如果不能提交 git，说明原因并给出建议 commit message
```
