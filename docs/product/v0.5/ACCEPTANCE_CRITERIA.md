# AeloKit v0.5 Acceptance Criteria

Status: Approved for implementation
Date: 2026-05-22

## Current Decision

v0.4 embedding blocker is ignored for v0.5 and must not be counted as a v0.5
failure.

## Required PASS Criteria

- `packages/ai` exposes AI usage/billing contracts without importing DB,
  Next.js, provider SDKs, or `@repo/credits`.
- `packages/db` owns AI cost/reservation schema and generated migration.
- Existing `ai_usage` data model is preserved and extended with billing audit
  fields.
- All new billing and reservation statuses have check constraints or TypeScript
  type guards.
- `@repo/credits` owns AI credits preflight, reservation, settlement, refund,
  and status lookup.
- AI runtime does not directly mutate `credit_transaction` or `user_credit`.
- Reservation does not create final usage transaction.
- Settlement creates final usage transaction only once.
- Duplicate settlement is idempotent and does not double charge.
- Failed, aborted, timeout, and rate-limited streams produce refund/no-charge or
  explicit failure status.
- `POST /api/ai/chat` defaults to audit-only when
  `AI_CREDITS_BILLING_ENABLED` is false.
- `POST /api/ai/chat` performs preflight/reservation/settlement only when
  `AI_CREDITS_BILLING_ENABLED` is true.
- AI usage records include billing mode and billing status.
- Cost events are recorded for completed audited usage when usage persistence
  succeeds.
- Admin usage audit query is admin-only.
- Admin usage audit does not return raw message content by default.
- Admin usage audit sanitizes provider secrets, MCP credentials, token-like
  fields, cookies, auth headers, and password-like metadata.
- Admin usage dashboard exists inside `apps/web`.
- No `apps/admin`, `apps/gateway`, or `apps/worker` is created.
- No v0.4 embeddings, knowledge ingestion, vector retrieval, citation smoke, or
  MCP implementation is added.

## Required Validation

- `pnpm --filter @repo/ai typecheck`
- `pnpm --filter @repo/db typecheck`
- `pnpm --filter @repo/credits typecheck`
- `pnpm --filter @repo/web typecheck`
- `pnpm check:env`
- `pnpm check:package-exports`
- `pnpm check:db-shims`
- Targeted billing/admin tests.

## PASS Language

Runtime smoke, DB writes, migrations, and credits mutation must not be marked
PASS unless the command or test actually ran. If any required validation is not
run, the result is PARTIAL with the reason recorded.

