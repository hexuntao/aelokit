# AI Agent Infrastructure Boundaries

**Status**: Planning only  
**Current Task**: Monorepo Evolution Planning  
**Date**: 2026-05-18

---

## 1. Core Boundary Statement

AI Agent Infrastructure should be split into contracts, app wiring, API routes, UI, and data ownership.

```txt
packages/ai = cross-app AI contracts, registries, adapters, errors, permissions
apps/web/src/ai = web app runtime wiring and dependency injection
apps/web/src/components/ai = web app AI UI components
apps/web/src/app/api/ai = web app AI API routes
packages/db/src/ai.schema.ts = AI database schema, created in a later schema task
```

None of these future paths should be created during Current Task.

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
- AI SDK adapter core.
- Mastra adapter core.
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
- Direct database queries unless a later decision explicitly adds repository interfaces.

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
- Connecting `packages/ai` contracts to `@repo/auth`, `@repo/credits`, `@repo/storage`, `@repo/db`, and `@repo/analytics`.
- Wiring Mastra runtime instances for web app use.
- Selecting default model for app routes.
- App-specific policy decisions, such as free-plan limits.

It should not own:

- Cross-app AI contracts.
- React chat components.
- DB schema definitions.
- Reusable tool/skill type definitions that another app should consume.
- Package-level provider abstractions.

---

## 4. `apps/web/src/app/api/ai` Boundary

Future AI API routes are app-layer transport boundaries.

They may own:

- `POST /api/ai/chat` style endpoints.
- Streaming response using Vercel AI SDK.
- Auth/session checks.
- Request validation.
- Locale and request context extraction.
- Credit preflight/reservation hooks.
- Tool permission checks.
- Stream metadata emission.
- Usage event persistence after completion.

They should not own:

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

- Model providers and model registry metadata.
- Agent profiles.
- Agent-tool and agent-skill assignments.
- Chat threads.
- Messages.
- Message parts.
- Tool calls.
- Attachments metadata.
- Memory records.
- Thread summaries.
- Knowledge bases.
- Documents.
- Chunks.
- Embeddings.
- MCP server configs.
- Tool call logs.
- Usage events.
- Cost events.
- Credit usage linkage.
- Audit events.

It should not own:

- Runtime provider objects.
- UI state.
- Next.js route handlers.
- Business process orchestration.

Creation conditions:

- v0.3 or later.
- AI data model scope freeze complete.
- Migration impact reviewed.
- User confirms schema and migration work.

---

## 7. AI Data Model Modules

### 7.1 Model Provider

Owns:

- Provider identity.
- Provider capabilities.
- Model registry.
- Default model.
- User-level model settings.
- Agent-level model settings.
- Provider key strategy.
- AI Gateway strategy.

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

Owns:

- User memory.
- Agent memory.
- Project memory.
- Thread summary.
- Memory write confirmation strategy.
- Memory deletion strategy.

Memory is durable behavioral/context memory. It records things the system may reuse later.

### 7.5 Knowledge Base

Owns:

- Knowledge base.
- Documents.
- Chunks.
- Embeddings.
- Retrieval metadata.
- Sources.
- Citations.
- File storage relationships.

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

Owns:

- Token usage events.
- Cost events.
- Credit events.
- User quota.
- Billing integration.
- Admin usage audit.

Integration points:

- Vercel AI SDK usage metadata.
- Provider/model pricing table.
- `@repo/credits` consumption/reservation/settlement.
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

Mastra should be used when direct chat routing is not enough:

- Multi-step tools.
- Agent workflows.
- Human-in-the-loop review.
- Memory-aware agents.
- RAG pipelines.
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
| `@repo/credits` | Consume or reserve credits for AI usage | `packages/ai` defines usage contracts; credits package owns ledger mutation |
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
