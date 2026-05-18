# AeloKit App Split Plan

**Status**: Planning only  
**Current Task**: Monorepo Evolution Planning  
**Date**: 2026-05-18

---

## 1. Split Strategy

The current default is to keep `apps/web` as the complete SaaS app. Future apps are planned, not created.

App splitting should happen only when at least one condition is true:

- Independent deploy cadence is valuable.
- Runtime requirements differ from `apps/web`.
- Ownership differs enough that one app blocks another.
- Build time or bundle boundaries become a real constraint.
- Security or access-control boundaries require isolation.
- A route surface becomes a product of its own.

Splitting too early would duplicate auth, env, i18n, deployment, analytics, and design-system decisions before the core AI infrastructure is stable.

---

## 2. `apps/web` Current Responsibilities

`apps/web` remains the primary app in the near term.

Owns now:

- SaaS dashboard.
- Auth pages.
- Settings.
- Billing and pricing pages.
- Credits UI.
- Docs content and Fumadocs routing.
- Marketing pages.
- Blog, changelog, roadmap, legal pages.
- Admin pages initial version.
- API routes for auth, search, storage upload, webhooks, distribute credits.
- App-specific provider wiring for auth, payment, mail, newsletter, notification, storage, analytics.

Short-term AI responsibilities:

- First AI workspace.
- App-level AI runtime wiring in future `apps/web/src/ai`.
- App-level AI API routes in future `apps/web/src/app/api/ai`.
- App-level AI UI components in future `apps/web/src/components/ai`.
- Session, locale, billing, credits, and analytics wiring around AI runtime.

Does not own:

- Cross-app AI contracts once `packages/ai` exists.
- AI DB schema ownership once `packages/db/src/ai.schema.ts` exists.
- Future public gateway contracts.
- Future worker job runtime.
- Future design-system ownership after extraction.

---

## 3. Future App Boundaries

| App | Responsibility | Not responsible for | Create condition | Primary dependencies | Horizon |
| --- | --- | --- | --- | --- | --- |
| `apps/admin` | User management, subscriptions, credits management, AI usage audit, provider/model management, abuse/rate limit, system agents | Public marketing, docs site, end-user chat workspace | Admin pages in `apps/web` become operationally complex or require separate access/deploy boundary | `auth`, `db`, `payment`, `credits`, `analytics`, future `ai`, `design-system`, `api-client` | v0.6+ |
| `apps/landing` | Home, pricing, features, changelog, legal, SEO landing pages | Dashboard, billing mutations, AI runtime, admin | Marketing/SEO cadence needs independent deploy or bundle from dashboard | `config`, `i18n`, future `design-system`, `analytics` | v0.6+ |
| `apps/docs` | User docs, developer docs, API docs, AI infrastructure docs, self-hosting docs | SaaS dashboard, billing, app API routes | Docs content/search/deploy needs independent lifecycle | `config`, `i18n`, future `design-system`, maybe `api-client` | v0.6+ |
| `apps/worker` | Trigger.dev tasks, embedding jobs, knowledge indexing, memory summarization, usage aggregation, webhook retry, long-running agent jobs | UI pages, App Router frontend, public API gateway | AI/background jobs exceed route limits or need retry/schedules/queues | `db`, `storage`, `credits`, `analytics`, future `ai`, `logger`, `observability` | v0.6+ |
| `apps/gateway` | Public API, API key auth, model gateway, rate limits, request logging, multi-provider routing, MCP gateway reserve | Dashboard UI, marketing, docs | Public API or model routing needs independent SLA/security boundary | `auth`, `db`, `env`, future `ai`, `api-client`, `logger`, `observability` | v0.6+ |
| `apps/studio` | Agent builder, skill builder, workflow builder, prompt testing, tool testing, eval playground | Core billing and auth implementation, public marketing | Agent builder becomes a major product workflow | future `ai`, `design-system`, `api-client`, `db`, `auth`, `analytics` | v0.6+ |
| `apps/observability` | Logs, traces, evals, cost dashboard, model performance, workflow run inspection | Product dashboard, docs, billing | Operational AI telemetry requires a dedicated app | future `observability`, `logger`, `ai`, `db`, `analytics` | Long-term |

---

## 4. Split Preconditions

Before creating a new app:

1. Boundary document exists and is accepted.
2. Package dependencies are already extracted or intentionally remain app-local.
3. Shared auth/session strategy is documented.
4. Shared env variables are documented and validated.
5. Shared i18n strategy is documented.
6. Route ownership and redirects are mapped.
7. Shared design-system component candidates are audited.
8. Deployment target and root directory are known.
9. CI/turbo task impact is understood.
10. User explicitly confirms app creation.

---

## 5. Suggested Split Order

Recommended order after AI infrastructure reaches v0.5:

1. Keep `apps/web` as the host while AI runtime stabilizes.
2. Consider `apps/worker` first if embeddings, summarization, webhook retry, or long-running agent jobs create real runtime pressure.
3. Consider `apps/admin` when AI audit/provider/model management becomes larger than one admin section.
4. Consider `apps/gateway` when public API keys, rate limits, or multi-provider model routing need independent security and logging.
5. Consider `apps/studio` when agent/workflow builders become a product surface.
6. Consider `apps/landing` and `apps/docs` when marketing/docs deploy cadence or SEO requirements diverge.
7. Consider `apps/observability` only after traces/evals/cost dashboards need an operator-focused product.

This is not a mandate. Split based on real pressure, not on target tree aesthetics.

---

## 6. App-by-App Migration Notes

### 6.1 `apps/admin`

Initial source inside `apps/web`:

- `apps/web/src/app/[locale]/(protected)/admin`
- `apps/web/src/components/admin`
- Relevant user, billing, credits, and AI audit components.

Migration risks:

- Admin auth and role checks must remain consistent with Better Auth roles.
- Admin tables may depend on app-local route handlers or server actions.
- AI usage audit depends on future AI schema and cost event model.

### 6.2 `apps/landing`

Initial source inside `apps/web`:

- `apps/web/src/app/[locale]/(marketing)`
- `apps/web/src/components/blocks`
- `apps/web/src/components/tailark`
- Marketing configuration and i18n messages.

Migration risks:

- Pricing pages may currently depend on billing/session state.
- Marketing components may depend on `next-intl`, `next/link`, and app routes.
- SEO redirects and locale prefixes must be preserved.

### 6.3 `apps/docs`

Initial source inside `apps/web`:

- `apps/web/content/docs`
- `apps/web/src/app/[locale]/docs`
- `apps/web/src/components/docs`
- Fumadocs config and search route.

Migration risks:

- Search index generation and route ownership can drift.
- Docs examples must stay aligned with monorepo packages.
- Locale-specific docs routing must not break existing URLs.

### 6.4 `apps/worker`

Initial source is not created yet.

Candidate tasks:

- Embedding jobs.
- Knowledge indexing.
- Thread summarization.
- Memory consolidation.
- Usage aggregation.
- Webhook retries.
- Long-running agent runs.

Migration risks:

- Shared env access must remain server-only.
- Job idempotency and retry behavior must be designed before moving stateful work.
- Worker must not become a second web app.

### 6.5 `apps/gateway`

Initial source is not created yet.

Candidate surfaces:

- Public REST API.
- AI model gateway.
- API key auth via Better Auth API key model.
- Rate limits.
- Request/response logs.
- MCP gateway reserve.

Migration risks:

- Gateway must not bypass credits, audit, or permission checks.
- Public API contracts should exist before client generation.
- Provider keys and user-provided keys need a clear security model.

### 6.6 `apps/studio`

Initial source is not created yet.

Candidate surfaces:

- Agent builder.
- Skill builder.
- Workflow builder.
- Prompt testing.
- Tool testing.
- Eval playground.

Migration risks:

- Builder UX can leak runtime implementation details.
- Tool permissions and MCP credentials must be modeled before exposing builder flows.
- Studio should consume `packages/ai`, not redefine agent contracts.

### 6.7 `apps/observability`

Initial source is not created yet.

Candidate surfaces:

- Logs.
- Traces.
- Evals.
- Cost dashboards.
- Model performance.
- Workflow run inspection.

Migration risks:

- Product analytics and operational observability must not be confused.
- Sensitive prompts, tool inputs, and user data need redaction rules.
- Retention policies must be defined before broad logging.

---

## 7. Migration Risks

| Risk | Impact | Mitigation |
| --- | --- | --- |
| Duplicate app shell logic | Auth, i18n, theme, analytics drift | Extract only stable shell primitives into design-system or shared helpers |
| App routes moved before redirects are planned | Broken public URLs and SEO | Create route map and redirect plan before split |
| Multiple apps import private web code | Hidden coupling | Move shared code to packages first or keep app-local |
| Worker/gateway bypass credits | Revenue and abuse risk | Centralize usage/credits contracts before gateway/worker |
| Studio creates incompatible agent definitions | Runtime fragmentation | Studio must use `packages/ai` contracts |

---

## 8. Acceptance Criteria for Any Future App Split

- New app has a one-page ownership doc.
- Direct dependencies are declared.
- App does not import from another app.
- Shared package exports exist before migration.
- Existing route behavior is preserved or intentionally redirected.
- Auth, env, i18n, analytics, and deployment behavior are documented.
- User confirms app creation before directories/config are changed.
