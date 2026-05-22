# AeloKit v0.6 Scope Freeze

## Status

Planning approved for evaluation only.

## Theme

Worker / Gateway / Studio Split Evaluation

## Current Decision

v0.6 does not create new apps by default.

## In Scope

- Evaluate `apps/worker`
- Evaluate `apps/gateway`
- Evaluate `apps/admin`
- Evaluate `apps/studio`
- Evaluate `apps/landing`
- Evaluate `apps/docs`
- Optionally evaluate `apps/observability`
- Produce split decision matrix
- Produce route ownership map
- Produce dependency plan
- Produce app creation prerequisites

## Out of Scope

- Creating new app directories
- Moving routes out of `apps/web`
- Installing dependencies
- Changing runtime code
- Changing CI
- Changing deployment config
- Creating Trigger.dev worker
- Creating public API gateway
- Creating admin app
- Creating studio app
- Creating docs or landing app
- Creating observability app

## Hard Boundaries

- No app split without explicit user confirmation.
- No app can import from another app.
- Shared code must move to packages before app split.
- Runtime, auth, env, i18n, analytics, deployment, and route ownership must be documented before app creation.

## Read Set

v0.6 planning is based on:

- `docs/product/AI_AGENT_INFRASTRUCTURE_ROADMAP.md`
- `docs/architecture/AELOKIT_MONOREPO_EVOLUTION_PLAN.md`
- `docs/architecture/AELOKIT_APP_SPLIT_PLAN.md`
- `docs/architecture/AELOKIT_PACKAGE_BOUNDARIES.md`
- `docs/architecture/AI_AGENT_INFRASTRUCTURE_BOUNDARIES.md`
- `docs/architecture/AI_RUNTIME_LAYERING.md`
- `docs/product/v0.5/SCOPE_FREEZE.md`
- `docs/product/v0.5/VALIDATION_REPORT.md`
- `docs/product/v0.5/V0_5_CODE_ACCEPTANCE_AUDIT.md`

## Current Repository Snapshot

- Current branch checked during planning: `dev`.
- Current app directories: `apps/web` only.
- No `apps/worker`, `apps/gateway`, `apps/admin`, `apps/studio`, `apps/landing`, `apps/docs`, or `apps/observability` directory exists.
- Current AI chat route remains `apps/web/src/app/api/ai/chat/route.ts`, exposed as `POST /api/ai/chat`.
- Current admin pages remain under `apps/web/src/app/[locale]/(protected)/admin`.
- Current docs content remains under `apps/web/content/docs`.
- Current marketing, docs, auth, dashboard, settings, payment, storage, webhook, and AI routes remain owned by `apps/web`.

## v0.5 Carry-Forward Notes

v0.5 code-level validation and v0.5 acceptance audit disagree on final wording:

- `docs/product/v0.5/VALIDATION_REPORT.md` says code-level acceptance is `PASS`, with runtime rollout still gated by migration apply and authenticated/admin/billing smokes.
- `docs/product/v0.5/V0_5_CODE_ACCEPTANCE_AUDIT.md` says overall result is `PARTIAL`, and records unresolved production rollout risks.

v0.6 planning may continue, but future app creation must carry these prerequisites:

- Do not use an app split to bypass unresolved admin audit safety issues.
- Do not enable production AI billing before migration apply, authenticated admin smoke, and controlled billing smoke.
- Do not create `apps/admin` until strict admin access policy and audit payload redaction are confirmed.
- Do not create `apps/gateway` until credits preflight/reservation/settlement semantics are production-ready.

## Default Decision

No v0.6 task creates an app directory. Every future app remains a candidate that requires a separate user-confirmed implementation task.
