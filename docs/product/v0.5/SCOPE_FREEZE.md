# AeloKit v0.5 Scope Freeze

Status: Approved for implementation
Date: 2026-05-22
Theme: Usage / Credits / Admin Audit

## Current Decision

v0.4 embedding blocker is ignored for v0.5.

The current API key / `OPENAI_BASE_URL` does not support OpenAI-compatible
embeddings, so v0.4 knowledge retrieval and citation controlled smoke cannot
reach full PASS in the current environment. This is an environment blocker and
does not block v0.5.

v0.5 does not fix or re-verify:

- Embeddings.
- Knowledge ingestion.
- Vector retrieval.
- Citation retrieval smoke.
- v0.4 MCP/tools implementation.
- `apps/admin` split.

## Goals

- Mature AI usage audit into usage + cost + credits billing facts.
- Keep `@repo/credits` as the only credits ledger mutation owner.
- Add AI credits preflight, reservation, settlement, refund, and no-charge
  handling.
- Add feature-flagged billing flow to `POST /api/ai/chat`.
- Keep default behavior audit-only unless `AI_CREDITS_BILLING_ENABLED` is true.
- Add an admin usage audit surface inside `apps/web`.

## In Scope

- `packages/ai` usage/billing contracts only.
- `packages/db` schema and migration for AI cost events and AI credit
  reservations.
- `@repo/credits` AI billing service boundary:
  - `preflightAICredits`
  - `reserveAICredits`
  - `settleAICredits`
  - `refundAICredits`
  - `getAICreditBillingStatus`
- `/api/ai/chat` billing integration behind `AI_CREDITS_BILLING_ENABLED`.
- AI usage billing mode and billing status audit.
- Failed, aborted, timeout, and rate-limited billing outcomes.
- Admin usage audit query and page inside `apps/web`.
- Tests for credits billing state transitions, feature flag behavior, and admin
  audit safety.

## Out of Scope

- v0.4 embeddings, ingestion, vector, citation, MCP, or tools implementation.
- New app creation, including `apps/admin`, `apps/gateway`, or `apps/worker`.
- Marketplace.
- BYOK.
- Team-level quota.
- Irreversible billing behavior without explicit review.
- Admin raw message content access by default.
- AI runtime direct mutation of credits ledger tables.
- Moving AI runtime, DB, route, UI, or credits logic into `packages/ai`.

## Hard Boundaries

- `packages/ai` remains contracts/types/adapters/runtime-types only.
- AI runtime may call `@repo/credits` service functions, but must not directly
  write `credit_transaction` or `user_credit`.
- Reservation is not final charging.
- Settlement is the only AI billing step that can create final credits usage
  transactions.
- Failed, aborted, timeout, and rate-limited requests must resolve to refund,
  no-charge, or explicit failure status.
- Settlement failure must be recorded and must not be silently swallowed.
- Duplicate settlement must not duplicate credits ledger mutation.
- Provider secrets, MCP credentials, and hidden sensitive metadata must not be
  exposed to client or admin audit payloads.

