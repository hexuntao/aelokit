# AeloKit v0.6 Codex Prompt

## Purpose

Use this prompt for future Codex work around v0.6 split evaluation and app creation. It separates v0.6-a evaluation-only work from v0.6-b app creation after explicit user confirmation.

## v0.6-a: evaluation only

You are working in `/Users/tao/work/aelokit` on branch `dev`.

Task:

- Review `docs/product/v0.6/SCOPE_FREEZE.md`.
- Review `docs/product/v0.6/SPLIT_EVALUATION.md`.
- Review `docs/product/v0.6/APP_DECISION_MATRIX.md`.
- Review `docs/product/v0.6/ROUTE_OWNERSHIP_MAP.md`.
- Review `docs/product/v0.6/DEPENDENCY_PLAN.md`.
- Review `docs/product/v0.6/IMPLEMENTATION_PLAN.md`.
- Review `docs/product/v0.6/ACCEPTANCE_CRITERIA.md`.

Rules:

- Do not create app directories without explicit confirmation.
- Do not create `apps/worker`.
- Do not create `apps/gateway`.
- Do not create `apps/admin`.
- Do not create `apps/studio`.
- Do not create `apps/landing`.
- Do not create `apps/docs`.
- Do not create `apps/observability`.
- Do not move routes out of `apps/web`.
- Do not install dependencies.
- Do not modify runtime code.
- Do not modify packages.
- Do not modify `package.json` or `pnpm-lock.yaml`.
- Do not modify CI/CD.
- Do not run DB migrations.

Expected output:

- Findings about split readiness.
- Updated v0.6 docs only, if the user asks for doc refinements.
- No code changes.

Validation:

```bash
git status --short
find docs/product/v0.6 -maxdepth 1 -type f | sort
git diff --name-only
```

## v0.6-b: create selected app after user confirmation

Only use this section after the user explicitly confirms a selected app creation.

Before coding, require the user-confirmed app name:

- `apps/worker`
- `apps/gateway`
- `apps/admin`
- `apps/studio`
- `apps/landing`
- `apps/docs`
- `apps/observability`

Required read set:

- `AGENTS.md`
- Nearest `AGENTS.md` files for every target path
- `docs/INDEX.md`
- `docs/product/v0.6/SCOPE_FREEZE.md`
- `docs/product/v0.6/SPLIT_EVALUATION.md`
- `docs/product/v0.6/APP_DECISION_MATRIX.md`
- `docs/product/v0.6/ROUTE_OWNERSHIP_MAP.md`
- `docs/product/v0.6/DEPENDENCY_PLAN.md`
- `docs/product/v0.6/ACCEPTANCE_CRITERIA.md`
- Any app-specific confirmation message from the user

Before implementation, produce a 3-5 bullet plan that includes:

- Selected app and exact purpose.
- Routes/jobs to move or create.
- Allowed files.
- Dependencies/package manifests to touch, if any.
- Validation commands.

Hard rule:

Do not create app directories without explicit confirmation.

App-specific gates:

- `apps/worker`: require job runtime, retry/idempotency, permissions, env, deployment target, and no bypass of credits/audit/permission boundaries.
- `apps/gateway`: require public API contract, API key auth, rate limit, usage audit, credits billing readiness, secret strategy, and deployment target.
- `apps/admin`: require strict admin-only policy, demo-mode decision, audit redaction, admin service boundaries, route redirects, and deployment target.
- `apps/studio`: require stable `@repo/ai` builder contracts, tool/MCP permissions, provider secret strategy, and builder route map.
- `apps/landing`: require marketing route map, SEO/redirect plan, i18n plan, analytics plan, and dependency-clean presentation components.
- `apps/docs`: require docs route map, Fumadocs/search plan, locale/redirect plan, and content ownership.
- `apps/observability`: require logger/observability package boundaries, telemetry data model, redaction policy, retention policy, and operator permissions.

Validation after implementation must include:

- File scope check.
- Package manifest check.
- App-specific typecheck/lint when code is created.
- Route behavior or redirect verification when routes move.
- No app-to-app import check.

If the user has not confirmed app creation, stop at v0.6-a evaluation.
