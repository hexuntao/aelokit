# AeloKit Package Boundaries

**Status**: Planning only  
**Current Task**: Monorepo Evolution Planning  
**Date**: 2026-05-18

---

## 1. Boundary Principles

Package boundaries should preserve the current monorepo shape:

- `packages/*` own cross-app reusable domains.
- `apps/web` owns current app routes, pages, server actions, UI composition, and app-specific wiring.
- A package must not import from `apps/web`.
- A package must declare every direct dependency it imports.
- A package must expose intentional subpath exports instead of letting consumers deep-import internals.
- New packages require explicit user confirmation and a scope freeze.
- Do not create “misc”, “core”, “common”, or unbounded aggregation packages.

---

## 2. Current Package Boundary Table

| Package | Responsibility | Allowed dependencies | Forbidden dependencies | Current exports | Create when |
| --- | --- | --- | --- | --- | --- |
| `@repo/config` | Core SaaS configuration and config types | `@repo/env` | App routes, DB clients, provider SDK side effects, React UI | `.`, `./website`, `./types` | Already exists |
| `@repo/shared` | Pure utilities, constants, generic types, generic hooks/context | Low-level utility deps such as `clsx`, `tailwind-merge`, React only for generic hooks/context | Business domains, DB, auth session, Next route APIs | `.`, `./utils`, `./hooks`, `./constants`, `./types`, `./context` | Already exists |
| `@repo/env` | Env schema and workspace env loading | Zod and env validation libraries | Any `@repo/*` dependency, business config, provider clients | `.`, `./server`, `./client`, `./shared`, `./load` | Already exists |
| `@repo/i18n` | next-intl routing, navigation, messages, docs i18n helpers | `@repo/config`, `@repo/env`, `next-intl`, docs helper types | App copy, app pages, session state, DB | `.`, `./routing`, `./navigation`, `./messages`, `./request`, `./hreflang`, `./urls`, `./docs`, `./types` | Already exists |
| `@repo/db` | Drizzle schema, DB connection, DB types, migrations | `@repo/env`, Drizzle, postgres | Auth runtime, payment SDKs, UI, server actions, AI runtime side effects | `.`, `./schema`, `./auth-schema`, `./app-schema`, `./types` | Already exists |
| `@repo/auth` | Better Auth core, server/client helpers, auth callback contracts | `@repo/config`, `@repo/db`, `@repo/env`, `@repo/shared`, Better Auth | App-specific mail sending, credits gifts, newsletter side effects, UI, route handlers | `.`, `./server`, `./client`, `./types`, `./helpers`, `./utils` | Already exists |
| `@repo/payment` | Payment provider contracts and Stripe/Creem implementation | `@repo/config`, `@repo/db`, `@repo/env`, `@repo/shared`, provider SDKs | Credits ledger ownership, auth session lookup, UI, Next runtime | `.`, `./types`, `./provider`, `./registry`, `./providers` | Already exists |
| `@repo/credits` | Credit balance, credit ledger, credit distribution, credit transaction types | `@repo/config`, `@repo/db`, Drizzle/date helpers | Payment provider SDKs, auth session lookup, UI, route handlers, AI runtime | `.`, `./types`, `./service`, `./ledger`, `./distribute` | Already exists |
| `@repo/mail` | Transactional mail types, provider interface, render helpers, templates/components | `@repo/config`, `@repo/env`, `@repo/shared`, React Email, Resend | Auth callbacks, app preview props, DB, Next runtime, payment/credits | `.`, `./types`, `./provider`, `./render`, `./templates`, `./components` | Already exists |
| `@repo/newsletter` | Newsletter provider interface and service | `@repo/config`, `@repo/env`, newsletter provider SDKs | Mail package coupling, auth callbacks, forms, captcha, DB | `.`, `./types`, `./provider`, `./service`, `./registry`, `./providers` | Already exists |
| `@repo/notification` | System notification provider contracts and service | `@repo/config`, `@repo/env` | DB, auth, payment, credits, mail, UI, route handlers | `.`, `./types`, `./provider`, `./service`, `./registry`, `./providers` | Already exists |
| `@repo/storage` | Object storage provider contracts and S3/R2 upload/delete service | `@repo/config`, `@repo/env`, `s3mini` | Browser upload UI, route auth, DB, payment, credits, React | `.`, `./types`, `./provider`, `./service`, `./registry`, `./providers`, `./config` | Already exists |
| `@repo/analytics` | Analytics types, provider contracts, event names, config helpers | `@repo/config`, `@repo/env` | React providers, script injection, dashboard UI, DB, auth, payment | `.`, `./types`, `./client`, `./server`, `./events`, `./provider`, `./registry`, `./config`, `./helpers` | Already exists |

---

## 3. Future Package Boundary Table

| Package | Responsibility | Allowed dependencies | Forbidden dependencies | Suggested exports | Create when | Horizon |
| --- | --- | --- | --- | --- | --- | --- |
| `@repo/ai` | Cross-app AI infrastructure core | `@repo/config`, `@repo/env`, `@repo/shared`; lightweight AI SDK/Mastra adapter type dependencies only when confirmed | React UI, assistant-ui components, Next route handlers, cookies, server actions, `apps/web`, dashboard pages, direct session lookup, DB queries, provider SDK initialization, credits ledger mutation, live AI SDK/Mastra runtime execution, Mastra memory/RAG runtime, vector abstraction, reranker, workflow engine | `.`, `./providers`, `./models`, `./agents`, `./tools`, `./skills`, `./memory`, `./knowledge`, `./mcp`, `./usage`, `./permissions`, `./errors`, `./adapters/ai-sdk`, `./adapters/mastra`, `./runtime-types` | Already exists as v0.1 contracts foundation | v0.1 |
| `@repo/design-system` | Product-level design system | `@repo/shared`, React, styling deps, icon deps; optional framework adapters by subpath only | DB, auth session, payment logic, credits ledger, server actions, route handlers, hard-bound page queries | `.`, `./ui`, `./blocks`, `./marketing`, `./ai`, `./dashboard`, `./forms`, `./layouts`, `./icons`, `./tokens`, `./styles`, `./hooks`, `./utils` | v0.7 after component audit and extraction scope freeze | v0.7 |
| `@repo/api-client` | Typed API client and generated contract consumers | Future `contracts`, fetch/runtime-safe helpers, auth token types | Direct DB access, provider SDK implementations, UI pages | `.`, `./client`, `./types`, `./errors`, `./ai`, `./admin` | When `apps/gateway` or public API contracts exist | v0.6+ |
| `@repo/logger` | Structured logging and redaction | `@repo/env`, `@repo/shared` | UI, analytics dashboards, DB persistence by default | `.`, `./types`, `./server`, `./redaction`, `./fields` | When worker/gateway need consistent logs | v0.6+ |
| `@repo/observability` | Traces, evals, model metrics, workflow run contracts | future `@repo/logger`, `@repo/ai`, maybe `@repo/analytics` | Product analytics UI, route handlers, provider-specific dashboards | `.`, `./traces`, `./evals`, `./costs`, `./models`, `./workflows`, `./types` | After AI operations need cross-app inspection | Long-term |
| `@repo/testing` | Test factories, fixtures, contract mocks, app/page test helpers | Test runner deps, generated factories | Production runtime, live provider clients, migrations | `.`, `./fixtures`, `./factories`, `./mocks`, `./playwright`, `./db` | After a repo-wide test runner exists | Long-term |

---

## 4. `packages/ai` Boundary

`packages/ai` is the AI Agent Infrastructure core package. It is not a web app business directory and not a dumping ground.

It should own:

- Provider abstraction.
- Model registry.
- Agent contracts.
- Tool registry.
- Skill registry.
- Memory contracts.
- Knowledge contracts.
- MCP contracts.
- Usage and cost calculation contracts.
- Lightweight Vercel AI SDK adapter types.
- Lightweight Mastra adapter types.
- Runtime type definitions.
- AG-UI / CopilotKit adapter reserve types.
- AI errors.
- AI permission contracts.

It should not own:

- React UI.
- assistant-ui components.
- Next.js route handlers.
- Pages or dashboard logic.
- User session lookup.
- Cookies or headers.
- Server actions.
- Direct imports from `apps/web`.
- Direct coupling to `next-intl`.
- Direct app billing UI or settings UI.
- Real Vercel AI SDK runtime calls.
- Real Mastra agent instances.
- Mastra memory/RAG runtime.
- Vector abstraction or reranker implementation.
- Workflow engine implementation.
- Provider SDK initialization.
- DB queries.
- Credits ledger mutation.
- App session, cookies, or headers.

v0.1 scope:

- `packages/ai` may define contracts, lightweight adapter type surfaces, runtime type definitions, errors, and permission types.
- `packages/ai` may participate in an AI data model freeze by defining stable TypeScript contracts.
- `packages/ai` must not implement runtime execution. Runtime wiring begins in v0.2 inside `apps/web`.

Required distinction:

```txt
packages/ai = cross-app reusable AI infrastructure core
apps/web/src/ai = web app runtime wiring
apps/web/src/components/ai = web app current AI UI components
apps/web/src/app/api/ai = web app current AI API routes
packages/db/src/ai.schema.ts = AI database schema; minimal chat persistence may be created in v0.2 after schema/migration confirmation
```

`packages/db` AI schema timing:

- v0.1 freezes the minimal AI data model in docs/contracts only.
- v0.2 may add minimal chat persistence schema: `ai_provider`, `ai_model`, `ai_user_model_setting`, `ai_agent`, `ai_thread`, `ai_message`, `ai_message_part`, `ai_tool_call`, and `ai_usage`.
- v0.3 may add only AeloKit-owned memory/knowledge metadata after Mastra-first scope freeze, such as consent state, memory enable/disable policy state, knowledge source ownership metadata, citation/source rendering metadata, or links from v0.2 chat persistence to Mastra-managed memory/retrieval resources.
- v0.3 must not use `packages/db` to recreate Mastra memory internals, document chunking, embeddings, vector retrieval, rerank, or a complete RAG pipeline.
- MCP server/tool/credential persistence belongs to v0.4 or later, not v0.3.
- Schema creation and migration generation require explicit user confirmation in their own implementation task.

---

## 5. `packages/design-system` Boundary

Future design work should target `packages/design-system`, not a narrow `packages/ui`.

It may own:

- Base UI primitives.
- Reusable blocks.
- Marketing components.
- Docs / changelog / legal presentation components.
- AI workspace presentation components.
- Dashboard layout primitives.
- Form wrappers.
- Theme tokens.
- Icons and visual assets.
- Style utilities.

It must not own:

- Database access.
- Payment logic.
- Credits charging or ledger logic.
- Auth session fetching.
- Next.js route handlers.
- Server actions.
- Page-specific data fetching.
- Components that require `@/actions`, `@/db`, `@/payment`, `@/credits`, or concrete app route state.

Current boundary:

- `apps/web/src/components`: current business components, page-bound components, app-level components, and third-party imported libraries.
- `packages/design-system`: later, audited cross-app reusable product design system components.

---

## 6. How to Avoid Junk Packages

Before creating any package, require:

1. A named domain with stable ownership.
2. At least two real consumers or a clear future split path.
3. Explicit allowed and forbidden dependencies.
4. Explicit subpath exports.
5. Validation command for that workspace.
6. A migration plan from current app code.
7. A rollback strategy if extraction increases coupling.

Do not create a package just because code “might be reused later”.

---

## 7. Export Guidelines

Package exports should be explicit and stable:

- `.` exports public defaults.
- `./types` exports shared types only.
- Domain subpaths such as `./provider`, `./registry`, `./service`, `./errors`, `./permissions` are allowed when they map to real boundaries.
- Avoid deep imports like `@repo/ai/src/internal/foo`.
- Avoid exporting implementation internals before they have consumers.
- Keep server-only and client-safe exports separated when needed.

---

## 8. Validation Expectations

For future implementation tasks:

- New packages must add `lint`, `format`, and `typecheck` scripts.
- Workspace consumers must declare direct imports in their own `package.json`.
- Existing checks such as package export checks and shim checks should be extended rather than bypassed.
- Full test suite or DB migrations require explicit user confirmation under current repository rules.
