# AeloKit v0.5 Codex Prompt

Implement AeloKit v0.5: Usage / Credits / Admin Audit.

Read first:

1. `docs/INDEX.md`
2. `docs/product/AI_AGENT_INFRASTRUCTURE_ROADMAP.md`
3. `docs/architecture/AI_AGENT_INFRASTRUCTURE_BOUNDARIES.md`
4. `docs/product/v0.4/OPEN_QUESTIONS.md`
5. `packages/ai/src/usage/index.ts`
6. `packages/db/src/ai.schema.ts`
7. `apps/web/src/ai/usage/index.ts`
8. `apps/web/src/app/api/ai/chat/route.ts`
9. `packages/credits/src/index.ts`
10. `packages/credits/src/ledger.ts`
11. `packages/credits/src/service.ts`
12. `packages/credits/src/types.ts`
13. `packages/payment`
14. `packages/auth`
15. `apps/web/src/app`
16. `apps/web/src/components`

Current decision:

v0.4 embedding blocker is ignored for v0.5. Do not fix or reclassify v0.4
embeddings, knowledge ingestion, vector retrieval, citation retrieval smoke,
v0.4 MCP/tools implementation, or `apps/admin` split as part of v0.5.

Implement:

- v0.5 docs.
- `@repo/ai` usage/billing contracts only.
- `packages/db` AI cost/reservation schema and migration.
- `@repo/credits` AI preflight/reservation/settlement/refund/status service.
- Feature-flagged `/api/ai/chat` billing flow with
  `AI_CREDITS_BILLING_ENABLED`.
- Admin usage audit query and dashboard inside `apps/web`.
- Targeted tests.
- `VALIDATION_REPORT.md`.

Do not:

- Create a new app.
- Let provider secrets enter client payloads.
- Let `packages/ai` import DB, credits, Next.js, or provider SDK runtime.
- Let AI runtime directly mutate credits ledger tables.
- Charge credits when the feature flag is off.
- Settle without a reservation id.
- Silently swallow settlement failure.
- Double charge duplicate settlement.

