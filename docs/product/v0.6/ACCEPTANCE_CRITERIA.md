# AeloKit v0.6 Acceptance Criteria

## Required PASS Criteria

- v0.6 docs exist under `docs/product/v0.6`.
- Scope freeze clearly states evaluation-only.
- No new app directories are created.
- No runtime code is changed.
- No package dependency is added.
- Every proposed app has split justification.
- Every proposed app has create/defer decision.
- Every proposed app has dependency plan.
- Route ownership map covers current `apps/web` major route groups.
- Dependency plan forbids app-to-app imports.
- Worker/gateway/admin/studio/landing/docs/observability creation requires explicit user confirmation.
- `docs/INDEX.md` is updated only if needed.

## Required Documents

- `docs/product/v0.6/SCOPE_FREEZE.md`
- `docs/product/v0.6/SPLIT_EVALUATION.md`
- `docs/product/v0.6/APP_DECISION_MATRIX.md`
- `docs/product/v0.6/ROUTE_OWNERSHIP_MAP.md`
- `docs/product/v0.6/DEPENDENCY_PLAN.md`
- `docs/product/v0.6/IMPLEMENTATION_PLAN.md`
- `docs/product/v0.6/ACCEPTANCE_CRITERIA.md`
- `docs/product/v0.6/CODEX_PROMPT.md`

## Required Coverage

- `apps/worker`
- `apps/gateway`
- `apps/admin`
- `apps/studio`
- `apps/landing`
- `apps/docs`
- `apps/observability`
- Marketing routes
- Docs routes
- Auth routes
- Dashboard routes
- Settings routes
- Admin routes
- AI chat routes
- Knowledge routes
- Payment routes
- Webhook routes
- Storage/upload routes
- API routes

## Required Decisions

- `Create now`: none by default.
- `Prepare next`: allowed only for candidates with real current pressure and unresolved prerequisites.
- `Defer`: default for candidates without mature product or operational pressure.
- `Reject for now`: allowed for candidates with no current source, no package readiness, or no data model.

## Validation Commands

Required:

```bash
git status --short
find docs/product/v0.6 -maxdepth 1 -type f | sort
```

Recommended docs-only scope check:

```bash
git diff --name-only
git diff --stat
```

If markdown lint exists, it may be run. Do not add a markdown lint dependency during v0.6.

## Must Not Happen

- Do not create `apps/worker`.
- Do not create `apps/gateway`.
- Do not create `apps/admin`.
- Do not create `apps/studio`.
- Do not create `apps/landing`.
- Do not create `apps/docs`.
- Do not create `apps/observability`.
- Do not modify runtime code.
- Do not modify packages.
- Do not modify `package.json`.
- Do not modify `pnpm-lock.yaml`.
- Do not modify CI/CD.
- Do not migrate routes.
- Do not run DB migrations.

## PASS Definition

v0.6 passes only when the repository has a complete evaluation document set and the diff is limited to v0.6 docs plus optional docs index entry.

Runtime smoke, DB smoke, app creation, route migration, dependency installation, and deployment validation are not part of v0.6 acceptance.
