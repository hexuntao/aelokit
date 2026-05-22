# AeloKit v0.5 Implementation Plan

Status: Approved for implementation
Date: 2026-05-22

## TASK-001: v0.5 Documents

Create v0.5 planning documents:

- `SCOPE_FREEZE.md`
- `IMPLEMENTATION_PLAN.md`
- `ACCEPTANCE_CRITERIA.md`
- `CREDITS_STATE_MACHINE.md`
- `CODEX_PROMPT.md`

Each document must state that the v0.4 embedding blocker is ignored for v0.5.

## TASK-002: AI Usage / Billing Contracts

Update `packages/ai/src/usage/index.ts` with contract-only types:

- `AIUsageBillingMode`
- `AIUsageBillingStatus`
- `AICreditBillingReference`
- `AICostEvent`
- `AICreditReservationStatus`
- `AICreditSettlementStatus`
- `AICreditRefundStatus`

No DB access, Next.js imports, provider SDK initialization, or credits package
dependency is allowed.

## TASK-003: DB Schema and Migration

Update `packages/db/src/ai.schema.ts`:

- Extend `ai_usage` with billing mode/status/reference fields.
- Add `ai_cost_event`.
- Add `ai_credit_reservation`.
- Add check constraints for status fields.
- Preserve existing `ai_usage` columns and semantics.

Generate a migration from `packages/db/src/schema.ts`.

## TASK-004: `@repo/credits` AI Billing Service

Add `packages/credits/src/ai-billing.ts` and export it from the package.

The service owns:

- Preflight balance check.
- Reservation record creation.
- Idempotent settlement and final credits transaction.
- Refund or no-charge handling.
- Status lookup.
- Structured error codes.

The service must not import app code, auth runtime, payment provider code, React,
Next.js, or AI runtime packages.

## TASK-005: `/api/ai/chat` Billing Flow

Add `AI_CREDITS_BILLING_ENABLED` server feature flag.

When false:

- Keep audit-only behavior.
- Do not preflight.
- Do not reserve.
- Do not settle.
- Do not mutate credits.

When true:

- Run preflight before streaming.
- Create a reservation before streaming.
- Settle only after successful completion.
- Refund or no-charge failed, aborted, timeout, or rate-limited flows.
- Record usage billing status and cost event.

## TASK-006: Admin Usage Audit Query

Add an admin-only server action or API route in `apps/web` that supports:

- Usage list.
- Usage detail metadata.
- Cost events.
- Credit reservation status.
- Filters by user, provider, model, status, and date range.

Default response must not include raw message content, provider secrets, MCP
credentials, or sensitive hidden metadata.

## TASK-007: Admin Usage Dashboard

Add an admin usage audit page inside `apps/web`.

The page must include:

- Loading state.
- Empty state.
- Error state.
- Permission-denied state.
- Filters.
- Pagination.
- Usage, cost, billing, reservation, settlement, and refund columns.

Do not create `apps/admin`.

## TASK-008: Tests

Add targeted tests for:

- Credits preflight success/fail.
- Reservation success/fail.
- Settlement success/fail.
- Refund success/fail.
- Duplicate settlement idempotency.
- Failed stream no double charge.
- Aborted stream refund/no-charge.
- Feature flag off keeps audit-only.
- Admin permission check.
- Admin API does not return raw content by default.

## TASK-009: Validation Report

Create `docs/product/v0.5/VALIDATION_REPORT.md` with:

- Modified file list.
- Schema/migration notes.
- Final credits state machine.
- Feature flag behavior.
- Test commands and results.
- Known incomplete items.
- v0.5 acceptance result.

