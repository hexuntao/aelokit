# AeloKit Monorepo Evolution Plan

**Status**: Planning only  
**Current Task**: Monorepo Evolution Planning  
**Date**: 2026-05-18  
**Scope**: Documentation only. This task must not create future apps, future packages, schemas, contracts, orchestration code, migrations, runtime code, API routes, UI components, dependencies, or package config changes.

---

## 1. Executive Summary

AeloKit should evolve from the current SaaS monolith plus domain packages into:

```txt
AeloKit
= SaaS foundation
+ AI Agent Infrastructure
+ Design System
+ split-ready application layer
+ extensible runtime
```

The current repository is already a `pnpm workspace + Turborepo` monorepo. `apps/web` is the complete SaaS application. Existing `packages/*` packages own cross-app SaaS domains such as config, env, db, auth, payment, credits, mail, newsletter, notification, storage, analytics, i18n, and shared utilities.

The next step is not app splitting. The next step is to freeze boundaries in documentation, then introduce AI infrastructure inside the current structure with minimal movement. New apps and new packages should be created only after explicit scope freeze and user confirmation.

---

## 2. Current Structure

```txt
apps/
  web/                  # current complete SaaS monolith

packages/
  config/               # shared SaaS configuration and types
  shared/               # pure utilities, constants, types, React-safe hooks/context
  env/                  # shared env validation
  i18n/                 # next-intl routing/messages helpers
  db/                   # Drizzle + PostgreSQL database ownership
  auth/                 # Better Auth core
  payment/              # payment provider domain
  credits/              # credits ledger/domain
  mail/                 # transactional mail domain
  newsletter/           # newsletter domain
  notification/         # system notification domain
  storage/              # S3/R2 object storage domain
  analytics/            # analytics provider contracts/helpers

docs/
  audit/
  migration/
  modules/
  nextjs/
```

Current important observations:

- `apps/web/src/components` owns current UI, including `ui/`, `magicui/`, `animate-ui/`, `tailark/`, business components, dashboard, settings, docs, pricing, auth, and admin components.
- There is intentionally no current `packages/ui`, `packages/design-system`, or `packages/ai`.
- There is currently no `apps/web/src/ai`, `apps/web/src/components/ai`, or `apps/web/src/app/api/ai`; these are future app-layer runtime and UI locations.
- `apps/web/src/db/*`, `apps/web/src/payment/*`, `apps/web/src/credits/*`, `apps/web/src/mail/*`, `apps/web/src/newsletter/*`, `apps/web/src/notification/*`, `apps/web/src/storage/*`, and `apps/web/src/analytics/*` include compatibility shims or app-specific wiring. True domain ownership remains in `packages/*`.
- `packages/env` already includes optional AI provider keys, but no AI runtime package has been created.

---

## 3. Target Architecture

### 3.1 Four Primary Layers

| Layer | Purpose | Current Owner | Future Owner |
| --- | --- | --- | --- |
| SaaS foundation | Auth, billing, credits, env, DB, storage, mail, notification, analytics, i18n | Existing `packages/*` and `apps/web` wiring | Existing `packages/*` plus app-level route/actions |
| AI Agent Infrastructure | Provider/model registry, agent contracts, tool/skill/MCP/memory/knowledge contracts, AI cost/usage types | Not created yet | Future `packages/ai` plus app runtime wiring |
| Design System | Product-level visual system, primitives, blocks, layouts, AI workspace components, dashboard patterns, tokens | `apps/web/src/components` | Future `packages/design-system` after audit and extraction scope freeze |
| Split-ready application layer | Web, admin, landing, docs, worker, gateway, studio, observability apps | Current `apps/web` | Future `apps/*` when split conditions are met |

### 3.2 Runtime Direction

Current planning should assume:

- **assistant-ui** owns the chat UI layer.
- **Vercel AI SDK** owns streaming/runtime protocol, `UIMessage`, UI runtime connection, model-provider interface, token usage metadata, and route-level stream response primitives.
- **Mastra** owns Agent / Tool / Workflow / Memory / RAG / MCP orchestration when AeloKit needs deeper agent runtime behavior than a direct AI SDK route.
- **CopilotKit / AG-UI** are future optional extension points. They are not part of Current Task and should not enter v0.1 implementation.

Current version snapshot checked on 2026-05-18:

| Package | Latest observed version | Role |
| --- | ---: | --- |
| `@assistant-ui/react` | `0.14.5` | Chat UI framework |
| `ai` | `6.0.184` | Vercel AI SDK core package |
| `@mastra/core` | `1.35.0` | Mastra core runtime |
| `@copilotkit/react-core` | `1.57.1` | Future optional copilot layer |
| `@ag-ui/core` | `0.0.53` | Future optional AG-UI protocol layer |

This snapshot is informational. Implementation tasks must verify versions again before installing or changing dependencies.

Reference sources for future implementation review:

- assistant-ui AI SDK integration: https://www.assistant-ui.com/docs/integrations/frameworks/ai-sdk
- assistant-ui AI SDK v6 runtime notes: https://www.assistant-ui.com/docs/runtimes/ai-sdk/v6
- Vercel AI SDK introduction: https://ai-sdk.dev/docs/introduction
- Vercel AI SDK UI overview: https://ai-sdk.dev/docs/ai-sdk-ui/overview
- Mastra agents: https://mastra.ai/docs/agents/overview
- Mastra workflows: https://mastra.ai/docs/workflows/overview
- Mastra memory: https://mastra.ai/docs/memory/overview
- Mastra RAG: https://mastra.ai/docs/rag/overview
- Mastra MCP: https://mastra.ai/docs/mcp/overview

---

## 4. Complete Future Structure Tree

This tree is a planning target only. Directories marked future must not be created during Current Task.

```txt
apps/
  web/
  admin/
  landing/
  docs/
  worker/
  gateway/
  studio/
  observability/

packages/
  config/
  shared/
  env/
  i18n/
  db/
  auth/
  payment/
  credits/
  mail/
  newsletter/
  notification/
  storage/
  analytics/
  ai/
  design-system/
  api-client/
  logger/
  observability/
  testing/

docs/
  product/
  architecture/
  migration/
  audit/
  runbooks/
  decisions/

contracts/
orchestration/
scripts/
.github/
.codex/
```

---

## 5. Future Directory Ownership Matrix

| Directory | Positioning | Owns | Does not own | Create when | Dependencies | Horizon |
| --- | --- | --- | --- | --- | --- | --- |
| `apps/web` | Current full SaaS app | Dashboard, auth pages, billing, settings, docs content, marketing pages, first AI workspace, app runtime wiring | Cross-app AI contracts, DB schema ownership, future app-specific hard splits | Already exists | All current packages | Current Task onward |
| `apps/admin` | Independent admin console | Users, subscriptions, credits admin, AI usage audit, provider/model management, abuse/rate limit, system agents | Public marketing, docs authoring, user chat UI | After admin surfaces outgrow `apps/web` and package boundaries are stable | `auth`, `db`, `credits`, `payment`, `analytics`, future `ai`, `design-system`, `api-client` | v0.6+ |
| `apps/landing` | Independent marketing site | Home, pricing, features, changelog, legal, SEO landing pages | Auth/session-heavy dashboard, billing actions, AI runtime | After marketing deploy cadence or SEO ownership diverges | `config`, `i18n`, future `design-system`, maybe `analytics` | v0.6+ |
| `apps/docs` | Independent docs site | User docs, developer docs, API docs, self-hosting docs, AI infrastructure docs | SaaS dashboard, billing, runtime API handlers | After docs content needs separate build/deploy/search lifecycle | `config`, `i18n`, future `design-system`, maybe `api-client` for API refs | v0.6+ |
| `apps/worker` | Background job runtime | Trigger.dev tasks, embeddings, indexing, summarization, usage aggregation, webhook retry, long-running agent jobs | Interactive UI, App Router pages | After AI jobs exceed request/route limits or need retries/schedules | `db`, `storage`, `credits`, `analytics`, future `ai`, `logger`, `observability` | v0.6+ |
| `apps/gateway` | Public API / AI gateway | API key auth, model gateway, rate limit, request logging, multi-provider routing, MCP gateway reserve | Dashboard UI, marketing, docs | After public API or provider routing needs independent SLA | `auth`, `db`, `env`, future `ai`, `api-client`, `logger`, `observability` | v0.6+ |
| `apps/studio` | Agent Studio / Workflow Studio | Agent builder, skill builder, workflow builder, prompt testing, tool testing, eval playground | SaaS billing core, public marketing | After AI builder UX becomes a product surface | future `ai`, `design-system`, `api-client`, `db`, `auth`, `analytics` | v0.6+ |
| `apps/observability` | Optional ops console | Logs, traces, evals, cost dashboard, model performance, workflow run inspection | Product dashboard and billing | After AI operations need a dedicated app | future `observability`, `logger`, `ai`, `db`, `analytics` | Long-term |
| `packages/config` | Shared SaaS configuration | Website, plans, provider names, typed config | Secrets, runtime request state, app pages | Already exists | `env` only | Current |
| `packages/shared` | Shared pure helpers | Utilities, constants, generic types, low-level hooks/context | Business domains, DB access, auth session | Already exists | Minimal external deps only | Current |
| `packages/env` | Env validation | Server/client/shared env schema, workspace env loading | Business config, direct provider clients | Already exists | No `@repo/*` deps | Current |
| `packages/i18n` | i18n helper package | Routing, message merging, docs i18n helpers, hreflang, URL helpers | App copy ownership, page content, app navigation state | Already exists | `config`, `env`, `next-intl` | Current |
| `packages/db` | Database ownership | Drizzle schema, migrations, DB connection, DB types | App route handlers, UI, provider clients | Already exists | `env`, Drizzle, postgres | Current |
| `packages/auth` | Auth core | Better Auth server/client helpers, auth types, app callback contracts | App-specific email, credits, newsletter side effects | Already exists | `config`, `db`, `env`, `shared` | Current |
| `packages/payment` | Payment domain | Provider interface, Stripe/Creem providers, checkout/portal/webhook helpers | Credits ledger ownership, auth session lookup, UI | Already exists | `config`, `db`, `env`, `shared` | Current |
| `packages/credits` | Credits domain | Credit balance, ledger, transaction types, distribution helpers | Payment provider integration, UI, AI runtime orchestration | Already exists | `config`, `db` | Current |
| `packages/mail` | Transactional mail | Mail provider interface, render helpers, templates/components | App-specific preview props, auth callbacks, route handlers | Already exists | `config`, `env`, `shared`, React Email | Current |
| `packages/newsletter` | Newsletter domain | Provider interface, subscribe/unsubscribe/status service | App forms, captcha, auth callbacks | Already exists | `config`, `env` | Current |
| `packages/notification` | System notifications | Provider interface, payment/credit notification service | App routes, user-facing inbox, analytics | Already exists | `config`, `env` | Current |
| `packages/storage` | Object storage | S3/R2 provider, upload/delete service, provider config | Browser upload UI, API route auth | Already exists | `config`, `env`, `s3mini` | Current |
| `packages/analytics` | Analytics contracts/helpers | Event names, provider contracts, config helpers, client/server-safe helpers | React providers, script injection, dashboard analytics UI | Already exists | `config`, `env` | Current |
| `packages/ai` | AI infrastructure core | Provider abstraction, model registry, agent/tool/skill/MCP/memory/knowledge contracts, usage/cost types, adapters | React UI, route handlers, Next cookies/session, app pages | After v0.1 scope freeze | `config`, `env`, `shared`, optional AI SDK/Mastra adapters; no `apps/web` | v0.1 |
| `packages/design-system` | Product design system | Primitives, blocks, marketing/docs/AI/dashboard/forms/layouts/icons/tokens/styles/hooks/utils | DB, payment, credits, auth session, server actions, route handlers | After design-system scope freeze and component dependency audit | `shared`, React, styling deps; optional `i18n` only if explicitly designed | v0.7 |
| `packages/api-client` | Typed API client | Public API client, internal typed fetch wrappers, generated contract consumers | Server-only domain logic, direct DB access | After `apps/gateway` or public API contracts exist | Future `contracts`, `auth` token conventions | v0.6+ |
| `packages/logger` | Logging abstraction | Logger interface, structured log fields, redaction helpers | UI, analytics dashboards, persistence by itself | When worker/gateway need consistent logs | `env`, maybe `shared` | v0.6+ |
| `packages/observability` | Traces/evals/cost telemetry | Trace spans, eval run types, model metrics, workflow run inspection contracts | Product analytics events, UI pages | After AI operations need cross-app observability | `logger`, future `ai`, `analytics` | Long-term |
| `packages/testing` | Test utilities | Test factories, fixtures, contract mocks, Playwright helpers | Production runtime code | After real test runner and repeated fixtures exist | Depends on test stack only | Long-term |
| `docs/product` | Product planning | PRD, roadmap, product surfaces, AI roadmap | Runtime implementation | Current Task creates docs here | None | Current Task |
| `docs/architecture` | Architecture planning | Boundaries, layering, split plans, ADR inputs | Runtime implementation | Current Task creates docs here | None | Current Task |
| `docs/migration` | Migration execution plans | Phase plans and historical migration docs | Product PRD | Already exists | None | Current |
| `docs/audit` | Audits | Dependency, boundary, security, UI audits | Implementation | Already exists | None | Current |
| `docs/runbooks` | Operations runbooks | Deploy, rollback, incident, provider outage procedures | Architecture decisions | When operations workflows stabilize | None | v0.6+ |
| `docs/decisions` | ADRs | Approved decisions and trade-offs | Long-form product roadmap | When decisions require durable ADRs | None | v0.1+ |
| `contracts` | Contract specs | OpenAPI, event schemas, API/AI gateway contracts | Runtime code | Only after gateway/API contract scope freeze | Future `api-client`, gateway, worker | v0.6+ |
| `orchestration` | Deployment/job orchestration plans | Infra manifests, workflow definitions if repo-owned | App runtime and packages | Only after worker/gateway deployment plan is approved | Worker/gateway/observability | Long-term |
| `scripts` | Workspace maintenance scripts | Checks, audits, one-off repo tools | App business logic | Already exists | Root/tooling deps | Current |
| `.github` | CI/CD | Workflows, checks, scheduled jobs | App code | Already exists | Root scripts | Current |
| `.codex` | Agent/Codex local metadata | Local agent workflow metadata if used | Product/runtime source | Only if explicitly needed | None | Long-term |

---

## 6. Phased Evolution Route

### Current Task: Monorepo Evolution Planning

Creates only:

- `docs/architecture/AELOKIT_MONOREPO_EVOLUTION_PLAN.md`
- `docs/architecture/AELOKIT_PACKAGE_BOUNDARIES.md`
- `docs/architecture/AELOKIT_APP_SPLIT_PLAN.md`
- `docs/architecture/AI_AGENT_INFRASTRUCTURE_BOUNDARIES.md`
- `docs/architecture/DESIGN_SYSTEM_PLAN.md`
- `docs/architecture/AI_RUNTIME_LAYERING.md`
- `docs/product/AI_AGENT_INFRASTRUCTURE_ROADMAP.md`

Does not create:

- Future app directories.
- Future package directories.
- AI schema files.
- Contracts or orchestration directories.
- Runtime code, API routes, UI components, migrations, dependencies, env updates, or package config changes.

### v0.1: AI Infrastructure Foundation

Create only after explicit user confirmation:

- `packages/ai` package skeleton.
- AI provider/model/agent/tool/skill/memory/knowledge/MCP/usage permission contracts.
- Optional `docs/decisions` ADRs for AI package boundaries.

Do not do:

- Chat UI.
- `packages/db/src/ai.schema.ts`.
- API routes.
- Mastra runtime wiring.
- Credits billing integration.

### v0.2: assistant-ui + AI SDK + Mastra Chat

Create app-layer AI wiring in `apps/web`:

- `apps/web/src/ai` runtime wiring.
- `apps/web/src/app/api/ai` or chosen route namespace.
- `apps/web/src/components/ai` UI components.
- assistant-ui + AI SDK chat path.
- Mastra adapter only where it serves a real agent workflow.

Do not do:

- Multi-app split.
- Full memory/RAG.
- MCP marketplace.

### v0.3: Memory + Knowledge Base

Add AI data model and jobs only after schema scope freeze:

- AI DB schema in `packages/db/src/ai.schema.ts`.
- Memory contracts and persistence.
- Knowledge documents/chunks/embeddings/retrieval metadata.
- Storage relationship for attachments and knowledge source files.

Do not do:

- App split.
- Public gateway.
- Full Studio.

### v0.4: Skills / Tools / MCP

Add:

- Tool registry.
- Skill registry.
- Tool permission contracts.
- MCP server config and remote MCP discovery.
- Tool call logs and permission audit.

Do not do:

- Local stdio MCP by default.
- Unreviewed arbitrary tool execution.

### v0.5: Usage / Credits / Admin Audit

Add:

- Token usage events.
- Cost calculation.
- Credit reservation/settlement model.
- Admin AI usage audit views, initially inside `apps/web`.

Do not do:

- Dedicated `apps/admin` until admin split criteria are met.

### v0.6: Worker / Gateway / Studio Split Evaluation

Evaluate creation of:

- `apps/worker`.
- `apps/gateway`.
- `apps/admin`.
- `apps/studio`.
- `apps/landing`.
- `apps/docs`.

Do not create all apps by default. Split only where operational or product pressure exists.

### v0.7: Design System Sedimentation

Create `packages/design-system` only after:

- Component dependency audit is updated.
- Extraction candidates are classified.
- Token/style ownership is decided.
- Import aliases and package exports are scoped.

Do not create a narrow `packages/ui` unless the decision is explicitly reversed.

### v0.8: CopilotKit / AG-UI Evaluation

Evaluate only after the core AI runtime is stable:

- CopilotKit for in-app copilot workflows.
- AG-UI for agent-user protocol interoperability.

Do not let optional protocols drive core v0.1-v0.5 architecture.

---

## 7. Key Risks

| Risk | Failure mode | Mitigation |
| --- | --- | --- |
| Premature app split | Duplicate auth/env/i18n/build config, unstable deploys | Keep `apps/web` as host until clear split criteria are met |
| `packages/ai` becomes a junk package | Mixed UI, routes, DB access, runtime side effects | Restrict to contracts, registries, adapters, types, errors, permissions |
| Design system becomes narrow or too coupled | Either only button/card/dialog, or business components leak into package | Use `packages/design-system` with explicit product-level boundaries |
| AI schema added too early | Migration churn and broken data contracts | Do schema only after v0.3 schema scope freeze |
| Credits charging before usage semantics are stable | Incorrect billing or user trust issues | Start with usage/cost records, then add reservation/settlement |
| MCP/tool permissions are under-modeled | Security issues and unexpected side effects | Tool permission contracts before enabling user tools |
| Codex over-executes future plan | Future directories/configs created during planning | Keep planning docs explicit: future structure is not current implementation |

---

## 8. Acceptance Criteria

Current Task is complete when:

- The seven requested planning documents exist.
- Future monorepo structure is fully documented.
- Current Task is clearly separated from v0.1.
- `packages/ai` and `packages/design-system` are clearly scoped.
- Every future app has a responsibility boundary and split condition.
- AI runtime layering is documented.
- assistant-ui, Vercel AI SDK, and Mastra responsibilities are separated.
- CopilotKit / AG-UI are documented only as later optional evaluation.
- No future app/package directories are created.
- No schema, migration, contract, orchestration, business code, env, or package config files are modified.
- `AGENTS.md` is not modified.

---

## 9. Recommended AGENTS.md Updates

Do not modify `AGENTS.md` during Current Task. Recommended future update after user confirmation:

```md
## AI Infrastructure Planning Guardrail

When planning AI Agent Infrastructure for AeloKit, distinguish documentation-only planning from implementation. Do not create `packages/ai`, `packages/design-system`, future `apps/*`, AI schema, contracts, orchestration directories, runtime code, API routes, or package config changes unless the task explicitly enters an implementation phase and scope freeze has been confirmed.
```

Recommended reason: this prevents future Codex sessions from turning architecture planning into premature app/package creation.
