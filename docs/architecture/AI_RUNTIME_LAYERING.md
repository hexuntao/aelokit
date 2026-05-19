# AI Runtime Layering

**Status**: Planning only  
**Current Task**: Monorepo Evolution Planning  
**Date**: 2026-05-18

---

## 1. Target Layer Stack

```txt
assistant-ui
↓
Vercel AI SDK Runtime
↓
apps/web API routes
↓
apps/web/src/ai runtime wiring
├─ packages/ai contracts/adapters
└─ Mastra runtime, app-wired in v0.3+
↓
packages/db / storage / credits / auth / analytics
```

This is a layered architecture, not a required implementation in Current Task. `packages/ai` stays a contracts/adapters/runtime-types package; Mastra runtime is wired by the app layer and must not be placed inside `packages/ai`.

---

## 2. Layer Responsibilities

| Layer | Responsibility | Does not own |
| --- | --- | --- |
| assistant-ui | Chat UI, thread/composer rendering, UI runtime provider, attachments/tool-call presentation, client-side thread state adapters | Provider SDKs, DB schema, credits ledger, auth session lookup |
| Vercel AI SDK Runtime | Streaming protocol, `UIMessage`, `streamText`, tool call stream handling, UI message response, model provider interface, usage metadata | Product page layout, full agent orchestration, app permissions by itself |
| `apps/web` API routes | HTTP boundary, auth/session checks, request validation, stream response, route-level policy, v0.2 usage audit, v0.5 credit preflight/finalization | Cross-app contracts, DB schema ownership, UI components |
| `apps/web/src/ai` runtime wiring | App-specific provider setup, system and user-level model selection, user context injection, Mastra instance wiring, v0.3 memory/retrieval context integration, integration with auth/storage/db/analytics and v0.5 credits | Reusable contract definitions, React UI, schema definitions, self-built memory/RAG/vector/reranker/workflow engines |
| `packages/ai` contracts/adapters | Provider/model/agent/tool/skill/memory/knowledge/MCP/usage/permission contracts, lightweight AI SDK adapter types, lightweight Mastra adapter types, runtime type definitions, errors | Next routes, cookies, server actions, `apps/web`, concrete app pages, DB queries, provider SDK initialization, live runtime execution |
| Mastra runtime | Agent execution, tools, workflows, memory runtime, conversation history, working memory, semantic recall, memory processors, document chunking, embedding, vector retrieval, rerank/RAG pipeline, future MCP orchestration, human-in-the-loop patterns | Product billing policy, app-specific UI, SaaS identity and consent policy, source ownership metadata, v0.2 chat persistence, package contract ownership |
| SaaS packages | Auth identity, DB persistence, file storage, credit ledger, payment entitlements, analytics events, AeloKit-owned memory/knowledge metadata when approved | AI UI, route-level streaming protocol, agent contract source of truth, Mastra memory/RAG internals |

---

## 3. Request Flow

Near-term chat flow after v0.2:

```txt
User
↓
assistant-ui Thread / Composer
↓
Vercel AI SDK chat runtime
↓
POST /api/ai/chat
↓
Resolve user/session, locale, entitlement, user/default model setting
↓
apps/web/src/ai selects agent/model/tools
↓
packages/ai validates contracts and permissions
↓
Mastra runs agent/workflow when needed
↓
Model provider streams output through AI SDK
↓
API route emits UI message stream
↓
assistant-ui renders messages, parts, tool states, citations
↓
Minimal thread/message persistence and usage audit are recorded after completion
```

v0.3 does not replace this flow. It adds Mastra memory/retrieval context inside `apps/web/src/ai` before or during model response generation, then returns source/citation metadata through the existing `/api/ai/chat` stream and v0.2 persistence path.

v0.2 usage audit is not credits billing. Credit preflight, reservation, settlement, refunds, quota enforcement, and failed-request billing rollback are deferred to v0.5.

---

## 4. assistant-ui Role

assistant-ui should be treated as the presentation/runtime UI layer.

It owns:

- Thread and composer UI.
- Message rendering.
- Runtime provider on the client.
- Attachments UI.
- Tool-call UI display.
- Feedback/history adapters when used.

It should not own:

- Provider key management.
- Credits calculation.
- Agent definitions.
- DB schema.
- Mastra orchestration.

assistant-ui should initially live inside `apps/web/src/components/ai`. Later, stable presentational pieces can move to `packages/design-system/src/ai`.

---

## 5. Vercel AI SDK Role

Vercel AI SDK should be the streaming and runtime protocol layer.

It owns:

- `UIMessage` and model message conversion.
- `streamText` and stream response helpers.
- AI SDK UI runtime hooks and transports.
- Tool call stream protocol.
- Token usage metadata.
- Provider/model interface.
- Resume stream reserve when implemented.

It should not own:

- Full product-level agent registry.
- Persistent memory policy.
- Credits ledger.
- Admin audit UI.

AI SDK v6 is the planned baseline for new implementation work. Versions must be verified again before dependency changes.

---

## 6. Mastra Role

Mastra should own deeper agent orchestration. Starting in v0.3, memory and knowledge integration is Mastra-first.

Mastra owns:

- Agent definitions and runtime execution.
- Tool orchestration.
- Workflow orchestration.
- Memory runtime.
- Conversation history.
- Working memory.
- Semantic recall.
- Memory processors.
- Document chunking.
- Embedding.
- Vector retrieval.
- Rerank / RAG pipeline.
- MCP tool integration.
- Human-in-the-loop workflows.
- Long-running or inspectable agent runs.

AeloKit owns:

- Auth/session/user identity.
- Route access control.
- User consent.
- Memory enable/disable policy.
- Knowledge source ownership metadata.
- UI entry and display.
- Citation/source rendering.
- Usage audit.
- v0.2 chat persistence.
- Future credits boundary.

Do not force Mastra into simple chat before needed. A direct AI SDK route is acceptable for the first thin chat path if agent orchestration is not yet required.

For v0.3, do not self-build a complete memory engine, complete RAG pipeline, vector abstraction, reranker, or workflow engine. Do not put Mastra runtime into `packages/ai`.

---

## 7. SaaS Package Integration

| Package | Integration point |
| --- | --- |
| `@repo/auth` | User identity, roles, API keys, admin/system permissions |
| `@repo/credits` | v0.5 credit preflight, reservation, consumption, refund/settlement; not mutated by v0.2 usage audit |
| `@repo/storage` | Attachments, knowledge source files, generated artifacts; source files remain AeloKit-owned file metadata, not Mastra internals |
| `@repo/db` | v0.2 provider/model/user setting/agent/thread/message/message part/tool call/usage persistence; v0.3 AeloKit-owned memory/knowledge metadata only after schema confirmation |
| `@repo/env` | Provider and gateway key validation |
| `@repo/payment` | Plan entitlements, billing state, paid features |
| `@repo/analytics` | Product analytics for AI events |

Operational traces/evals/cost dashboards should later go through `packages/observability`, not be mixed into product analytics by default.

---

## 8. Optional Extension Layers

CopilotKit and AG-UI should be considered only at v0.8 or later.

Potential use:

- CopilotKit: in-app copilot interactions beyond chat workspace.
- AG-UI: agent-user interaction protocol interoperability.

They should not define v0.1 contracts. The core must first stabilize around AeloKit-owned AI contracts, app wiring, AI SDK streaming, and Mastra orchestration.

---

## 9. Implementation Guardrail

Current Task creates this document only. Future implementation must not begin until the user confirms a specific phase such as v0.1 or v0.2.
