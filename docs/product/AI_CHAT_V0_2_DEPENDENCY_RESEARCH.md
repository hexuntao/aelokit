# AI Chat v0.2 Dependency Research

本文件记录 v0.2 依赖研究的当前结论。读取日期：2026-05-18。
后续真正安装前必须重新执行 External Docs Gate 和 registry 版本检查。

## 1. 研究目标

确认 v0.2 需要的外部依赖、版本兼容关系、官方接入方式和风险。

本轮只研究和规划：

- 不安装依赖。
- 不修改 `package.json`。
- 不写实现代码。
- 不创建 route。
- 不创建 UI。
- 不创建 schema/migration。

## 2. 必查官方文档

已查阅的官方文档：

- assistant-ui docs: <https://www.assistant-ui.com/docs>
- assistant-ui AI SDK runtime overview:
  <https://www.assistant-ui.com/docs/runtimes/ai-sdk/overview>
- assistant-ui AI SDK v6 runtime:
  <https://www.assistant-ui.com/docs/runtimes/ai-sdk/v6>
- assistant-ui installation:
  <https://www.assistant-ui.com/docs/installation>
- Vercel AI SDK docs: <https://ai-sdk.dev/docs>
- Vercel AI SDK v6 docs: <https://v6.ai-sdk.dev/docs>
- Vercel AI SDK Next.js App Router:
  <https://ai-sdk.dev/docs/getting-started/nextjs-app-router>
- Vercel AI SDK UI chatbot:
  <https://ai-sdk.dev/docs/ai-sdk-ui/chatbot>
- Vercel AI SDK UI transport:
  <https://ai-sdk.dev/docs/ai-sdk-ui/transport>
- Vercel AI SDK chatbot message persistence:
  <https://ai-sdk.dev/docs/ai-sdk-ui/chatbot-message-persistence>
- Vercel AI SDK OpenAI provider:
  <https://ai-sdk.dev/providers/ai-sdk-providers/openai>
- Mastra docs: <https://mastra.ai/docs>
- Mastra quickstart:
  <https://mastra.ai/guides/getting-started/quickstart>
- Mastra agents overview:
  <https://mastra.ai/docs/agents/overview>
- Mastra workflows overview:
  <https://mastra.ai/docs/workflows/overview>
- Mastra tools docs:
  <https://mastra.ai/docs/agents/using-tools>

## 3. 当前版本观察

通过 `npm view` 读取 registry 元数据，未安装任何依赖：

| Package | Observed latest | Relevant metadata |
| --- | --- | --- |
| `@assistant-ui/react` | `0.14.5` | peer `react: ^18 || ^19` |
| `@assistant-ui/react-ai-sdk` | `1.3.26` | depends on `ai: ^6.0.175`, `@ai-sdk/react: ^3.0.177` |
| `ai` | `6.0.184` | peer `zod: ^3.25.76 || ^4.1.8` |
| `@ai-sdk/react` | `3.0.186` | depends on `ai: 6.0.184` |
| `@ai-sdk/openai` | `3.0.64` | peer `zod: ^3.25.76 || ^4.1.8` |
| `@mastra/core` | `1.35.0` | peer `zod: ^3.25.0 || ^4.0.0`; includes AI SDK v5/v6 compatibility deps |
| `zod` | `4.4.3` | `apps/web` already has `zod: ^4.3.6`, satisfying current peers |

Registry versions are not a substitute for user confirmation. Install TASK must re-check.

## 4. 推荐安装包

### 4.1 First thin chat path

Recommended for `@repo/web` after user confirmation:

```txt
@assistant-ui/react@^0.14.5
@assistant-ui/react-ai-sdk@^1.3.26
ai@^6.0.184
@ai-sdk/react@^3.0.186
@ai-sdk/openai@^3.0.64
@repo/ai@workspace:*
```

Do not add `zod` unless the current `apps/web` dependency is removed or no longer
satisfies peer ranges. Current `apps/web` already declares `zod: ^4.3.6`.

Proposed command after confirmation:

```bash
pnpm --filter @repo/web add @assistant-ui/react@^0.14.5 @assistant-ui/react-ai-sdk@^1.3.26 ai@^6.0.184 @ai-sdk/react@^3.0.186 @ai-sdk/openai@^3.0.64 @repo/ai@workspace:*
```

Affected files after confirmation:

- `apps/web/package.json`
- `pnpm-lock.yaml`

### 4.2 Mastra optional runtime path

Do not install for the first direct-provider chat path unless TASK scope confirms
agent orchestration is needed.

Optional package after confirmation:

```txt
@mastra/core@^1.35.0
```

Optional command after confirmation:

```bash
pnpm --filter @repo/web add @mastra/core@^1.35.0
```

Mastra belongs in app runtime wiring under `apps/web/src/ai/**`, not in
`packages/ai` and not in UI components.

## 5. 是否使用 AI SDK v6

Recommendation: use AI SDK v6.

Reasons:

- AI SDK docs currently identify v6 as latest.
- assistant-ui AI SDK runtime docs say new projects should target v6.
- assistant-ui current runtime package maps to `ai@^6` and `@ai-sdk/react@^3`.
- v5 and v4 are legacy in assistant-ui docs and have compatibility gaps.

Known v5/v6 differences that affect implementation:

- `convertToModelMessages` is async in v6 and must be awaited.
- v6 route response uses `toUIMessageStreamResponse()`; older examples may use
  `toDataStreamResponse()`.
- v6 tool schema examples use `inputSchema` and `zodSchema(...)` where applicable.
- `@ai-sdk/react` v6-compatible major is `^3`.

## 6. assistant-ui 与 AI SDK 兼容关系

Current official mapping:

| AI SDK | assistant-ui runtime package | Status |
| --- | --- | --- |
| `ai@^6` + `@ai-sdk/react@^3` | `@assistant-ui/react-ai-sdk` latest | Recommended current path |
| `ai@^5` + `@ai-sdk/react@^2` | older `@assistant-ui/react-ai-sdk` line | Legacy |
| `ai@^4` | `@assistant-ui/react-data-stream` | Legacy |

AeloKit v0.2 should use:

- `@assistant-ui/react`
- `@assistant-ui/react-ai-sdk`
- `AssistantRuntimeProvider`
- `useChatRuntime`
- `AssistantChatTransport` to override the endpoint to `/api/ai/chat`

Use `useAISDKRuntime` only if AeloKit needs direct access to an existing
`useChat` instance. The recommended first path is `useChatRuntime`.

## 7. `useChat` 当前用法

AI SDK v6 `useChat` lives in `@ai-sdk/react`.

The default transport posts to `/api/chat`. AeloKit must not use that default.
If using raw AI SDK UI, configure:

```ts
new DefaultChatTransport({ api: '/api/ai/chat' })
```

If using assistant-ui, configure:

```ts
new AssistantChatTransport({ api: '/api/ai/chat' })
```

The UI message shape is `UIMessage`, with ordered `parts`. The model-facing
message shape must be produced via:

```ts
await convertToModelMessages(messages)
```

## 8. `/api/ai/chat` 如何覆盖默认 endpoint

assistant-ui current AI SDK runtime supports:

```ts
const runtime = useChatRuntime({
  transport: new AssistantChatTransport({ api: '/api/ai/chat' }),
});
```

This is mandatory for AeloKit because `/api/chat` is forbidden and
`/api/ai/chat` is the planned first AI route.

## 9. `streamText` 当前用法

AI SDK v6 route shape:

- Read `messages` as `UIMessage[]`.
- Resolve auth/session before calling the model.
- Resolve provider/model from thread/user/system fallback.
- Use `streamText`.
- Convert `UIMessage[]` with `await convertToModelMessages(messages)`.
- Return `result.toUIMessageStreamResponse()`.

For persistence, route TASK should evaluate:

- `originalMessages`.
- `generateMessageId`.
- `messageMetadata`.
- `onFinish`.
- server-side IDs for persisted messages.

## 10. Route response 当前推荐写法

The default v6 response should be based on:

```ts
return result.toUIMessageStreamResponse();
```

For AeloKit persistence and usage audit, the route implementation plan should
extend this with current v6-supported options, likely:

- `originalMessages` for message reconciliation.
- `generateMessageId` for server-side assistant message IDs.
- `messageMetadata` for usage/model metadata.
- `onFinish` or equivalent stream completion hook for persistence.

The exact hook shape must be re-confirmed during TASK-008/TASK-009.

## 11. Message shape / UI message shape

Current AI SDK UI shape:

- `UIMessage` is designed for app UI.
- `UIMessage.parts` is ordered and can include text, reasoning, tool calls,
  sources, and other part types.
- Model calls require `ModelMessage[]`, produced from UI messages by
  `convertToModelMessages`.

Current assistant-ui persistence path:

- `useChatRuntime` can use a `ThreadHistoryAdapter`.
- In the AI SDK path, history adapter must implement `withFormat`.
- `fmt.encode` and `fmt.decode` round-trip AI SDK `UIMessage` payloads.

AeloKit persistence should map `UIMessage` and parts into the frozen v0.2 tables:

- `ai_thread`
- `ai_message`
- `ai_message_part`
- `ai_tool_call`
- `ai_usage`

## 12. Usage metadata 如何取得

Observed official patterns:

- AI SDK stream finish parts can expose usage metadata such as `totalUsage`.
- assistant-ui docs show `messageMetadata` receiving `finish` parts and returning
  usage metadata.
- assistant-ui docs show `finish-step` can include `response.modelId`.
- AI SDK message metadata docs show `originalMessages` and `messageMetadata` can
  attach usage to response messages.

AeloKit v0.2 should persist usage server-side. Client usage display is optional
and must not become billing.

## 13. Provider SDK 初始化位置

Provider SDK initialization must stay in app runtime layer:

```txt
apps/web/src/ai/**
```

It must not live in:

- `packages/ai`
- `apps/web/src/components/ai`
- route files beyond HTTP boundary orchestration
- client components

For OpenAI direct provider path:

- use `@ai-sdk/openai`.
- read provider key through server env validation.
- never expose provider secret to client.
- default provider instance uses `OPENAI_API_KEY`; AeloKit should explicitly align
  env naming with `@repo/env/server` and `env.example` before implementation.

## 14. Mastra 是否进入 v0.2 第一版 runtime

Recommendation: no, not for the first thin chat path.

Reason:

- AeloKit v0.2 first milestone is one authenticated streamed chat path.
- Direct Vercel AI SDK provider path is sufficient for single-endpoint chat.
- Mastra docs position agents/workflows/tools for open-ended agent work,
  explicit multi-step workflow control, tools, memory, MCP, and orchestration.
- AeloKit roadmap says Mastra should be used only where chat workflow needs
  agent/tool orchestration.

Keep a Mastra integration plan in v0.2:

- reserve `apps/web/src/ai/mastra/**` or equivalent only after TASK confirms need.
- do not create worker, long-running workflow, Studio, memory, RAG, or MCP in v0.2.
- do not install `@mastra/core` until user confirms the specific orchestration TASK.

## 15. Simple chat 是否可不经过 Mastra

Yes. Simple chat can use direct Vercel AI SDK `streamText` with a provider model.

Mastra becomes appropriate when AeloKit needs:

- agent routing.
- tools beyond request-local simple functions.
- workflows.
- memory-aware agents.
- RAG.
- MCP.
- human-in-the-loop workflow state.
- long-running or inspectable agent runs.

## 16. 已知 breaking changes / risk

- AI SDK examples on older blog posts may still show `/api/chat` and
  `toDataStreamResponse()`; v0.2 must use current v6 docs.
- assistant-ui v4/v5 examples are legacy for new projects.
- `convertToModelMessages` must be awaited in v6.
- assistant-ui history adapter for AI SDK path must implement `withFormat`; a
  top-level `load/append` only adapter can fail at runtime.
- provider model IDs in official docs may change; seed values need confirmation.
- OpenAI provider default API behavior changed since AI SDK 5: responses API is
  default for OpenAI models unless explicitly using `.chat` or `.completion`.
- Existing `apps/web` already uses React 19 and zod 4; current peer ranges appear
  compatible, but install TASK must re-check.
- `@mastra/core` brings broad runtime dependencies; defer unless needed.

## 17. 需要用户确认的问题

- 是否确认 AI SDK v6 as v0.2 baseline。
- 是否确认 first provider 只做 OpenAI direct provider path。
- 是否确认 `@ai-sdk/openai` 而不是 AI Gateway / OpenRouter first。
- 是否确认 first thin chat path 暂缓 Mastra install。
- 是否允许修改 `apps/web/package.json` 和 `pnpm-lock.yaml`。
- 是否允许新增 `@repo/ai` 到 `apps/web` direct dependencies。
- 是否需要新增/更新 provider key env schema and `env.example`。
- 是否需要 Playwright 覆盖首次 chat flow。

## 18. 禁止事项

- 不安装依赖。
- 不修改 package.json。
- 不写实现代码。
- 不创建 route。
- 不创建 UI。
- 不创建 schema/migration。

