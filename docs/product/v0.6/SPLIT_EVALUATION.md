# AeloKit v0.6 Split Evaluation

## Evaluation Summary

v0.6 is an evaluation phase. The current repository has one real app, `apps/web`, and the existing package layer already owns most cross-app domains. The conservative decision is:

- Create now: none.
- Prepare next: `apps/worker`, `apps/admin`, `apps/docs`.
- Defer: `apps/gateway`, `apps/studio`, `apps/landing`.
- Reject for now: standalone `apps/observability`.

The main reason to prepare without creating is that route ownership, runtime rollout, strict permissions, package readiness, and deployment targets are not yet fully documented or confirmed for any new app.

## apps/worker

### Proposed Responsibility

Background job runtime for AI and SaaS work that should not run inside request/response routes: embedding jobs, knowledge indexing, memory consolidation, thread summarization, usage aggregation, webhook retries, scheduled maintenance, and long-running agent runs.

### Current Source Area in apps/web

- No dedicated worker source exists.
- Current AI runtime and knowledge work lives in `apps/web/src/ai`.
- Current knowledge page and actions live in `apps/web/src/app/[locale]/(protected)/knowledge/page.tsx` and `apps/web/src/actions/knowledge.ts`.
- Current webhook route handlers live in `apps/web/src/app/api/webhooks/*`.
- Current credits distribution endpoint lives in `apps/web/src/app/api/distribute-credits/route.ts`.
- Current CI has `.github/workflows/distribute-credits.yml`.

### Split Justification

The worker has the strongest operational split case because embeddings, ingestion, summarization, retries, and long-running agent workflows can exceed route timeouts and need retry/idempotency behavior. It also keeps scheduled or asynchronous AI work out of the web request path.

### Do Not Split Yet If

- v0.4 knowledge ingestion and embedding runtime remains environment-blocked.
- No repeatable background job has exceeded current route limits.
- Job idempotency, retry policy, queue provider, and deployment target are not documented.
- v0.5 migration/runtime rollout is still unverified.

### Create Conditions

- At least one concrete job is approved for worker execution.
- Job queue/runtime provider is selected and documented.
- Idempotency keys, retry behavior, failure states, and observability fields are documented.
- `@repo/db`, `@repo/storage`, `@repo/credits`, and `@repo/ai` integration points are stable.
- User explicitly confirms `apps/worker` creation.

### Required Packages

- Existing: `@repo/env`, `@repo/db`, `@repo/storage`, `@repo/credits`, `@repo/ai`, `@repo/analytics`, `@repo/shared`.
- Future only if confirmed: `@repo/logger`, `@repo/observability`.

### Required Routes / Jobs

- Embedding generation.
- Knowledge indexing.
- Memory consolidation.
- Usage/cost aggregation.
- Webhook retry.
- Scheduled credits or cleanup tasks.
- Long-running agent/workflow runs.

### Required Env

- Server-only DB, storage, provider, embedding, queue/runtime, and optional observability env.
- No worker secret may be exposed to client env.

### Required Permissions

- System job identity.
- User/resource ownership checks before processing user data.
- Admin-only controls for retry, cancel, and replay if exposed.

### Required Deployment Target

Separate background runtime or scheduled job target. The exact target is not selected in v0.6.

### Data Ownership

Schema remains in `@repo/db`. Files remain in `@repo/storage`. Credits ledger mutation remains in `@repo/credits`. AI contracts remain in `@repo/ai`. Worker owns execution, not domain data definitions.

### Risks

- Duplicate runtime wiring outside `apps/web`.
- Jobs bypass credits, audit, permission, or consent checks.
- Failed jobs create partial AI records without clear recovery.
- Worker becomes a second web app instead of a job runtime.

### Recommendation

Prepare only.

## apps/gateway

### Proposed Responsibility

Public API and AI gateway boundary: API key authentication, rate limits, request logging, usage audit, AI model routing, public API contracts, and possibly future MCP gateway behavior.

### Current Source Area in apps/web

- No dedicated gateway source exists.
- Current AI chat route lives at `apps/web/src/app/api/ai/chat/route.ts`.
- Current Better Auth route lives at `apps/web/src/app/api/auth/[...all]/route.ts`.
- Current API key test route lives at `apps/web/src/app/api/test/apikey/route.ts`.
- Current webhooks, storage upload, search, and distribute-credits routes live under `apps/web/src/app/api`.

### Split Justification

A gateway becomes useful when public APIs, API keys, rate limits, provider routing, and independent SLA/security policies need a boundary separate from the product web app.

### Do Not Split Yet If

- There is no public API contract.
- API key auth, rate limits, and usage audit semantics are not production-ready.
- v0.5 credits billing has not completed runtime rollout.
- Public gateway would duplicate `/api/ai/chat` without a clear external use case.

### Create Conditions

- Public API contract and versioning policy are approved.
- API key auth and rate limiting are implemented through stable package boundaries.
- Gateway usage must call credits/audit/permission services and must not bypass them.
- Provider secret and BYOK strategy are documented.
- User explicitly confirms `apps/gateway` creation.

### Required Packages

- Existing: `@repo/auth`, `@repo/db`, `@repo/env`, `@repo/ai`, `@repo/credits`, `@repo/analytics`, `@repo/shared`.
- Future only if confirmed: `@repo/api-client`, `@repo/logger`, `@repo/observability`.

### Required Routes / Jobs

- Public API routes under a versioned namespace.
- AI gateway route, if approved.
- API key verification route.
- Rate limit and usage audit middleware.

### Required Env

- Server-only provider keys, gateway signing keys, rate limit store env, and API key hashing/verification settings.

### Required Permissions

- API key owner identity.
- Role and entitlement checks.
- Per-key rate limits.
- Tool, MCP, and model permissions before any AI execution.

### Required Deployment Target

Separate API service or edge/serverless app after deployment strategy is approved.

### Data Ownership

Gateway owns transport and policy enforcement. Domain data stays in `@repo/db`, auth/API key semantics in `@repo/auth`, credits ledger in `@repo/credits`, and AI contracts in `@repo/ai`.

### Risks

- Bypassing credits billing or audit.
- Exposing provider secrets or user data.
- Creating incompatible public contracts too early.
- Duplicating app-local AI runtime from `apps/web`.

### Recommendation

Defer.

## apps/admin

### Proposed Responsibility

Independent admin console for user management, subscriptions, credits management, AI usage audit, provider/model management, abuse review, rate limit inspection, and system agent oversight.

### Current Source Area in apps/web

- `apps/web/src/app/[locale]/(protected)/admin/users/page.tsx`
- `apps/web/src/app/[locale]/(protected)/admin/usage/page.tsx`
- `apps/web/src/app/[locale]/(protected)/admin/*/layout.tsx`
- `apps/web/src/components/admin`
- `apps/web/src/actions/get-users.ts`
- `apps/web/src/actions/get-ai-usage-audit.ts`
- `apps/web/src/hooks/use-users.ts`
- `apps/web/src/hooks/use-ai-usage-audit.ts`

### Split Justification

Admin has a real current source area and a security boundary. It becomes worth splitting when admin-only workflows are large enough to deserve independent auth, deploy, and audit policies.

### Do Not Split Yet If

- Admin has only a small users/usage section.
- Demo-mode non-admin access remains unresolved.
- Admin audit payload redaction is not production-ready.
- Shared admin components/actions still depend on `apps/web` private aliases.

### Create Conditions

- Strict admin-only access policy is confirmed, including demo behavior.
- Raw AI content redaction and audit payload rules are approved.
- Admin actions are moved behind package-safe service boundaries before route migration.
- Redirects and locale strategy are documented.
- User explicitly confirms `apps/admin` creation.

### Required Packages

- Existing: `@repo/auth`, `@repo/db`, `@repo/credits`, `@repo/payment`, `@repo/analytics`, `@repo/ai`, `@repo/i18n`, `@repo/config`, `@repo/shared`.
- Future only if confirmed: `@repo/design-system`, `@repo/api-client`, `@repo/logger`, `@repo/observability`.

### Required Routes / Jobs

- `/admin/users`
- `/admin/usage`
- Future provider/model management.
- Future abuse/rate-limit review.
- Future tool/MCP/knowledge audit views.

### Required Env

- Server-only auth, DB, payment, credits, AI audit, analytics, and optional observability env.

### Required Permissions

- Strict admin role enforcement.
- Optional system/operator role if introduced.
- No raw message content by default.
- Explicit permission for sensitive audit detail.

### Required Deployment Target

Separate web app only after auth/session sharing, locale routing, and deployment root are documented.

### Data Ownership

Admin owns views and operational actions. User, payment, credits, AI usage, and audit data stay in their existing packages and schemas.

### Risks

- Admin app imports private `apps/web` actions/components.
- Demo-mode policy leaks sensitive audit data.
- Admin UI becomes coupled to raw provider metadata.
- Split duplicates auth/i18n/theme shell logic.

### Recommendation

Prepare only.

## apps/studio

### Proposed Responsibility

Agent Studio for agent builder, skill builder, workflow builder, prompt testing, tool testing, and eval playground.

### Current Source Area in apps/web

- No dedicated studio route exists.
- Current AI chat UI lives in `apps/web/src/components/ai`.
- Current AI runtime wiring lives in `apps/web/src/ai`.
- Current AI contracts live in `packages/ai`.
- Current knowledge page is `apps/web/src/app/[locale]/(protected)/knowledge/page.tsx`.

### Split Justification

Studio should split only when builder workflows become a product surface rather than a set of settings around the existing chat workspace.

### Do Not Split Yet If

- Agent/tool/workflow builder scope is not defined.
- v0.4 tools/MCP permissions are not stable.
- Studio would redefine agent contracts instead of consuming `@repo/ai`.
- No design-system or API client boundary exists.

### Create Conditions

- Agent, tool, skill, workflow, and eval contracts are stable in `@repo/ai`.
- Permissions and MCP credential policy are approved.
- Studio UI flows and route map are documented.
- User explicitly confirms `apps/studio` creation.

### Required Packages

- Existing: `@repo/ai`, `@repo/auth`, `@repo/db`, `@repo/analytics`, `@repo/i18n`, `@repo/shared`, `@repo/storage` if file inputs are part of builder flows.
- Future only if confirmed: `@repo/design-system`, `@repo/api-client`, `@repo/observability`.

### Required Routes / Jobs

- Agent builder.
- Skill builder.
- Workflow builder.
- Prompt test playground.
- Tool test playground.
- Eval playground.

### Required Env

- Server-only AI provider and eval env only through approved server boundaries.
- No provider secret in client UI.

### Required Permissions

- User-owned builder resources.
- Tool and MCP permission checks.
- Admin/system restrictions for shared agents or public templates.

### Required Deployment Target

Separate web app only after builder UX becomes independently valuable.

### Data Ownership

Studio owns builder UI and workflow composition. It must consume `@repo/ai` contracts and must not redefine agent, tool, skill, workflow, or permission contracts.

### Risks

- Contract fragmentation.
- Tool execution exposed before permissions are mature.
- Provider secrets leak into playground payloads.
- Studio duplicates `apps/web` runtime wiring.

### Recommendation

Defer.

## apps/landing

### Proposed Responsibility

Independent marketing site for home, pricing, features, blog, changelog, roadmap, waitlist, contact, and legal pages.

### Current Source Area in apps/web

- `apps/web/src/app/[locale]/(marketing)`
- `apps/web/src/components/blocks`
- `apps/web/src/components/pricing`
- `apps/web/src/components/blog`
- `apps/web/src/components/changelog`
- `apps/web/src/components/contact`
- `apps/web/src/components/waitlist`
- `apps/web/messages/*`

### Split Justification

Landing split is justified by separate SEO/deploy cadence or a marketing-owned build pipeline. The current runtime pressure is low.

### Do Not Split Yet If

- Marketing and product deploy cadence are still the same.
- Pricing or waitlist pages depend on app auth/payment runtime.
- Design-system extraction has not happened.
- Redirects and locale SEO plan are not documented.

### Create Conditions

- Marketing route ownership and redirects are approved.
- Pricing, analytics, i18n, and SEO metadata are dependency-clean.
- Shared presentational components are moved to package boundaries after confirmation.
- User explicitly confirms `apps/landing` creation.

### Required Packages

- Existing: `@repo/config`, `@repo/i18n`, `@repo/analytics`, `@repo/shared`.
- Future only if confirmed: `@repo/design-system`.

### Required Routes / Jobs

- `/`
- `/pricing`
- `/about`
- `/contact`
- `/waitlist`
- `/changelog`
- `/roadmap`
- `/blog`
- `/cookie`
- `/privacy`
- `/terms`

### Required Env

- Public analytics env only when needed.
- No server-only SaaS runtime secrets by default.

### Required Permissions

- None for public marketing pages.
- Admin/editor access only if a CMS is later introduced.

### Required Deployment Target

Separate static or Next.js marketing deployment after SEO and redirects are planned.

### Data Ownership

Landing owns content and presentation. Billing, credits, auth, AI runtime, and payment mutations remain out of scope.

### Risks

- SEO regressions from locale and route movement.
- Pricing page accidentally imports payment runtime.
- Duplicate design components before design-system extraction.

### Recommendation

Defer.

## apps/docs

### Proposed Responsibility

Independent documentation site for user docs, developer docs, API docs, AI infrastructure docs, and self-hosting docs.

### Current Source Area in apps/web

- `apps/web/content/docs`
- `apps/web/src/app/[locale]/docs`
- `apps/web/src/app/api/search/route.ts`
- `apps/web/src/components/docs`
- `apps/web/src/lib/source`
- Fumadocs configuration under the web app.

### Split Justification

Docs has a clear content surface and could benefit from independent build/search lifecycle. It should still wait until routing, locale, search indexing, and component dependencies are documented.

### Do Not Split Yet If

- Docs content and app release cadence are still coupled.
- Fumadocs config depends on app-local aliases that are not extracted.
- Search route migration and redirects are not planned.
- API docs contracts do not exist yet.

### Create Conditions

- Docs route map, search route, and locale behavior are documented.
- Shared docs components are dependency-clean or moved after confirmation.
- Existing docs URLs can be preserved or redirected.
- User explicitly confirms `apps/docs` creation.

### Required Packages

- Existing: `@repo/config`, `@repo/i18n`, `@repo/analytics`, `@repo/shared`.
- Future only if confirmed: `@repo/design-system`, `@repo/api-client` for generated API references.

### Required Routes / Jobs

- `/docs`
- `/docs/*`
- `/docs/llms.mdx/*`
- `/api/search` or replacement docs search endpoint.
- Docs content build/index job if separated.

### Required Env

- Search/index env only if the docs app introduces external search.
- Public analytics env only when needed.

### Required Permissions

- None for public docs.
- Editor/admin permission only if docs authoring is later added.

### Required Deployment Target

Separate docs deployment only after search/index and redirect strategy are approved.

### Data Ownership

Docs owns content and docs search presentation. Product data, auth, billing, credits, and AI runtime stay outside the docs app.

### Risks

- Broken docs URLs and locale behavior.
- Search index drift.
- Docs examples drift from package exports and current implementation.
- Fumadocs config duplicated across apps.

### Recommendation

Prepare only.

## apps/observability

### Proposed Responsibility

Operator-focused app for logs, traces, evals, cost dashboards, model performance, workflow run inspection, and production AI runtime visibility.

### Current Source Area in apps/web

- No dedicated observability source exists.
- Current product analytics helpers live in `packages/analytics` and `apps/web/src/analytics`.
- Current admin usage audit lives under `apps/web/src/app/[locale]/(protected)/admin/usage`.

### Split Justification

Observability could become useful once AI workflows produce traces/evals and require an operator console separate from product analytics and admin usage pages.

### Do Not Split Yet If

- There is no `@repo/logger` or `@repo/observability`.
- Retention and redaction policy is not defined.
- Runtime traces, evals, workflow runs, and model metrics do not exist yet.
- Admin usage audit is enough for current operational needs.

### Create Conditions

- Logger and observability package boundaries are approved.
- Redaction, retention, and access policy are documented.
- Trace/eval/workflow data model exists.
- User explicitly confirms `apps/observability` creation.

### Required Packages

- Existing: `@repo/auth`, `@repo/db`, `@repo/ai`, `@repo/analytics`, `@repo/env`, `@repo/shared`.
- Future only if confirmed: `@repo/logger`, `@repo/observability`, `@repo/design-system`.

### Required Routes / Jobs

- Trace explorer.
- Eval run explorer.
- Cost/model performance dashboard.
- Workflow run inspection.
- Redaction review tooling.

### Required Env

- Server-only telemetry store, logging, tracing, and redaction env.

### Required Permissions

- Strict operator/admin permissions.
- Sensitive prompt/tool data hidden by default.
- Explicit access escalation for raw trace detail.

### Required Deployment Target

Separate internal app only after telemetry data and package boundaries exist.

### Data Ownership

Observability should own operational views only. Product analytics remains in `@repo/analytics`; raw traces/evals require separate package and redaction rules.

### Risks

- Mixing product analytics with operational telemetry.
- Exposing raw prompts, tool inputs, secrets, or user data.
- Creating a new app before telemetry data exists.
- Duplicating admin usage dashboard work.

### Recommendation

Reject for now.
