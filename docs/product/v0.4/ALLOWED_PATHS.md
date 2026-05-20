# v0.4 Allowed Paths

状态：READY_FOR_REVIEW

本文件区分当前 planning 回合和 future v0.4 implementation。当前回合只允许写 planning docs。

## 1. Current Planning Round

Allowed writes:

- `docs/product/v0.4/OFFICIAL_DOCS_RESEARCH.md`
- `docs/product/v0.4/PRODUCT_PRD.md`
- `docs/product/v0.4/SCOPE_FREEZE.md`
- `docs/product/v0.4/ACCEPTANCE_CRITERIA.md`
- `docs/product/v0.4/IMPLEMENTATION_PLAN.md`
- `docs/product/v0.4/AI_STACK_DECISION_RECORD.md`
- `docs/product/v0.4/RUNTIME_BOUNDARY_HARDENING_PLAN.md`
- `docs/product/v0.4/CITATION_PERSISTENCE_DESIGN.md`
- `docs/product/v0.4/SMOKE_AND_VECTOR_VERIFICATION_PLAN.md`
- `docs/product/v0.4/ALLOWED_PATHS.md`
- `docs/product/v0.4/CODEX_GOAL_PROMPT.md`
- `docs/product/v0.4/OPEN_QUESTIONS.md` only for planning conflicts.

Forbidden writes in current planning round:

- business code.
- runtime code.
- UI code.
- DB schema.
- migrations.
- `package.json`.
- `pnpm-lock.yaml`.
- `.env` or secret files.
- CI/CD config.
- future app/package directories.

## 2. Future Implementation Read-Only Paths

Future v0.4 implementation may read:

- `docs/INDEX.md`
- `docs/product/v0.4/**`
- `docs/agents/**`
- `AGENTS.md`
- `apps/AGENTS.md`
- `apps/web/AGENTS.md`
- `packages/AGENTS.md`
- `docs/product/AELOKIT_AI_SAAS_PLATFORM_PRD.md`
- `docs/product/AI_AGENT_INFRASTRUCTURE_ROADMAP.md`
- `docs/architecture/AI_RUNTIME_LAYERING.md`
- `docs/architecture/AI_AGENT_INFRASTRUCTURE_BOUNDARIES.md`
- `docs/architecture/AELOKIT_PACKAGE_BOUNDARIES.md`
- `apps/web/src/app/api/ai/chat/route.ts`
- `apps/web/src/ai/**`
- `apps/web/src/components/ai/**`
- `packages/ai/src/**`
- `packages/db/src/ai.schema.ts`
- `packages/db/src/knowledge.schema.ts`
- `packages/db/src/schema.ts`
- `packages/env/src/**`
- relevant package manifests for inspection only.

## 3. Future Implementation Writable Paths by Category

These paths are only writable after user confirms v0.4 implementation and only for the task that owns them.

### Docs and Acceptance Reports

- `docs/product/v0.4/**`

### Runtime Boundary Hardening

- `apps/web/src/app/api/ai/chat/route.ts`
- `apps/web/src/ai/**`
- `apps/web/src/components/ai/**`

### Contracts / Types

- `packages/ai/src/**`

### Tests / Check Scripts

Allowed only if the implementation task explicitly requires them:

- existing nearby test files, if present.
- `scripts/check-*.mjs`, only for boundary checks and only after reading current script style.

## 4. Default Forbidden Paths for v0.4

Forbidden unless a separate confirmed scope update opens them:

- `package.json`
- `apps/web/package.json`
- `packages/*/package.json`
- `pnpm-lock.yaml`
- `packages/db/src/migrations/**`
- `packages/db/src/ai.schema.ts` for writes.
- `packages/db/src/knowledge.schema.ts` for writes.
- `packages/db/src/schema.ts` for writes.
- `apps/web/src/db/**` for real schema.
- `.env`
- `.env.*`
- `.env.example`
- CI/CD files.
- `apps/admin/**`
- `apps/landing/**`
- `apps/docs/**`
- `apps/worker/**`
- `apps/gateway/**`
- `apps/studio/**`
- `packages/design-system/**`
- `packages/api-client/**`
- `packages/logger/**`
- `packages/observability/**`
- `packages/testing/**`

## 5. DB Command Gate

These commands are forbidden without explicit user confirmation at execution time:

- `pnpm --filter @repo/db db:enable-pgvector`
- `pnpm --filter @repo/db db:generate`
- `pnpm --filter @repo/db db:migrate`
- `pnpm --filter @repo/db db:push`
- any destructive SQL.
- any seed script that writes DB state.

## 6. Dependency Gate

No dependency install or manifest edit is allowed by default. If future v0.4 requires a dependency change, first produce:

- exact package list.
- exact version/range.
- install command.
- affected files.
- why existing dependencies are insufficient.
- rollback command.

Wait for user confirmation before changing manifests or lockfile.
