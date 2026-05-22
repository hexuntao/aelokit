# AeloKit v0.5 Validation Report

Status: PASS for code-level acceptance; runtime rollout remains gated by
migration apply and authenticated admin smoke.
Date: 2026-05-22

## Current Decision

v0.4 embedding blocker is ignored for v0.5. This report does not count the
current embeddings / knowledge retrieval / citation controlled smoke blocker as
a v0.5 failure.

## Modified Files

- `docs/product/v0.5/SCOPE_FREEZE.md`
- `docs/INDEX.md`
- `docs/product/v0.5/IMPLEMENTATION_PLAN.md`
- `docs/product/v0.5/ACCEPTANCE_CRITERIA.md`
- `docs/product/v0.5/CREDITS_STATE_MACHINE.md`
- `docs/product/v0.5/CODEX_PROMPT.md`
- `docs/product/v0.5/VALIDATION_REPORT.md`
- `packages/ai/src/usage/index.ts`
- `packages/db/src/ai.schema.ts`
- `packages/db/src/migrations/0012_sad_tarot.sql`
- `packages/db/src/migrations/meta/0012_snapshot.json`
- `packages/db/src/migrations/meta/_journal.json`
- `packages/credits/package.json`
- `packages/credits/src/index.ts`
- `packages/credits/src/types.ts`
- `packages/credits/src/ai-billing.ts`
- `packages/credits/src/ai-billing.test.ts`
- `packages/env/src/server.ts`
- `env.example`
- `apps/web/src/ai/usage/index.ts`
- `apps/web/src/ai/billing-policy.ts`
- `apps/web/src/ai/billing-policy.test.ts`
- `apps/web/src/ai/admin-audit-safety.ts`
- `apps/web/src/ai/admin-audit-safety.test.ts`
- `apps/web/src/actions/get-ai-usage-audit.ts`
- `apps/web/src/hooks/use-ai-usage-audit.ts`
- `apps/web/src/app/api/ai/chat/route.ts`
- `apps/web/src/app/[locale]/(protected)/admin/usage/page.tsx`
- `apps/web/src/app/[locale]/(protected)/admin/usage/layout.tsx`
- `apps/web/src/components/admin/usage-audit-page-client.tsx`
- `apps/web/src/components/admin/usage-audit-table.tsx`
- `apps/web/src/config/sidebar-config.tsx`
- `apps/web/src/routes.ts`
- `apps/web/messages/en.json`
- `apps/web/messages/zh.json`

## Schema / Migration

Generated migration:

- `packages/db/src/migrations/0012_sad_tarot.sql`

Schema changes:

- `ai_usage` gained:
  - `billing_mode`
  - `billing_status`
  - `billing_reference`
- New table `ai_cost_event`.
- New table `ai_credit_reservation`.
- Added check constraints for billing mode/status, cost event source/status,
  reservation status, settlement status, and refund status.

Migration was generated only. It was not applied with `db:migrate`, `db:push`,
or any DB-mutating command.

## Credits State Machine Implemented

Default:

- `AI_CREDITS_BILLING_ENABLED=false`
- `/api/ai/chat` records audit-only usage.
- No credits preflight.
- No reservation.
- No settlement.
- No ledger mutation.

Enabled:

- Preflight verifies current credits through `@repo/credits`.
- Reservation creates `ai_credit_reservation`.
- Successful stream settles through `settleAICredits`.
- Failed, aborted, timeout, or rate-limited stream calls `refundAICredits`.
- Settlement is idempotent; duplicate settlement returns settled status without
  another ledger transaction.
- Refund is idempotent; duplicate refund does not create another refund
  transaction.
- Settlement failure is logged and recorded as `settlement_failed`.

## Feature Flag Behavior

Added server env:

```txt
AI_CREDITS_BILLING_ENABLED=false
```

The flag is server-only in `@repo/env/server` and documented in `env.example`.

## Admin Audit

Added admin page:

- `/[locale]/admin/usage`

The page stays inside `apps/web`; no `apps/admin` was created.

The server action supports:

- `userId`
- `providerId`
- `modelId`
- `status`
- `dateFrom`
- `dateTo`
- pagination

Default payload does not join or return raw message content. Provider metadata
and cost metadata are sanitized for API keys, secrets, credentials, auth
headers, cookies, tokens, and password-like fields.

## Validation Commands

PASS:

```bash
pnpm --filter @repo/ai typecheck
pnpm --filter @repo/ai lint
pnpm --filter @repo/db typecheck
pnpm --filter @repo/db lint
pnpm --filter @repo/credits typecheck
pnpm --filter @repo/credits lint
pnpm --filter @repo/web typecheck
pnpm --filter @repo/web lint
pnpm check:env
pnpm check:package-exports
pnpm check:db-shims
pnpm --filter @repo/web exec tsx --test ../../packages/credits/src/ai-billing.test.ts src/ai/billing-policy.test.ts src/ai/admin-audit-safety.test.ts
```

Targeted tests:

- 15 tests passed.
- Covered preflight success/fail.
- Covered reservation success/fail.
- Covered settlement success/fail.
- Covered duplicate settlement idempotency.
- Covered refund success/fail.
- Covered failed stream no double charge.
- Covered aborted stream no-charge.
- Covered feature flag off audit-only behavior.
- Covered admin permission helper.
- Covered admin metadata sanitization and raw content key detection.

Runtime check:

```bash
pnpm --filter @repo/web dev
curl -I http://localhost:3000/en/admin/usage
```

Result:

- Dev server started at `http://localhost:3000`.
- Unauthenticated admin usage URL returned `307` to
  `/auth/login?callbackUrl=%2Fen%2Fadmin%2Fusage`.

## Not Run

- `pnpm --filter @repo/db db:migrate`
- `pnpm --filter @repo/db db:push`
- Authenticated browser smoke for the admin usage dashboard.
- Real billing stream smoke with `AI_CREDITS_BILLING_ENABLED=true`.

These require an applied migration, authenticated session, and billing rollout
confirmation.

## Known Issues / Follow-up

- `ai_credit_reservation.usage_id` is intentionally not a foreign key because
  the reservation is created before the final `ai_usage` row is inserted after
  streaming. It is unique and indexed.
- Initial reservation uses a conservative token estimate; final settlement uses
  actual provider token usage when available.
- No real credits ledger mutation was executed in validation.
- v0.4 embeddings remain environment-blocked and outside v0.5.

## Acceptance Result

v0.5 code-level acceptance: PASS.

Deployment/runtime acceptance before production billing:

- Apply migration.
- Run authenticated admin dashboard smoke.
- Run a controlled `/api/ai/chat` billing smoke with the feature flag on.
- Confirm settlement and no-charge/refund rows in DB.

v0.6 planning may begin after acknowledging the runtime rollout checklist above.
