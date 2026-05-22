# AeloKit v0.5 Code Acceptance Audit

Date: 2026-05-22
Branch: `dev`
Commit: `36ee755ed5136fa0c7616696e5781dcdbe9131c2`
Auditor: Codex (GPT-5)

## 1. Executive Summary

### Overall Result

PARTIAL

### Summary

- v0.5 code is present in the intended scope: `packages/ai`, `packages/db`, `@repo/credits`, `/api/ai/chat`, and the admin usage page inside `apps/web`.
- All requested static validation commands and targeted tests were actually run in this audit and passed: package typechecks, package lints, `check:env`, `check:package-exports`, `check:db-shims`, and the 15 targeted billing/admin tests.
- `packages/ai` stayed inside a contract-only boundary for usage/billing types and does not import DB, Next.js, provider SDKs, or `@repo/credits`.
- `@repo/credits` correctly owns ledger mutation, and settlement idempotency is enforced by reservation-row locking plus settlement-status checks, not by a unique `credit_transaction.payment_id` constraint.
- The migration was generated and journaled, but it was not applied. Real DB/runtime acceptance therefore remains unverified.
- The admin usage audit query does not join raw message parts by default, but metadata sanitization is incomplete: raw prompt/message/content-like keys can still flow through `providerMetadata` or `billingReference`.
- The billing route can settle more credits than were reserved. Reservation is currently a preflight estimate, not a hard charge ceiling.
- In demo mode, admin audit access is intentionally widened to non-admin authenticated users by existing app policy. That matches current project behavior, but it is weaker than a strict reading of “admin-only”.
- No `apps/admin`, `apps/gateway`, or `apps/worker` directory was created.
- v0.4 embeddings / ingestion / retrieval / citation / MCP blocker remains out of scope and is not counted as a v0.5 failure.

## 2. Scope Confirmation

### In Scope

- `packages/ai` usage/billing contracts
- `packages/db` AI usage billing schema + migration
- `@repo/credits` AI billing service
- `apps/web/src/app/api/ai/chat/route.ts` billing integration
- `apps/web` admin usage audit action, hook, page, table, route wiring, and i18n
- v0.5 validation commands and targeted tests

### Out of Scope

- v0.4 embeddings
- knowledge ingestion
- vector retrieval
- citation retrieval smoke
- MCP/tools implementation
- new app splits such as `apps/admin`

### Explicitly Ignored Blockers

- The current embeddings compatibility blocker documented for v0.4 is ignored for v0.5 by `docs/product/v0.5/SCOPE_FREEZE.md` and `docs/product/v0.5/ACCEPTANCE_CRITERIA.md`.

## 3. Acceptance Criteria Matrix

### AC-001: `packages/ai` exposes AI usage/billing contracts without importing DB, Next.js, provider SDKs, or `@repo/credits`

- Status: PASS
- Evidence: `packages/ai/src/usage/index.ts:1-184`; no forbidden imports were found in this file, and `pnpm --filter @repo/ai typecheck` / `lint` passed.
- Finding: The file defines usage/billing types and constants only. Imports are type-only references to `../models` and `../providers`.
- Risk: P3
- Required Action: None before v0.6.

### AC-002: `packages/db` owns AI cost/reservation schema and generated migration

- Status: PASS
- Evidence: `packages/db/src/ai.schema.ts:365-560`; `packages/db/src/migrations/0012_sad_tarot.sql:1-61`; `packages/db/src/migrations/meta/_journal.json:89-95`.
- Finding: The schema and generated migration live under `packages/db/src`, not under `apps/web/src/db`.
- Risk: P3
- Required Action: None for code-level acceptance.

### AC-003: Existing `ai_usage` data model is preserved and extended with billing audit fields

- Status: PASS
- Evidence: `packages/db/src/ai.schema.ts:368-409`, especially new fields at `403-405`; migration adds only columns at `packages/db/src/migrations/0012_sad_tarot.sql:43-45`.
- Finding: Existing columns remain intact; `billing_mode`, `billing_status`, and `billing_reference` are additive.
- Risk: P3
- Required Action: None before v0.6.

### AC-004: All new billing and reservation statuses have check constraints or TypeScript type guards

- Status: PASS
- Evidence: `packages/ai/src/usage/index.ts:18-58,104`; `packages/db/src/ai.schema.ts:441-447,502-508,550-560`; migration constraints at `packages/db/src/migrations/0012_sad_tarot.sql:17-18,38-40,60-61`.
- Finding: DB check constraints cover `ai_usage`, `ai_cost_event`, and `ai_credit_reservation` status fields; TS contracts mirror the allowed values.
- Risk: P3
- Required Action: None before v0.6.

### AC-005: `@repo/credits` owns AI credits preflight, reservation, settlement, refund, and status lookup

- Status: PASS
- Evidence: `packages/credits/src/ai-billing.ts:598-749`; package exports at `packages/credits/src/index.ts:1-5` and `packages/credits/package.json:7-14`.
- Finding: `preflightAICredits`, `reserveAICredits`, `settleAICredits`, `refundAICredits`, and `getAICreditBillingStatus` are implemented in `@repo/credits`.
- Risk: P3
- Required Action: None before v0.6.

### AC-006: AI runtime does not directly mutate `credit_transaction` or `user_credit`

- Status: PASS
- Evidence: `apps/web/src/app/api/ai/chat/route.ts:10-17` imports only `@repo/credits` service functions; ledger mutation code exists only in `packages/credits/src/ai-billing.ts:244-327,528-565`.
- Finding: The route delegates to `@repo/credits`; it does not import `userCredit` or `creditTransaction`.
- Risk: P3
- Required Action: None before v0.6.

### AC-007: Reservation does not create final usage transaction

- Status: PASS
- Evidence: `packages/credits/src/ai-billing.ts:213-241` inserts only `ai_credit_reservation`; final credits transaction is inserted only during settlement at `314-325`.
- Finding: Reservation creates a reservation row only.
- Risk: P3
- Required Action: None before v0.6.

### AC-008: Settlement creates final usage transaction only once

- Status: PASS
- Evidence: `packages/credits/src/ai-billing.ts:341-377,424-439`; targeted test `packages/credits/src/ai-billing.test.ts:223-255`.
- Finding: Settlement locks the reservation row with `FOR UPDATE`, returns early if already settled, and writes the final `AI_USAGE` transaction only on the first successful settlement.
- Risk: P2
- Required Action: Keep the row-lock/status approach; no code change required for this criterion.

### AC-009: Duplicate settlement is idempotent and does not double charge

- Status: PASS
- Evidence: `packages/credits/src/ai-billing.ts:372-377`; `packages/db/src/app.schema.ts:69-93`; targeted test `packages/credits/src/ai-billing.test.ts:223-255`.
- Finding: Idempotency depends on reservation row locking and `settlement_status='settled'`. `credit_transaction.payment_id` is not unique, so `paymentId = usageId` alone is not the guardrail.
- Risk: P2
- Required Action: None required for v0.6 entry, but production billing should treat reservation row state as the authoritative idempotency key.

### AC-010: Failed, aborted, timeout, and rate-limited streams produce refund/no-charge or explicit failure status

- Status: PASS
- Evidence: `apps/web/src/app/api/ai/chat/route.ts:482-536,695-730,776-816`; refund no-charge path in `packages/credits/src/ai-billing.ts:487-505`; tests at `packages/credits/src/ai-billing.test.ts:345-398`.
- Finding: Failed/aborted flows go through refund/no-charge handling, and timeout/rate-limited stream errors are mapped by `getErrorStatus`.
- Risk: P2
- Required Action: Runtime smoke is still required before production billing.

### AC-011: `POST /api/ai/chat` defaults to audit-only when `AI_CREDITS_BILLING_ENABLED` is false

- Status: PASS
- Evidence: `apps/web/src/app/api/ai/chat/route.ts:377-381,476-478,482`; `apps/web/src/ai/billing-policy.ts:3-18`; test `apps/web/src/ai/billing-policy.test.ts:9-18`.
- Finding: The route skips preflight/reservation/settlement/refund when the flag is off and records audit-only usage.
- Risk: P3
- Required Action: None before v0.6.

### AC-012: `POST /api/ai/chat` performs preflight/reservation/settlement only when `AI_CREDITS_BILLING_ENABLED` is true

- Status: PASS
- Evidence: `apps/web/src/app/api/ai/chat/route.ts:381-458,482-536`.
- Finding: Preflight and reservation run only inside the `creditsBillingEnabled` branch; finalize only settles/refunds when both the flag and a reservation id are present.
- Risk: P3
- Required Action: None before v0.6.

### AC-013: AI usage records include billing mode and billing status

- Status: PASS
- Evidence: `apps/web/src/ai/usage/index.ts:43-46,122-125,161-163`; DB columns at `packages/db/src/ai.schema.ts:403-405`.
- Finding: Usage audit writes `billingMode`, `billingStatus`, and `billingReference` to `ai_usage`.
- Risk: P3
- Required Action: None before v0.6.

### AC-014: Cost events are recorded for completed audited usage when usage persistence succeeds

- Status: PASS
- Evidence: `apps/web/src/app/api/ai/chat/route.ts:539-595`; `apps/web/src/ai/usage/index.ts:183-224`.
- Finding: The route records a cost event only after `recordUsageAudit` succeeds.
- Risk: P2
- Required Action: Add runtime DB verification before production billing.

### AC-015: Admin usage audit query is admin-only

- Status: PARTIAL
- Evidence: `apps/web/src/actions/get-ai-usage-audit.ts:72-81`; `apps/web/src/app/[locale]/(protected)/admin/usage/layout.tsx:14-18`; `apps/web/src/lib/safe-action.ts:43-55`.
- Finding: In normal mode this is admin-only. In demo mode, both the layout and `adminActionClient` intentionally allow non-admin authenticated users.
- Risk: P2
- Required Action: Decide whether demo mode is an accepted exception. If not, tighten the action and layout before v0.6 or before any public demo with sensitive data.

### AC-016: Admin usage audit does not return raw message content by default

- Status: PARTIAL
- Evidence: Query shape omits raw message-part joins in `apps/web/src/actions/get-ai-usage-audit.ts:134-163`; metadata payload includes sanitized `providerMetadata` and `billingReference` at `206-209`; raw-content detection exists but is unused in `apps/web/src/ai/admin-audit-safety.ts:12,26-27,30-55`.
- Finding: The action does not join `ai_message_part.content` or `ai_usage.raw_usage`, which is good. However, raw prompt/message/content-like values can still leak through `providerMetadata` or `billingReference` because sanitization redacts secret-like keys but does not remove raw content keys or values.
- Risk: P1
- Required Action: Must fix before production billing/admin rollout.

### AC-017: Admin usage audit sanitizes provider secrets, MCP credentials, token-like fields, cookies, auth headers, and password-like metadata

- Status: PASS
- Evidence: `apps/web/src/ai/admin-audit-safety.ts:1-10,22-55`; action uses sanitizer at `apps/web/src/actions/get-ai-usage-audit.ts:206-217`; tests at `apps/web/src/ai/admin-audit-safety.test.ts:16-31`.
- Finding: Secret-like key names are redacted recursively for the returned metadata payload.
- Risk: P2
- Required Action: Keep this sanitizer, but extend it to strip raw content-like fields as well.

### AC-018: Admin usage dashboard exists inside `apps/web`

- Status: PASS
- Evidence: `apps/web/src/app/[locale]/(protected)/admin/usage/page.tsx:1-9`; `apps/web/src/app/[locale]/(protected)/admin/usage/layout.tsx:1-46`; `apps/web/src/components/admin/usage-audit-page-client.tsx:16-65`; `apps/web/src/components/admin/usage-audit-table.tsx:110-337`.
- Finding: The dashboard exists inside `apps/web` and includes loading, empty, error, filters, and pagination UI.
- Risk: P3
- Required Action: None before v0.6.

### AC-019: No `apps/admin`, `apps/gateway`, or `apps/worker` is created

- Status: PASS
- Evidence: Workspace directory check returned only `apps` and `apps/web`.
- Finding: No forbidden new app split was present in the repository root app layout.
- Risk: P3
- Required Action: None before v0.6.

### AC-020: No v0.4 embeddings, knowledge ingestion, vector retrieval, citation smoke, or MCP implementation is added

- Status: PASS
- Evidence: v0.5 touched usage/credits/admin files only per the inspected target set and repository structure; current v0.4 embedding blocker is explicitly ignored by `docs/product/v0.5/SCOPE_FREEZE.md` and `ACCEPTANCE_CRITERIA.md`.
- Finding: This audit found no v0.5 scope expansion into new embedding/MCP rollout work.
- Risk: P3
- Required Action: None before v0.6.

## 4. Code-Level Findings

### 4.1 `packages/ai` Contracts

- Boundary is clean. `packages/ai/src/usage/index.ts:1-184` defines types only.
- No DB, Next.js, provider SDK, or `@repo/credits` import was found in the audited contract file.
- There is no runtime side effect beyond declaring `AI_USAGE_STATUS_MAPPING`.
- Billing/status enums align with the DB check constraints in `packages/db/src/ai.schema.ts:441-447,502-508,550-560`.

### 4.2 DB Schema and Migration

- `ai_usage` is extended, not rewritten: `billing_mode`, `billing_status`, and `billing_reference` were added at `packages/db/src/ai.schema.ts:403-405`.
- `ai_cost_event` fits the usage/cost audit need: it links to `ai_usage`, stores token counts, estimated cost/credits, source/status, and metadata at `452-511`.
- `ai_credit_reservation` supports reservation / settlement / refund states via separate status columns and timestamps at `513-560`.
- Migration `0012_sad_tarot.sql` matches the schema additions and the journal entry exists.
- `ai_credit_reservation.usage_id` is intentionally not an FK in code. This is technically reasonable because reservation is created before final `ai_usage` persistence, but the rationale is not documented in schema comments or migration text; it only appears in `VALIDATION_REPORT.md`.
- Migration apply was not run in this audit. Code-level schema presence is verified; runtime DB state is not.

### 4.3 Credits Billing Service

- `preflightAICredits` is balance-only and does not mutate credits: `packages/credits/src/ai-billing.ts:598-627`.
- `reserveAICredits` performs preflight and inserts only `ai_credit_reservation`: `630-684`, with DB insert at `213-241`.
- `settleAICredits` is the only final charge path. The ledger mutation happens in `consumeAICreditsInSettlement` at `244-327`, and the reservation row is locked `FOR UPDATE` at `341-344`.
- Duplicate settlement is prevented by `settlement_status === 'settled'` short-circuiting at `372-377`; test coverage exists at `packages/credits/src/ai-billing.test.ts:223-255`.
- Refund is idempotent for actual refund writes because `refund_status === 'refunded'` short-circuits at `480-485`. Repeated no-charge calls do not create duplicate ledger writes, but they still update the reservation row again.
- Settlement failure is recorded on the reservation row at `389-420`.
- Concurrency note: idempotency relies on reservation row locking/status, not on a unique `credit_transaction.payment_id` constraint. `credit_transaction.payment_id` is just a text column at `packages/db/src/app.schema.ts:69-93`.
- Billing correctness gap: settlement can charge more than `reservedCredits`. The route computes `reservedCredits` before streaming, but settlement later uses actual estimated credits without capping against the reservation amount.

### 4.4 AI Chat Route Billing Flow

- Feature flag off is audit-only: `apps/web/src/app/api/ai/chat/route.ts:377-381,476-478`.
- Feature flag on performs preflight then reservation before streaming: `381-458`.
- Successful stream settles in `finalizeUsageOnce`: `482-503`.
- Failed / aborted / timeout / rate-limited paths go through refund/no-charge in `504-536`, plus outer-catch cleanup in `776-816`.
- `usageFinalized` at `212,468-471` prevents `onFinish` and `onError` from double-finalizing the same request.
- There is still a correctness gap between estimated reservation and final settlement: `reservedCredits` comes from `estimateInitialAICredits` at `134-139`, while settlement uses `estimateCreditsFromTokenUsage` at `475,488`.
- Settlement failure is logged and written into usage billing status via `settlement_failed`, but if the HTTP stream already completed successfully, the user will not see that failure in-stream; it is only visible in audit data/logs.
- Cost events are recorded only after usage audit persistence succeeds at `569-595`.

### 4.5 Admin Usage Audit

- The page is inside `apps/web`, not a new app: `apps/web/src/app/[locale]/(protected)/admin/usage/page.tsx:1-9`.
- Route wiring exists at `apps/web/src/routes.ts:38-40` and sidebar wiring exists at `apps/web/src/config/sidebar-config.tsx:60-75`.
- The server action uses `adminActionClient` and a second permission helper check, but both allow demo-mode non-admin access: `apps/web/src/lib/safe-action.ts:43-55`, `apps/web/src/actions/get-ai-usage-audit.ts:72-81`, `apps/web/src/app/[locale]/(protected)/admin/usage/layout.tsx:14-18`.
- Default query shape does not return raw message parts or `ai_usage.raw_usage`: `apps/web/src/actions/get-ai-usage-audit.ts:134-163`.
- Sensitive metadata sanitization exists, but raw prompt/message/content stripping does not. `isRawMessageContentKey` is only tested and never used in the sanitizer: `apps/web/src/ai/admin-audit-safety.ts:12,26-27,30-55`; `apps/web/src/ai/admin-audit-safety.test.ts:34-37`.
- UI states:
  - loading: `apps/web/src/components/admin/usage-audit-table.tsx:231-233`
  - empty: `278-283`
  - error / permission denied display: `198-203`
  - filters: `128-195`
  - pagination: `288-331`
- The table shows usage / cost / billing / reservation / settlement / refund columns at `209-227`, but cost-event metadata is fetched server-side and not surfaced as its own visible columns.

### 4.6 Env / Package Exports

- Server env flag exists at `packages/env/src/server.ts:69-70` and `env.example:249-251`.
- `pnpm check:env` passed in this audit.
- `pnpm check:package-exports` passed, including `@repo/credits` `./ai-billing` and `@repo/ai` `./usage`.
- `pnpm check:db-shims` passed, confirming DB schema ownership stayed out of `apps/web/src/db`.

### 4.7 Tests

- Ran and passed:
  - `pnpm --filter @repo/ai typecheck`
  - `pnpm --filter @repo/db typecheck`
  - `pnpm --filter @repo/credits typecheck`
  - `pnpm --filter @repo/web typecheck`
  - `pnpm --filter @repo/ai lint`
  - `pnpm --filter @repo/db lint`
  - `pnpm --filter @repo/credits lint`
  - `pnpm --filter @repo/web lint`
  - `pnpm check:env`
  - `pnpm check:package-exports`
  - `pnpm check:db-shims`
  - `pnpm --filter @repo/web exec tsx --test ../../packages/credits/src/ai-billing.test.ts src/ai/billing-policy.test.ts src/ai/admin-audit-safety.test.ts`
- Targeted tests passed: 15/15.
- Not run:
  - `pnpm --filter @repo/db db:migrate`
  - `pnpm --filter @repo/db db:push`
  - authenticated admin browser smoke
  - real `/api/ai/chat` billing smoke with `AI_CREDITS_BILLING_ENABLED=true`
- Impact of not-run items: runtime acceptance remains NOT VERIFIED / PARTIAL even though code-level static validation passed.

## 5. Risk Register

### RISK-001: Admin audit metadata can still leak raw prompt/message content

- Severity: P1
- Area: Admin Usage Audit
- Evidence: `apps/web/src/actions/get-ai-usage-audit.ts:206-217`; `apps/web/src/ai/admin-audit-safety.ts:12,26-27,30-55`
- Impact: `providerMetadata` or `billingReference` can expose prompt/message/content-like fields even though raw message-part tables are not joined.
- Recommendation: Strip or redact keys matching `content`, `message`, `prompt`, and `text` in admin audit payloads by default.

### RISK-002: Final settlement can exceed reserved credits

- Severity: P1
- Area: Billing Flow
- Evidence: reservation estimate at `apps/web/src/app/api/ai/chat/route.ts:134-139,381-383`; final settlement amount at `475,488`; reservation record stores `reservedCredits` at `packages/credits/src/ai-billing.ts:223-226`
- Impact: The user can be charged more credits than were preflighted/reserved if actual usage exceeds the initial estimate.
- Recommendation: Enforce a capped settlement, explicit top-up re-preflight, or a documented approval rule before production billing.

### RISK-003: Admin audit is not strictly admin-only in demo mode

- Severity: P2
- Area: Admin Usage Audit
- Evidence: `apps/web/src/lib/safe-action.ts:43-55`; `apps/web/src/app/[locale]/(protected)/admin/usage/layout.tsx:14-18`
- Impact: Demo-mode authenticated non-admin users can access usage audit data.
- Recommendation: Confirm this exception is intentional. If not, remove the demo bypass before broader rollout.

### RISK-004: Runtime billing path is unverified on a migrated database

- Severity: P2
- Area: DB / Runtime Rollout
- Evidence: Migration exists at `packages/db/src/migrations/0012_sad_tarot.sql:1-61`, but no migration apply or billing-enabled smoke was run in this audit.
- Impact: Code-level acceptance does not prove the live database schema, live stream hooks, or live credits ledger mutations behave correctly.
- Recommendation: Complete the rollout checklist before enabling production billing.

### RISK-005: Cost-event status can hide refund failures as `no_charge`

- Severity: P2
- Area: Usage / Cost Audit
- Evidence: `apps/web/src/app/api/ai/chat/route.ts:579-587`
- Impact: A `refund_failed` billing outcome is written to cost-event status as `no_charge`, which weakens downstream audit clarity.
- Recommendation: Preserve refund-failure semantics in cost-event status or metadata-driven reporting before production billing.

### RISK-006: `ai_credit_reservation.usage_id` no-FK rationale is not documented in schema/migration

- Severity: P3
- Area: DB Schema
- Evidence: `packages/db/src/ai.schema.ts:517`; `packages/db/src/migrations/0012_sad_tarot.sql:21-41`
- Impact: Future maintainers may incorrectly “fix” this into an FK or misunderstand reservation lifecycle ordering.
- Recommendation: Add a schema comment or architecture note when the next DB-touching task opens.

## 6. Runtime Rollout Checklist

- Apply migration: `pnpm --filter @repo/db db:migrate`
- Run authenticated admin smoke on `/[locale]/admin/usage`
- Run controlled billing smoke with `AI_CREDITS_BILLING_ENABLED=true`
- Verify successful settlement rows in DB:
  - `ai_usage`
  - `ai_cost_event`
  - `ai_credit_reservation`
  - `credit_transaction`
  - `user_credit`
- Verify failed stream produces `no_charge` or refund behavior without net charge
- Verify duplicate settlement does not create a second `AI_USAGE` ledger transaction
- Verify admin payload does not leak prompt/message/content through `providerMetadata` or `billingReference`

## 7. Final Decision

- v0.5 code-level accepted: No. Current result is PARTIAL, not PASS.
- v0.6 planning may begin: Yes, but the open billing/admin risks should be carried as explicit gating items.
- Production billing may be enabled: No.
- Must fix first:
  - raw content leakage path in admin audit metadata
  - reservation vs settlement overcharge gap
  - demo-mode admin-audit access policy if strict admin-only behavior is required
  - runtime rollout checklist items, especially migration apply and billing-enabled smoke
