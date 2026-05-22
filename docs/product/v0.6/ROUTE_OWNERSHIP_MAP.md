# AeloKit v0.6 Route Ownership Map

## Current Rule

All current routes stay in `apps/web` during v0.6. Route movement requires a future implementation task, package boundary review, redirect plan, deployment plan, and explicit user confirmation.

## Route: `/`, `/pricing`, `/about`, `/contact`, `/waitlist`, `/changelog`, `/roadmap`

- Current owner: `apps/web`
- Current files:
  - `apps/web/src/app/[locale]/(marketing)/(home)/page.tsx`
  - `apps/web/src/app/[locale]/(marketing)/pricing/page.tsx`
  - `apps/web/src/app/[locale]/(marketing)/(pages)/about/page.tsx`
  - `apps/web/src/app/[locale]/(marketing)/(pages)/contact/page.tsx`
  - `apps/web/src/app/[locale]/(marketing)/(pages)/waitlist/page.tsx`
  - `apps/web/src/app/[locale]/(marketing)/(pages)/changelog/page.tsx`
  - `apps/web/src/app/[locale]/(marketing)/(pages)/roadmap/page.tsx`
  - `apps/web/src/components/blocks`
  - `apps/web/src/components/pricing`
- Future owner: candidate `apps/landing`
- Move in v0.6: No
- Move condition: separate marketing deploy/SEO ownership, dependency-clean pricing and waitlist pages, redirect plan, and user confirmation.
- Risk: SEO and locale regressions; pricing page may pull billing/runtime dependencies.

## Route: `/blog`, `/blog/*`

- Current owner: `apps/web`
- Current files:
  - `apps/web/src/app/[locale]/(marketing)/blog/(blog)/page.tsx`
  - `apps/web/src/app/[locale]/(marketing)/blog/[...slug]/page.tsx`
  - `apps/web/src/components/blog`
- Future owner: candidate `apps/landing` or `apps/docs`, depending on content strategy.
- Move in v0.6: No
- Move condition: content ownership, URL redirect, search/SEO, and build pipeline are documented.
- Risk: broken slugs, metadata drift, and duplicated content config.

## Route: `/cookie`, `/privacy`, `/terms`

- Current owner: `apps/web`
- Current files:
  - `apps/web/src/app/[locale]/(marketing)/(legal)/cookie/page.tsx`
  - `apps/web/src/app/[locale]/(marketing)/(legal)/privacy/page.tsx`
  - `apps/web/src/app/[locale]/(marketing)/(legal)/terms/page.tsx`
- Future owner: candidate `apps/landing`
- Move in v0.6: No
- Move condition: landing app route map and legal redirect plan are approved.
- Risk: public URL and metadata regressions.

## Route: `/docs`, `/docs/*`, `/docs/llms.mdx/*`

- Current owner: `apps/web`
- Current files:
  - `apps/web/src/app/[locale]/docs/layout.tsx`
  - `apps/web/src/app/[locale]/docs/[[...slug]]/page.tsx`
  - `apps/web/src/app/[locale]/docs/llms.mdx/[[...slug]]/route.ts`
  - `apps/web/content/docs`
  - `apps/web/src/components/docs`
- Future owner: candidate `apps/docs`
- Move in v0.6: No
- Move condition: docs search/index plan, Fumadocs config plan, locale routing, redirects, and user confirmation.
- Risk: docs search drift, broken localized docs URLs, examples drifting from package exports.

## Route: `/auth/login`, `/auth/register`, `/auth/error`, `/auth/forgot-password`, `/auth/reset-password`

- Current owner: `apps/web`
- Current files:
  - `apps/web/src/app/[locale]/auth/layout.tsx`
  - `apps/web/src/app/[locale]/auth/login/page.tsx`
  - `apps/web/src/app/[locale]/auth/register/page.tsx`
  - `apps/web/src/app/[locale]/auth/error/page.tsx`
  - `apps/web/src/app/[locale]/auth/forgot-password/page.tsx`
  - `apps/web/src/app/[locale]/auth/reset-password/page.tsx`
  - `apps/web/src/components/auth`
- Future owner: keep in `apps/web` by default.
- Move in v0.6: No
- Move condition: only move if a future identity surface is intentionally separated with auth/session strategy.
- Risk: login callback and locale redirects can break every protected app.

## Route: `/api/auth/[...all]`

- Current owner: `apps/web`
- Current files:
  - `apps/web/src/app/api/auth/[...all]/route.ts`
  - `apps/web/src/lib/auth`
  - `packages/auth`
- Future owner: keep in `apps/web` until a shared auth deployment boundary is designed.
- Move in v0.6: No
- Move condition: explicit multi-app auth/session strategy and deployment plan.
- Risk: app split can duplicate auth callbacks, cookies, and session configuration.

## Route: `/dashboard`

- Current owner: `apps/web`
- Current files:
  - `apps/web/src/app/[locale]/(protected)/dashboard/page.tsx`
  - `apps/web/src/app/[locale]/(protected)/layout.tsx`
  - `apps/web/src/components/dashboard`
- Future owner: keep in `apps/web`
- Move in v0.6: No
- Move condition: no current split candidate. Dashboard remains the core product app shell.
- Risk: dashboard shell is coupled to protected navigation, auth, settings, and product state.

## Route: `/settings/profile`, `/settings/billing`, `/settings/credits`, `/settings/security`, `/settings/notifications`, `/settings/apikeys`

- Current owner: `apps/web`
- Current files:
  - `apps/web/src/app/[locale]/(protected)/settings/*`
  - `apps/web/src/components/settings`
  - `apps/web/src/actions/get-current-plan.ts`
  - `apps/web/src/actions/get-credit-balance.ts`
  - `apps/web/src/actions/get-credit-stats.ts`
  - `apps/web/src/actions/get-credit-transactions.ts`
  - `apps/web/src/hooks/use-payment.ts`
  - `apps/web/src/hooks/use-credits.ts`
  - `apps/web/src/hooks/use-apikeys.ts`
- Future owner: keep in `apps/web`
- Move in v0.6: No
- Move condition: only move sub-surfaces if a future account app is separately approved.
- Risk: billing, auth, credits, notifications, and API keys are tightly coupled to app session state.

## Route: `/admin/users`, `/admin/usage`

- Current owner: `apps/web`
- Current files:
  - `apps/web/src/app/[locale]/(protected)/admin/users/page.tsx`
  - `apps/web/src/app/[locale]/(protected)/admin/usage/page.tsx`
  - `apps/web/src/components/admin`
  - `apps/web/src/actions/get-users.ts`
  - `apps/web/src/actions/get-ai-usage-audit.ts`
  - `apps/web/src/hooks/use-users.ts`
  - `apps/web/src/hooks/use-ai-usage-audit.ts`
  - `apps/web/src/routes.ts`
  - `apps/web/src/config/sidebar-config.tsx`
- Future owner: candidate `apps/admin`
- Move in v0.6: No
- Move condition: strict admin-only policy, audit redaction, admin service/package boundaries, redirect plan, and user confirmation.
- Risk: demo-mode admin bypass and raw audit metadata risks must not be carried into a separate admin app.

## Route: `/chat`

- Current owner: `apps/web`
- Current files:
  - `apps/web/src/app/[locale]/(protected)/chat/page.tsx`
  - `apps/web/src/components/ai`
  - `apps/web/src/ai`
- Future owner: keep in `apps/web`; possible future `apps/studio` only for builder surfaces, not end-user chat by default.
- Move in v0.6: No
- Move condition: end-user AI workspace split is not part of v0.6. A future split would need product surface approval and runtime boundary documentation.
- Risk: moving chat early can duplicate AI runtime, auth/session, billing, memory, knowledge, and persistence logic.

## Route: `POST /api/ai/chat`

- Current owner: `apps/web`
- Current files:
  - `apps/web/src/app/api/ai/chat/route.ts`
  - `apps/web/src/ai/context`
  - `apps/web/src/ai/runtime`
  - `apps/web/src/ai/persistence`
  - `apps/web/src/ai/usage`
  - `apps/web/src/ai/knowledge`
  - `apps/web/src/ai/memory`
  - `packages/ai`
  - `packages/credits`
  - `packages/db`
- Future owner: keep in `apps/web`; possible future `apps/gateway` only for public/external API after confirmation.
- Move in v0.6: No
- Move condition: public API contract, API key auth, rate limit, usage/credits billing rollout, provider secret strategy, and user confirmation.
- Risk: gateway must not bypass credits, audit, permission, or admin safety boundaries.

## Route: `/knowledge`

- Current owner: `apps/web`
- Current files:
  - `apps/web/src/app/[locale]/(protected)/knowledge/page.tsx`
  - `apps/web/src/components/ai/knowledge-source-form.tsx`
  - `apps/web/src/actions/knowledge.ts`
  - `apps/web/src/ai/knowledge`
  - `packages/storage`
  - `packages/db`
- Future owner: keep in `apps/web`; background processing may later move to `apps/worker`.
- Move in v0.6: No
- Move condition: ingestion/indexing jobs require retry/schedule/long-running execution and user confirms `apps/worker`.
- Risk: v0.4 embedding/vector/retrieval blocker must not be hidden by a worker split.

## Route: `/payment`

- Current owner: `apps/web`
- Current files:
  - `apps/web/src/app/[locale]/(protected)/payment/page.tsx`
  - `apps/web/src/components/payment/payment-card`
  - `apps/web/src/payment`
  - `packages/payment`
  - `packages/credits`
- Future owner: keep in `apps/web`
- Move in v0.6: No
- Move condition: no current app split candidate. Payment provider domain remains in `@repo/payment`.
- Risk: payment pages and callbacks are sensitive and should not be split without a billing-specific plan.

## Route: `/api/webhooks/stripe`, `/api/webhooks/creem`

- Current owner: `apps/web`
- Current files:
  - `apps/web/src/app/api/webhooks/stripe/route.ts`
  - `apps/web/src/app/api/webhooks/creem/route.ts`
  - `apps/web/src/payment`
  - `packages/payment`
  - `packages/credits`
- Future owner: keep in `apps/web`; retry processing may later move to `apps/worker`.
- Move in v0.6: No
- Move condition: webhook retry/idempotency design and worker deployment plan are approved.
- Risk: moving webhooks can break payment provider signatures, credits side effects, and idempotency.

## Route: `/api/storage/upload`

- Current owner: `apps/web`
- Current files:
  - `apps/web/src/app/api/storage/upload/route.ts`
  - `apps/web/src/storage`
  - `packages/storage`
- Future owner: keep in `apps/web`; possible gateway only if public upload API is designed.
- Move in v0.6: No
- Move condition: public upload API, auth/API key policy, storage security model, and user confirmation.
- Risk: upload route must keep auth and server-only storage credentials protected.

## Route: `/api/search`

- Current owner: `apps/web`
- Current files:
  - `apps/web/src/app/api/search/route.ts`
  - `apps/web/src/lib/source`
  - `apps/web/content/docs`
- Future owner: candidate `apps/docs`
- Move in v0.6: No
- Move condition: docs app search/index plan is approved.
- Risk: docs search breaks if content source and locale config drift.

## Route: `/api/ping`

- Current owner: `apps/web`
- Current files:
  - `apps/web/src/app/api/ping/route.ts`
- Future owner: app-specific health check for whichever app owns it.
- Move in v0.6: No
- Move condition: only create app-local health checks during a confirmed app creation task.
- Risk: none if left in place.

## Route: `/api/distribute-credits`

- Current owner: `apps/web`
- Current files:
  - `apps/web/src/app/api/distribute-credits/route.ts`
  - `apps/web/src/credits/distribute.ts`
  - `packages/credits`
  - `.github/workflows/distribute-credits.yml`
- Future owner: candidate `apps/worker`
- Move in v0.6: No
- Move condition: scheduled job runtime and credits job permissions are documented.
- Risk: credits distribution must not bypass `@repo/credits` ownership or run with ambiguous system identity.

## Route: `/api/test/apikey`

- Current owner: `apps/web`
- Current files:
  - `apps/web/src/app/api/test/apikey/route.ts`
  - `apps/web/src/lib/auth`
- Future owner: candidate `apps/gateway`, if public API key verification becomes productized.
- Move in v0.6: No
- Move condition: API key model, route naming, rate limit, and public contract are approved.
- Risk: test routes should not become public gateway contracts by accident.

## Route: `/[locale]/[...rest]`

- Current owner: `apps/web`
- Current files:
  - `apps/web/src/app/[locale]/[...rest]/page.tsx`
- Future owner: keep with whichever app owns localized fallback routing.
- Move in v0.6: No
- Move condition: locale fallback behavior and redirects are redesigned for multi-app routing.
- Risk: catch-all behavior can hide broken route migrations.
