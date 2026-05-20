# v0.4 AI Stack Decision Record

状态：FROZEN_FOR_V0_4_IMPLEMENTATION

日期：2026-05-20

## 0. v0.4 Review Result

本记录已按 v0.4 implementation prompt、`SCOPE_FREEZE.md`,
`ACCEPTANCE_CRITERIA.md`, `IMPLEMENTATION_PLAN.md`, current repo manifests,
and `OFFICIAL_DOCS_RESEARCH.md` 复核。

- Freeze result: ACCEPTED.
- Official docs age: 0 days on 2026-05-20; no refresh required by the 7-day rule.
- Repo evidence: `apps/web/package.json` uses `@assistant-ui/react`,
  `@assistant-ui/react-ai-sdk`, `ai@^6`, `@ai-sdk/react@^3`,
  `@ai-sdk/openai@^3`, and app-local Mastra packages.
- Boundary evidence: `packages/ai/package.json` exposes contract/type subpaths
  and has no runtime/provider/Mastra dependencies.
- Implementation constraint: this freeze does not authorize Assistant Cloud,
  real MCP, local stdio MCP, schema/migration, dependency changes, or credits
  charging.

## 1. Decision

v0.4 冻结以下 AI stack 分层：

```txt
assistant-ui
  -> Vercel AI SDK v6
  -> POST /api/ai/chat
  -> apps/web/src/ai runtime wiring
      -> packages/ai contracts/runtime-types
      -> Mastra app-wired runtime
  -> packages/db / auth / env / storage / analytics / credits
```

## 2. Selected Stack

### UI Layer

- Selected: assistant-ui in `apps/web/src/components/ai`.
- Current package line: `@assistant-ui/react`, `@assistant-ui/react-ai-sdk`.
- Runtime integration: `useChatRuntime` with `AssistantChatTransport`.
- Route: custom API path `/api/ai/chat`.
- Not selected by default: Assistant Cloud.

### Streaming and Message Protocol Layer

- Selected: Vercel AI SDK v6.
- Current package line: `ai@^6`, `@ai-sdk/react@^3`, `@ai-sdk/openai@^3`.
- Primary concepts: `UIMessage`, `streamText`, `toUIMessageStreamResponse`, `messageMetadata`, source/data/tool parts.
- Not selected: plain text stream as primary chat transport.

### App Transport Layer

- Selected: `apps/web/src/app/api/ai/chat/route.ts`.
- Public route: `POST /api/ai/chat`.
- Responsibilities: auth/session, entitlement, request validation, model fallback, memory/knowledge context injection, AI SDK stream response, persistence, usage audit.
- Not selected: `/api/chat`.

### App Runtime Wiring Layer

- Selected: `apps/web/src/ai`.
- Responsibilities: provider setup, model selection, runtime context, Mastra storage/memory/knowledge wiring, usage audit helpers, policy integration.
- Not selected: moving app runtime wiring into `packages/ai`.

### AI Contracts Layer

- Selected: `packages/ai`.
- Responsibilities: provider/model/agent/tool/skill/memory/knowledge/MCP/usage/permission/error/runtime type contracts, lightweight adapter-compatible types.
- Forbidden: live provider SDK initialization, Mastra runtime, DB query, route handlers, React UI, credits ledger mutation.

### Agent / Memory / Knowledge Runtime Layer

- Selected: Mastra, wired by `apps/web/src/ai`.
- Current scope: memory, storage, RAG/PgVector/embedding runtime already used by v0.3.
- Future reserved scope: agents, workflows, tools, MCP, evals only after scope confirmation.
- Not selected: forcing all chat through Mastra Agent.

### Persistence Layer

- Selected: `packages/db`.
- Responsibilities: Drizzle schema, migrations, AI schema, knowledge schema.
- Current schema facts: `ai_message_part` already supports `source`; `ai_memory_draft` stores pending/confirmed/deleted memory draft state; knowledge tables store source/document/chunk/access metadata.
- Not selected in v0.4 by default: schema/migration changes.

## 3. Rationale

Official docs support the split:

- assistant-ui runtime connects React chat UI to a backend and recommends AI SDK v6 via `@assistant-ui/react-ai-sdk`.
- Vercel AI SDK v6 owns `UIMessage`, stream protocol, metadata and tool stream semantics.
- Mastra owns deeper agent/workflow/tool/memory/RAG/MCP capabilities, but its docs distinguish agents from workflows and do not require using agents for every thin chat route.
- Mastra memory/storage/RAG docs align with keeping storage/vector wiring app-local and verifying PgVector/index/embedding dimensions in runtime environments.

Repo docs support the split:

- `AI_RUNTIME_LAYERING.md` already separates assistant-ui, AI SDK runtime, app routes, `apps/web/src/ai`, `packages/ai`, Mastra and SaaS packages.
- `V0_3_HANDOFF.md` confirms `/api/ai/chat`, memory/knowledge wiring, `ai_memory_draft`, citation metadata, and package/db ownership.
- `AGENTS.md` forbids provider secrets in client, `/api/chat`, credits ledger mutation from usage audit, and Mastra runtime inside `packages/ai`.

## 4. Consequences

### Positive

- Future code review can reject route/package/runtime drift with a clear stack record.
- v0.4 can harden existing AI workspace without expanding into real MCP or credits.
- Citation persistence can be designed against AI SDK source/data parts and existing `ai_message_part` before any migration.
- Runtime smoke can focus on a single known route and stack.

### Costs

- v0.4 does not deliver new user-facing tools/MCP capability by default.
- Citation replay may remain design-only unless a later implementation task explicitly opens no-migration persistence.
- Authenticated runtime smoke requires real environment setup and cannot be completed by code review alone.

## 5. Explicit Non-Decisions

- No real third-party MCP provider is selected.
- No local stdio MCP is selected.
- No Assistant Cloud persistence is selected.
- No Mastra platform/server deployment is selected.
- No worker/gateway/studio/design-system split is selected.
- No credits charging path is selected.
- No schema or migration is selected for immediate execution.

## 6. Revisit Triggers

Revisit this record only if:

- v0.4 scope is explicitly changed by user confirmation.
- assistant-ui or AI SDK breaks current `AssistantChatTransport` / `UIMessage` assumptions.
- Mastra runtime requires a separate deployment boundary for verified production use.
- citation replay cannot be implemented with existing `ai_message_part` source/data parts.
- future tools/MCP implementation requires credential persistence or tool execution audit tables.

## 7. Required Checks for Future Changes

- `pnpm check:package-exports`
- `pnpm check:db-shims`
- `pnpm check:env`
- `pnpm --filter @repo/ai typecheck`
- `pnpm --filter @repo/web typecheck`
- `pnpm --filter @repo/db typecheck`

Runtime smoke and DB/vector verification remain separate from static checks.
