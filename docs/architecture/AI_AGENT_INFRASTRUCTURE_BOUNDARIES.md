# AI Agent Infrastructure Boundaries

**Status**: Planning only  
**Current Task**: Monorepo Evolution Planning  
**Date**: 2026-05-18

---

## 1. Core Boundary Statement

AI Agent Infrastructure should be split into contracts, app wiring, API routes, UI, and data ownership.

```txt
packages/ai = cross-app AI contracts, registries, lightweight adapter types, runtime types, errors, permissions
apps/web/src/ai = web app runtime wiring and dependency injection
apps/web/src/components/ai = web app AI UI components
apps/web/src/app/api/ai = web app AI API routes
packages/db/src/ai.schema.ts = AI database schema; minimal chat persistence may be created in v0.2 after schema/migration confirmation
```

None of these future paths should be created during Current Task.

v0.3 is Mastra-first Memory + Knowledge Integration. It enhances the existing `POST /api/ai/chat` path with Mastra memory/retrieval context; it does not rewrite v0.1 contracts, replace v0.2 chat, create `/api/chat`, or move Mastra runtime into `packages/ai`.

---

## 2. `packages/ai` Boundary

`packages/ai` should own reusable AI infrastructure primitives:

- Provider abstraction.
- Model registry.
- Agent profile contracts.
- Agent runtime types.
- Tool registry contracts.
- Skill registry contracts.
- Memory contracts.
- Knowledge base contracts.
- MCP contracts.
- Usage and cost calculation types.
- Lightweight Vercel AI SDK adapter types.
- Lightweight Mastra adapter types.
- AI runtime type definitions.
- AG-UI / CopilotKit adapter reserve types.
- AI errors.
- AI permission contracts.

`packages/ai` should not own:

- React UI.
- assistant-ui components.
- Next.js route handlers.
- App pages.
- Dashboard page logic.
- User session lookup.
- `cookies()`, `headers()`, or server actions.
- Direct access to `apps/web`.
- Direct coupling to `next-intl`.
- Direct database queries.
- Credits ledger mutation.
- Provider SDK initialization.
- Real Vercel AI SDK runtime calls.
- Real Mastra agent instances.
- Mastra memory/RAG runtime.
- Vector abstraction or reranker implementation.
- Workflow engine implementation.

v0.1 boundary:

- Allowed: contracts, registries, runtime type definitions, lightweight AI SDK/Mastra adapter type surfaces, permission/error/usage/cost types.
- Not allowed: runtime execution, provider SDK initialization, DB access, route handlers, React components, app session/cookie/header access.
- Data model work in v0.1 is a freeze of names and relationships, not schema or migration creation.

Recommended first exports in v0.1:

```txt
@repo/ai
@repo/ai/providers
@repo/ai/models
@repo/ai/agents
@repo/ai/tools
@repo/ai/skills
@repo/ai/memory
@repo/ai/knowledge
@repo/ai/mcp
@repo/ai/usage
@repo/ai/permissions
@repo/ai/errors
@repo/ai/adapters/ai-sdk
@repo/ai/adapters/mastra
@repo/ai/runtime-types
```

---

## 3. `apps/web/src/ai` Boundary

Future `apps/web/src/ai` is web app runtime wiring.

It may own:

- Reading app config and env via existing packages.
- Creating AI provider instances for the web app.
- Resolving current user/session in app routes before invoking AI runtime.
- Connecting `packages/ai` contracts to `@repo/auth`, `@repo/storage`, `@repo/db`, and `@repo/analytics`.
- Connecting to `@repo/credits` only when v0.5 usage/credits semantics are approved.
- Wiring Mastra runtime instances for web app use.
- Wiring Mastra memory and knowledge retrieval into the existing `/api/ai/chat` path in v0.3.
- Selecting the system default model and v0.2 user-level model setting for app routes.
- Enforcing user consent, memory enable/disable policy, and route access control before memory/retrieval context is used.
- App-specific policy decisions, such as free-plan limits.

It should not own:

- Cross-app AI contracts.
- React chat components.
- DB schema definitions.
- Reusable tool/skill type definitions that another app should consume.
- Package-level provider abstractions.
- A self-built memory engine.
- A self-built complete RAG pipeline.
- A self-built vector abstraction or reranker.
- A self-built workflow engine.

---

## 4. `apps/web/src/app/api/ai` Boundary

Future AI API routes are app-layer transport boundaries.

They may own:

- `POST /api/ai/chat` as the first streaming chat endpoint.
- Future AI endpoints under `/api/ai/*`, such as `/api/ai/threads`, `/api/ai/agents`, `/api/ai/models`, `/api/ai/memory`, `/api/ai/knowledge`, `/api/ai/tools`, `/api/ai/mcp`, and `/api/ai/usage`.
- Streaming response using Vercel AI SDK.
- Auth/session checks.
- Request validation.
- Locale and request context extraction.
- v0.3 memory/retrieval context injection through `apps/web/src/ai`, without replacing the existing chat route.
- Usage audit persistence after completion.
- Credit preflight/reservation hooks only in v0.5 after usage semantics are stable.
- Tool permission checks.
- Stream metadata emission.

They should not own:

- `/api/chat`; that namespace is too broad for the first AI streaming route.
- Provider registry definitions.
- Agent contract definitions.
- Tool/skill registry source of truth.
- DB schema.
- Long-running background work that belongs in `apps/worker`.

---

## 5. `apps/web/src/components/ai` Boundary

Future AI UI components are app-local until design-system extraction is justified.

They may own:

- assistant-ui thread/composer components.
- AI workspace layout.
- Attachment UI.
- Message part rendering.
- Tool-call status display.
- Citations/sources rendering.
- Model picker UI.
- Agent picker UI.
- Usage indicator UI.

They should not own:

- Provider SDK initialization.
- Credits ledger mutations.
- Auth session source of truth.
- Cross-app AI contracts.

Components can later move to `packages/design-system/src/ai` only after they become cross-app presentational components and have no app route/action/data coupling.

---

## 6. `packages/db/src/ai.schema.ts` Boundary

Future AI schema belongs to `packages/db`, not `apps/web`.

It should own table definitions for:

- v0.2 minimal chat persistence:
  - `ai_provider`.
  - `ai_model`.
  - `ai_user_model_setting`.
  - `ai_agent`.
  - `ai_thread`.
  - `ai_message`.
  - `ai_message_part`.
  - `ai_tool_call`.
  - `ai_usage`.
- v0.3 AeloKit-owned memory and knowledge metadata, after Mastra-first scope freeze:
  - User consent and memory enable/disable policy state.
  - Knowledge source ownership metadata.
  - Source/citation rendering metadata.
  - Mappings between v0.2 thread/message persistence and Mastra-managed memory/retrieval resources.
  - Any durable app metadata required for audit, retention, or access control.
- v0.4+ MCP persistence, only after MCP scope confirmation:
  - MCP server config.
  - MCP tool discovery metadata.
  - MCP credential references.
- v0.5 usage/credits/admin audit extensions if needed:
  - Cost events.
  - Credit usage linkage.
  - Audit events.

It should not own:

- Runtime provider objects.
- UI state.
- Next.js route handlers.
- Business process orchestration.
- Mastra memory, embedding, vector retrieval, rerank, or RAG internals.

Creation conditions:

- v0.1 freezes the AI data model names and relationships in docs/contracts only.
- v0.2 may create minimal `packages/db/src/ai.schema.ts` for chat persistence after explicit schema/migration confirmation.
- v0.3 may add only AeloKit-owned memory/knowledge metadata after a second scope freeze, such as user consent state, memory enable/disable policy state, knowledge source ownership metadata, citation/source rendering metadata, or mappings from v0.2 chat persistence to Mastra-managed memory/retrieval resources.
- v0.3 must not mirror Mastra internals as a self-built memory engine, vector store abstraction, reranker, or complete RAG pipeline.
- MCP credential/server/tool persistence belongs to v0.4 or later, not v0.3.
- Migration impact is reviewed before each schema change.
- User confirms schema and migration work before files or migrations are created.

---

## 7. AI Data Model Modules

### 7.1 Model Provider

Owns:

- Provider identity.
- Provider capabilities.
- Model registry.
- Default model.
- v0.2 minimal user-level model settings: user default model, per-chat `modelId`, and fallback to system default provider/model.
- v0.3+ agent-level model settings.
- v0.5+ usage/cost-aware model policy.
- Provider key strategy.
- AI Gateway strategy.

v0.2 should not include per-agent advanced model policy, BYOK, team-level model policy, complex pricing management UI, or complete model capability matrix management.

Integration points:

- `@repo/env`: platform provider keys and gateway keys.
- `@repo/auth`: user identity and user-specific settings.
- `@repo/db`: persisted provider/model/user/agent settings.
- `@repo/analytics`: model/provider selection events.

### 7.2 Agent

Owns:

- Agent profile.
- Instructions.
- Default model.
- Available tools/skills.
- Memory settings.
- Visibility.
- System agent vs user agent.

Integration points:

- `@repo/auth`: owner and permissions.
- `@repo/db`: persisted agent definitions.
- `@repo/ai`: contracts and registry.
- `apps/studio`: future builder UI.

### 7.3 Chat Thread

Owns:

- Thread.
- Message.
- Message parts.
- Tool calls.
- Attachments.
- Streaming state.
- Resumable stream reserve.

Integration points:

- assistant-ui: UI thread state and rendering.
- Vercel AI SDK: `UIMessage`, stream protocol, metadata.
- `@repo/storage`: attachment files.
- `@repo/db`: persistence.

### 7.4 Memory

Mastra owns the runtime behavior:

- Memory runtime.
- Conversation history.
- Working memory.
- Semantic recall.
- Memory processors.
- Thread summary behavior when Mastra is the chosen runtime path.

AeloKit owns the product boundary:

- Auth/session/user identity.
- User consent.
- Memory enable/disable policy.
- Memory UI entry and display.
- Memory source/audit metadata when needed.
- v0.2 chat persistence links.

Memory is durable behavioral/context memory. It records things the system may reuse later.

### 7.5 Knowledge Base

Mastra owns the retrieval pipeline:

- Document chunking.
- Embedding.
- Vector retrieval.
- Rerank / RAG pipeline.

AeloKit owns the product boundary:

- Knowledge source ownership metadata.
- Source file relationships through `@repo/storage`.
- UI entry and display.
- Citation/source rendering.
- Access control and user consent.
- Usage audit.

Knowledge is source-grounded content. It should preserve provenance and citation paths.

Memory and knowledge must remain separate:

- Memory answers “what should the agent remember about this user/project/thread?”
- Knowledge answers “what source material can the agent retrieve and cite?”

### 7.6 Skills / Tools

Owns:

- Skill registry.
- Tool registry.
- Tool permission contracts.
- Tool call logs.
- Built-in tools.
- User-enabled tools.

Tools execute actions. Skills package reusable capabilities/instructions/tool groupings.

### 7.7 MCP

Owns:

- MCP server config.
- MCP tool discovery.
- MCP credential references.
- MCP permission model.
- Remote MCP first.
- Local stdio MCP later.

MCP must be permissioned before it is user-accessible. Local stdio MCP is higher risk and should not be part of early phases.

### 7.8 Usage / Credits

v0.2 owns usage audit only:

- `userId`.
- `threadId`.
- `messageId`.
- Provider.
- Model.
- Input tokens.
- Output tokens.
- Estimated cost.
- Created time.
- Request status.
- Error reason when failed.

v0.2 does not own:

- Credits charging.
- Credits reservation.
- Credits settlement.
- Refunds.
- Plan quota enforcement through credits.
- Failed-call billing rollback.

v0.5 owns usage/credits/admin audit:

- Usage and cost dashboard.
- Credits preflight.
- Credits reservation.
- Credits settlement.
- Refund and failed request handling.
- User quota and plan entitlement integration.
- Admin usage audit.

Integration points:

- Vercel AI SDK usage metadata.
- Provider/model pricing table.
- `@repo/credits` consumption/reservation/settlement in v0.5.
- `@repo/payment` plan entitlement.
- `@repo/analytics` usage events.

---

## 8. AI Runtime Modules

Runtime responsibilities should be layered:

- UI runtime: assistant-ui.
- Streaming and message protocol: Vercel AI SDK.
- App transport and policy: `apps/web` API routes.
- App runtime wiring: `apps/web/src/ai`.
- Shared contracts/adapters: `packages/ai`.
- Agent/workflow/tool runtime: Mastra.
- Persistence and SaaS services: `packages/db`, `storage`, `credits`, `auth`, `analytics`.

---

## 9. AI Workflow Modules

Mastra should be used when direct chat routing is not enough. In v0.3, memory and knowledge integration is Mastra-first rather than AeloKit self-building the runtime engines:

- Multi-step tools.
- Agent workflows.
- Human-in-the-loop review.
- Memory runtime, conversation history, working memory, semantic recall, and memory processors.
- Document chunking, embedding, vector retrieval, rerank, and RAG pipeline.
- MCP-connected tools.
- Long-running workflow runs.

Direct Vercel AI SDK route is sufficient when:

- A single chat endpoint streams model output.
- Tool calls are simple and request-scoped.
- Persistence and usage are straightforward.

---

## 10. SaaS Integration Boundaries

| SaaS package | AI integration | Boundary |
| --- | --- | --- |
| `@repo/auth` | Identify user, roles, API keys, admin/system permissions | AI packages do not fetch sessions directly |
| `@repo/credits` | v0.5 credits preflight, reservation, settlement, refund handling | v0.2 records usage audit only; `packages/ai` defines usage contracts, and credits package owns ledger mutation |
| `@repo/storage` | Store attachments, source files, generated assets | AI runtime stores metadata in DB and files in storage |
| `@repo/db` | Own AI schema and persistence | App routes call repositories/services, schema stays in DB package |
| `@repo/env` | Validate provider/gateway keys | Do not read secrets in client components |
| `@repo/payment` | Plan entitlements and billing relationship | Payment package does not call AI runtime |
| `@repo/analytics` | Track AI usage, model selection, tool events | Operational observability remains separate from product analytics |

---

## 11. Admin / Audit Boundaries

Future admin surfaces should include:

- AI usage dashboard.
- Agent audit.
- Tool call audit.
- MCP connection audit.
- Knowledge usage audit.
- Cost tracking.

Initial admin UI should remain in `apps/web`. Split to `apps/admin` only when the admin surface has enough operational complexity to justify an independent app.
