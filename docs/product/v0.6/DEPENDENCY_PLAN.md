# AeloKit v0.6 Dependency Plan

## Shared Rules

- App cannot import from another app.
- Shared code must live in packages.
- Server-only secrets must stay in server env.
- UI primitives should not depend on business logic.
- AI runtime should not bypass credits/audit/permission boundaries.

## Additional Rules

- New app creation must not modify `package.json` or lockfiles until the app implementation is explicitly confirmed.
- Future-only packages such as `@repo/design-system`, `@repo/api-client`, `@repo/logger`, and `@repo/observability` must not be created during v0.6 evaluation.
- Direct app aliases such as `@/actions`, `@/components`, `@/ai`, `@/payment`, `@/credits`, or `@/storage` cannot cross app boundaries.
- Package exports must exist before a new app consumes shared code.
- Provider secrets, payment secrets, storage secrets, AI provider keys, MCP credentials, and API key material must remain server-only.

## App Dependency Plans

### apps/worker

Allowed packages:

- `@repo/env`
- `@repo/db`
- `@repo/storage`
- `@repo/credits`
- `@repo/ai`
- `@repo/analytics`
- `@repo/shared`
- Future after confirmation: `@repo/logger`, `@repo/observability`

Forbidden packages:

- Any `apps/web` import.
- React UI components from `apps/web/src/components`.
- `@repo/payment` provider SDK paths unless a specific payment retry job is approved.
- Client env exports.
- Direct credits ledger table mutation outside `@repo/credits`.

Reason:

`apps/worker` may need `@repo/db`, `@repo/storage`, `@repo/credits`, and `@repo/ai` because background jobs can process knowledge sources, usage/cost facts, and AI workflows. It should execute jobs, not define schemas, UI, or business ownership.

### apps/gateway

Allowed packages:

- `@repo/auth`
- `@repo/db`
- `@repo/env`
- `@repo/ai`
- `@repo/credits`
- `@repo/analytics`
- `@repo/shared`
- Future after confirmation: `@repo/api-client`, `@repo/logger`, `@repo/observability`

Forbidden packages:

- Any `apps/web` import.
- `apps/web/src/ai` runtime wiring unless first extracted into package-safe boundaries.
- UI components.
- Direct payment provider SDKs.
- Direct storage upload helpers unless public upload API is approved.
- Direct credits ledger mutation.

Reason:

`apps/gateway` needs API key auth, rate limit, usage audit, permission checks, and credits billing before it can route public AI traffic. It must not be a shortcut around `/api/ai/chat` billing and audit safeguards.

### apps/admin

Allowed packages:

- `@repo/auth`
- `@repo/db`
- `@repo/credits`
- `@repo/payment`
- `@repo/analytics`
- `@repo/ai`
- `@repo/i18n`
- `@repo/config`
- `@repo/shared`
- Future after confirmation: `@repo/design-system`, `@repo/api-client`, `@repo/logger`, `@repo/observability`

Forbidden packages:

- Any private `apps/web` action, hook, or component import after split.
- Raw AI message content by default.
- Client access to provider secrets or MCP credentials.
- Direct credits ledger mutation outside `@repo/credits`.
- Direct payment side effects outside `@repo/payment`.

Reason:

`apps/admin` depends on admin-only actions and role checks. Current admin surfaces already exist in `apps/web`, but strict admin access and safe audit payload rules must be confirmed before an independent app is created.

### apps/studio

Allowed packages:

- `@repo/ai`
- `@repo/auth`
- `@repo/db`
- `@repo/analytics`
- `@repo/i18n`
- `@repo/shared`
- `@repo/storage`, only if builder flows use files or knowledge sources
- Future after confirmation: `@repo/design-system`, `@repo/api-client`, `@repo/observability`

Forbidden packages:

- Redefining agent, tool, skill, memory, knowledge, workflow, or MCP contracts outside `@repo/ai`.
- Any `apps/web` import.
- Direct provider secret access in client code.
- Credits ledger mutation.
- Unpermissioned tool or MCP execution.

Reason:

`apps/studio` should consume `@repo/ai` contracts. It cannot become a second source of truth for agent definitions or tool permissions.

### apps/landing

Allowed packages:

- `@repo/config`
- `@repo/i18n`
- `@repo/analytics`
- `@repo/shared`
- Future after confirmation: `@repo/design-system`

Forbidden packages:

- `@repo/db`
- `@repo/auth` server runtime, except future explicitly approved auth links/helpers.
- `@repo/payment` provider runtime.
- `@repo/credits`
- `@repo/ai` runtime.
- `@repo/storage` server runtime.
- Any `apps/web` import.

Reason:

`apps/landing` should stay mostly static/public. It should not depend on DB/auth/payment/credits/AI runtime unless a specific user-confirmed product requirement changes that boundary.

### apps/docs

Allowed packages:

- `@repo/config`
- `@repo/i18n`
- `@repo/analytics`
- `@repo/shared`
- Future after confirmation: `@repo/design-system`, `@repo/api-client`

Forbidden packages:

- `@repo/db`
- `@repo/auth` runtime.
- `@repo/payment`
- `@repo/credits`
- `@repo/ai` runtime.
- Provider secrets.
- Any `apps/web` import after split.

Reason:

`apps/docs` should own public documentation, docs routing, and docs search. It should not depend on SaaS runtime state. Generated API references may later consume `@repo/api-client` or contract specs after they exist.

### apps/observability

Allowed packages:

- `@repo/auth`
- `@repo/db`
- `@repo/ai`
- `@repo/analytics`
- `@repo/env`
- `@repo/shared`
- Future after confirmation: `@repo/logger`, `@repo/observability`, `@repo/design-system`

Forbidden packages:

- Any `apps/web` import.
- Raw prompts, tool inputs, secrets, cookies, auth headers, or credentials by default.
- Treating product analytics as the operational trace store.
- Direct credits ledger mutation.
- Provider secret access in client code.

Reason:

`apps/observability` is rejected for now because no telemetry package, redaction policy, retention policy, or trace/eval data model exists. It should be reconsidered only after observability package boundaries exist.

## Package Readiness Gaps

- `@repo/design-system` does not exist and must not be created in v0.6.
- `@repo/api-client` does not exist and must not be created in v0.6.
- `@repo/logger` does not exist and must not be created in v0.6.
- `@repo/observability` does not exist and must not be created in v0.6.
- Existing `apps/web` private aliases must be extracted before another app can consume shared behavior.
- v0.5 runtime rollout remains gated by migration apply and authenticated/billing smoke before gateway or worker can rely on production billing semantics.
