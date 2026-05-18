# AI Chat v0.2 Open Questions

状态只能使用：已确认 / 待确认。

## 1. assistant-ui 具体使用哪个版本？

状态：待确认。

默认建议：使用 `@assistant-ui/react@^0.14.5` 和
`@assistant-ui/react-ai-sdk@^1.3.26`，安装前重新检查官方文档和 npm registry。

阻塞范围：TASK-003、TASK-011、TASK-015。

需要用户确认的时机：执行 dependency install 前。

## 2. Vercel AI SDK 使用 v6 还是其他版本？

状态：待确认。

默认建议：使用 AI SDK v6，当前 assistant-ui 官方 runtime docs 对新项目推荐
`ai@^6` + `@ai-sdk/react@^3`。

阻塞范围：TASK-003、TASK-008、TASK-009、TASK-010、TASK-011。

需要用户确认的时机：执行 dependency install 前。

## 3. Mastra 是否进入 v0.2 第一版 runtime，还是只保留 integration skeleton？

状态：待确认。

默认建议：第一版 simple chat 不安装/接入 Mastra runtime，只保留 integration plan；
等出现真实 agent/tool/workflow orchestration 需求后再安装 `@mastra/core`。

阻塞范围：TASK-003、TASK-007、TASK-008。

需要用户确认的时机：TASK-003 dependency plan 和 TASK-007 runtime skeleton 前。

## 4. 首个 provider 是否只支持 OpenAI？

状态：待确认。

默认建议：首个 provider 只支持 OpenAI direct provider path，避免同时引入多 provider
policy。

阻塞范围：TASK-003、TASK-006、TASK-007、TASK-013。

需要用户确认的时机：dependency install 和 seed provider/model 前。

## 5. provider SDK 使用 `@ai-sdk/openai` 还是其他 provider？

状态：待确认。

默认建议：使用 `@ai-sdk/openai@^3.0.64` 作为 first provider SDK。

阻塞范围：TASK-003、TASK-007、TASK-008、TASK-013。

需要用户确认的时机：dependency install 前。

## 6. 是否需要同步支持 OpenRouter？

状态：待确认。

默认建议：v0.2 不同步支持 OpenRouter，避免扩大 provider key、model policy 和 routing
范围。

阻塞范围：若用户要求 OpenRouter，则阻塞 TASK-003、TASK-006、TASK-007。

需要用户确认的时机：provider selection 确认时。

## 7. DB migration 使用 generate / push / manual SQL？

状态：待确认。

默认建议：使用 `pnpm --filter @repo/db db:generate` 生成 migration，禁止 db push，
执行命令前必须确认影响。

阻塞范围：TASK-005。

需要用户确认的时机：TASK-004 schema design 完成后。

## 8. AI schema 是否一次性创建 9 张表？

状态：待确认。

默认建议：一次性创建 v0.2 frozen minimal 9 张表，避免 thread/message/usage
跨 migration 不一致；不加入 v0.3+ tables。

阻塞范围：TASK-004、TASK-005。

需要用户确认的时机：schema design review。

## 9. user default model 是否需要 UI？

状态：待确认。

默认建议：v0.2 可以先支持数据和 runtime reference，不强制做 settings UI。

阻塞范围：TASK-013。

需要用户确认的时机：model selector TASK 前。

## 10. per-chat model selection 是 UI 实现，还是 route 参数先支持？

状态：待确认。

默认建议：先让 route/runtime 支持 per-thread/per-chat model id，UI selector 可以作为
TASK-013 的最小实现或后续补充。

阻塞范围：TASK-011、TASK-013。

需要用户确认的时机：assistant-ui component TASK 前。

## 11. 是否需要 admin provider/model 管理？

状态：待确认。

默认建议：v0.2 不做 admin provider/model UI，只 seed baseline provider/model。

阻塞范围：不阻塞 v0.2 first chat；若要求 admin UI，则扩大范围并需要新 scope。

需要用户确认的时机：TASK-006 seed 前。

## 12. provider/model seed 放在哪里？

状态：待确认。

默认建议：放在现有 repo seed/script 模式中，优先跟随 `packages/db` 所有权和现有
script conventions，不创建新 app。

阻塞范围：TASK-006。

需要用户确认的时机：TASK-006 前。

## 13. usage cost estimate 使用静态价格，还是 provider reported usage？

状态：待确认。

默认建议：tokens 使用 provider/AI SDK reported usage；cost estimate 使用 seed model
静态价格计算，无法确认时允许 null，不默认 0。

阻塞范围：TASK-010。

需要用户确认的时机：usage audit service 前。

## 14. 是否需要 Playwright 覆盖首次 chat flow？

状态：待确认。

默认建议：v0.2 最终验收建议增加或运行最小首次 chat flow E2E；如果当前 repo 没有
Playwright setup，先记录为 optional，不新增测试框架除非确认。

阻塞范围：TASK-016；若无测试框架，不阻塞代码合并但必须记录风险。

需要用户确认的时机：TASK-016 final validation 前。

## 15. 是否需要保留 mock provider 方便本地开发？

状态：待确认。

默认建议：可以保留 app-local mock provider skeleton，但不得绕过 auth，也不得进入
`packages/ai` runtime；如果需要 mock streaming，必须明确仅限 local/test。

阻塞范围：TASK-007、TASK-008、TASK-016。

需要用户确认的时机：runtime skeleton 前。

## 16. 是否需要在 `.env.example` 增加 OpenAI key？

状态：待确认。

默认建议：如果使用 `@ai-sdk/openai` direct provider，必须通过 `@repo/env/server` 和
根 `env.example` 增加 server-only key reference；不能修改 `.env`。

阻塞范围：TASK-007、TASK-008。

需要用户确认的时机：provider SDK 初始化前。

## 17. 是否允许修改 root package.json？

状态：待确认。

默认建议：v0.2 first chat dependencies 应只进入 `apps/web/package.json`；root
`package.json` 不应修改，除非新增 root script/check 且另行确认。

阻塞范围：TASK-003。

需要用户确认的时机：dependency install plan 前。

## 18. 是否允许修改 pnpm-lock.yaml？

状态：待确认。

默认建议：依赖安装经确认后允许由 pnpm 更新 `pnpm-lock.yaml`；本规划任务不允许修改。

阻塞范围：TASK-003 后的实际 install。

需要用户确认的时机：执行 install command 前。

## 19. 是否允许新增 integration test？

状态：待确认。

默认建议：只在已有 test runner/pattern 清楚时新增 focused integration test；否则先用
typecheck/lint/build 和手动/浏览器验证记录。

阻塞范围：TASK-008、TASK-009、TASK-010、TASK-016。

需要用户确认的时机：第一个需要新增测试文件的 TASK 前。

## 20. Vercel 部署失败是否阻塞 v0.2？

状态：待确认。

默认建议：本期默认不考虑 Vercel deployment failure as a local v0.2 blocker；如果
失败来自 env/schema/build，则必须记录并修复 build blocker。

阻塞范围：TASK-016。

需要用户确认的时机：final validation 或 deployment verification 前。

## 21. 是否使用 AI Gateway 而不是 direct OpenAI provider？

状态：待确认。

默认建议：v0.2 使用 direct OpenAI provider，AI Gateway 作为后续 provider strategy
评估项；如果改用 Gateway，需要重新确认 env、provider/model seed 和 dependency plan。

阻塞范围：TASK-003、TASK-006、TASK-007、TASK-008。

需要用户确认的时机：provider strategy 确认时。

## 22. assistant-ui persistence 使用 ThreadHistoryAdapter 还是完全 server-side route persistence？

状态：待确认。

默认建议：v0.2 以 server-side persistence service 为事实来源；assistant-ui
history adapter 可作为 thread reload support，但不让前端成为 persistence owner。

阻塞范围：TASK-009、TASK-011。

需要用户确认的时机：chat persistence service 前。

