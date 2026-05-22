# AeloKit v0.6 Implementation Plan

## Status

Planning only. v0.6 implementation creates evaluation documents and does not create future app directories.

## Allowed Paths

- `docs/product/v0.6/**`
- `docs/INDEX.md`, only to add v0.6 documentation entrypoints

## Forbidden Paths

- `apps/worker/**`
- `apps/gateway/**`
- `apps/admin/**`
- `apps/studio/**`
- `apps/landing/**`
- `apps/docs/**`
- `apps/observability/**`
- Runtime code under `apps/web/**`
- Package code under `packages/**`
- `package.json`
- `pnpm-lock.yaml`
- CI/deployment configuration

## TASK-001: Create v0.6 scope freeze

Goal: define v0.6 as Worker / Gateway / Studio Split Evaluation.

Deliverables:

- `docs/product/v0.6/SCOPE_FREEZE.md`

Acceptance:

- States evaluation-only.
- States no new apps by default.
- Lists in-scope candidate apps and out-of-scope implementation work.
- Carries v0.5 audit/runtime prerequisites.

## TASK-002: Audit current app and route structure

Goal: record the current `dev` branch structure before making split decisions.

Deliverables:

- Structure findings reflected in `SCOPE_FREEZE.md`
- Route findings reflected in `ROUTE_OWNERSHIP_MAP.md`

Acceptance:

- Confirms `apps/web` is the only real app.
- Confirms current `apps/web/src/app` route groups.
- Confirms current package directories.
- Confirms v0.5 code acceptance audit file exists.

## TASK-003: Evaluate future app split candidates

Goal: evaluate every candidate app without creating directories.

Deliverables:

- `docs/product/v0.6/SPLIT_EVALUATION.md`

Acceptance:

- Covers `apps/worker`, `apps/gateway`, `apps/admin`, `apps/studio`, `apps/landing`, `apps/docs`, and `apps/observability`.
- Each app has responsibility, source area, justification, create conditions, required packages, env, permissions, deployment target, data ownership, risks, and recommendation.

## TASK-004: Build app decision matrix

Goal: compare candidate apps with explicit scoring.

Deliverables:

- `docs/product/v0.6/APP_DECISION_MATRIX.md`

Acceptance:

- Scores runtime pressure, security boundary, deploy cadence, route complexity, business maturity, shared package readiness, migration risk, and implementation cost.
- Uses `Create now`, `Prepare next`, `Defer`, or `Reject for now`.
- Does not force `Create now`.

## TASK-005: Build route ownership map

Goal: map current `apps/web` major route groups to future candidate owners.

Deliverables:

- `docs/product/v0.6/ROUTE_OWNERSHIP_MAP.md`

Acceptance:

- Covers marketing, docs, auth, dashboard, settings, admin, AI chat, knowledge, payment, webhook, storage/upload, search, and other API routes.
- Every route defaults to `Move in v0.6: No`.

## TASK-006: Build dependency plan

Goal: define allowed and forbidden dependencies for future apps.

Deliverables:

- `docs/product/v0.6/DEPENDENCY_PLAN.md`

Acceptance:

- Forbids app-to-app imports.
- Requires shared code to move to packages before split.
- Covers worker, gateway, admin, studio, landing, docs, and observability.
- Calls out package readiness gaps and future-only packages.

## TASK-007: Define app creation prerequisites

Goal: make future implementation gates explicit.

Deliverables:

- Prerequisites in `APP_DECISION_MATRIX.md`
- App-specific create conditions in `SPLIT_EVALUATION.md`
- Shared rules and package gaps in `DEPENDENCY_PLAN.md`

Acceptance:

- Every future app requires explicit user confirmation.
- App creation requires route ownership, dependency plan, auth/env/i18n/analytics/deploy plan, and validation commands.

## TASK-008: Create v0.6 acceptance criteria

Goal: define PASS criteria for evaluation-only v0.6.

Deliverables:

- `docs/product/v0.6/ACCEPTANCE_CRITERIA.md`

Acceptance:

- Includes required PASS criteria.
- Documents validation commands.
- Confirms no runtime code, dependencies, app directories, package manifests, lockfile, or CI/deployment config changes.

## TASK-009: Validation report

Goal: validate and report docs-only completion.

Deliverables:

- Final response for this v0.6 planning task.
- A formal `VALIDATION_REPORT.md` can be created only if a future user task asks for it.

Acceptance:

- Runs:
  - `git status --short`
  - `find docs/product/v0.6 -maxdepth 1 -type f | sort`
- Runs a forbidden-path check for app directories, runtime code, package manifests, lockfile, and CI/deployment config changes.
- Reports created files, updated files, no-code-change confirmation, recommended split decision, and user-confirmation questions.

## Future After User Confirmation

Future implementation tasks may create selected apps only after the user confirms:

- Which app to create.
- Which routes/jobs to move or create.
- Which packages are allowed.
- Which env vars are required.
- Which deployment target is used.
- Which validation commands must pass.

Do not list `Create apps/worker` or any other app creation as a v0.6-a evaluation task.
