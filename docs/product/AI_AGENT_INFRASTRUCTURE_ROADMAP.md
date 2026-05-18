# AI Agent Infrastructure Roadmap

**Status**: Planning only  
**Current Task**: Monorepo Evolution Planning  
**Date**: 2026-05-18

---

## Roadmap Overview

```txt
Current Task：Monorepo Evolution Planning
v0.1：AI Infrastructure Foundation
v0.2：assistant-ui + AI SDK + Mastra chat
v0.3：Memory + Knowledge Base
v0.4：Skills / Tools / MCP
v0.5：Usage / Credits / Admin Audit
v0.6：Worker / Gateway / Studio 拆分评估
v0.7：Design System 沉淀
v0.8：CopilotKit / AG-UI 评估
```

---

## Current Task: Monorepo Evolution Planning

**Goal**

Create planning documents that define future monorepo structure, package boundaries, app split criteria, AI infrastructure boundaries, design-system direction, runtime layering, and roadmap.

**Scope**

- Documentation only.
- Create the requested files under `docs/architecture` and `docs/product`.
- Clarify current state vs future phases.

**Non-goals**

- No business code.
- No dependencies.
- No migrations.
- No schemas.
- No future app/package directories.
- No `AGENTS.md` or package config changes.

**Prerequisites**

- Read current repo docs, package structure, app structure, and existing migration/audit docs.

**Acceptance Criteria**

- Seven requested docs exist.
- Current Task and v0.1 are clearly separated.
- No forbidden files/directories are created or modified.

**Creates app/package?**

- No.

**Needs user confirmation?**

- Already requested by the user for documentation only. Any implementation after this needs a new confirmation.

---

## v0.1: AI Infrastructure Foundation

**Goal**

Create the reusable AI infrastructure core package boundaries and contracts without building chat UI or DB schema.

**Scope**

- Create `packages/ai` after explicit confirmation.
- Add provider abstraction.
- Add model registry contracts.
- Add agent contracts.
- Add tool and skill registry contracts.
- Add memory and knowledge contracts.
- Add MCP contracts.
- Add usage/cost/permission/error types.
- Add AI SDK and Mastra adapter core types.

**Non-goals**

- No assistant-ui UI.
- No `apps/web/src/app/api/ai` routes.
- No `packages/db/src/ai.schema.ts`.
- No migrations.
- No credits charging.
- No worker/gateway/studio split.

**Prerequisites**

- User approves v0.1 scope freeze.
- Package boundary doc accepted.
- Exports and dependency list approved.

**Acceptance Criteria**

- `packages/ai` has explicit exports.
- It does not import from `apps/web`.
- It does not contain React UI, Next routes, cookies, server actions, or DB schema.
- It typechecks with its own package script.

**Creates app/package?**

- Creates `packages/ai`.

**Needs user confirmation?**

- Yes.

---

## v0.2: assistant-ui + AI SDK + Mastra chat

**Goal**

Add the first working AI chat path inside `apps/web` using assistant-ui and Vercel AI SDK, with Mastra used where agent orchestration is actually needed.

**Scope**

- Add app-local AI UI under `apps/web/src/components/ai`.
- Add app-local runtime wiring under `apps/web/src/ai`.
- Add app-local AI API route under `apps/web/src/app/api/ai` or approved namespace.
- Stream responses via Vercel AI SDK.
- Integrate basic model/provider selection through `packages/ai`.
- Add minimal app-level auth and entitlement checks.

**Non-goals**

- No full memory/RAG.
- No full MCP.
- No dedicated worker/gateway/studio.
- No design-system extraction.
- No broad app split.

**Prerequisites**

- v0.1 completed.
- User approves dependency installation and exact package versions.
- User approves API route naming.

**Acceptance Criteria**

- Authenticated user can send a message and receive a streamed response.
- Runtime uses `packages/ai` contracts instead of ad hoc app-only types.
- No package imports from `apps/web`.
- Usage metadata is at least captured in a route-level shape, even if not billed yet.

**Creates app/package?**

- No new app/package expected.

**Needs user confirmation?**

- Yes, because dependencies and runtime code are required.

---

## v0.3: Memory + Knowledge Base

**Goal**

Add persistent memory and source-grounded knowledge base infrastructure.

**Scope**

- Add AI DB schema after schema scope freeze.
- Add memory persistence contracts and app wiring.
- Add thread summary strategy.
- Add knowledge base, documents, chunks, embeddings, retrieval metadata, sources, citations.
- Connect source files to `@repo/storage`.
- Add background job plan for embeddings and summarization.

**Non-goals**

- No uncontrolled user tool execution.
- No local stdio MCP.
- No app split by default.

**Prerequisites**

- v0.2 chat path stable.
- AI schema reviewed.
- User confirms migration/schema work.
- Storage and retention policy are defined.

**Acceptance Criteria**

- Memory and knowledge are separate concepts in code and docs.
- Knowledge citations can trace back to sources.
- Memory write/delete policy is documented.
- Schema and migrations are generated only after approval.

**Creates app/package?**

- May create `packages/db/src/ai.schema.ts`.
- Does not create new app/package by default.

**Needs user confirmation?**

- Yes, because schema and migration work are involved.

---

## v0.4: Skills / Tools / MCP

**Goal**

Introduce permissioned tools, skills, and MCP connectivity.

**Scope**

- Tool registry.
- Skill registry.
- Tool permission model.
- Built-in tools.
- User-enabled tools.
- Tool call logs.
- MCP server config.
- Remote MCP discovery.
- MCP credential references.

**Non-goals**

- No local stdio MCP by default.
- No arbitrary tool execution without permission.
- No marketplace before audit model exists.

**Prerequisites**

- v0.2 stable chat runtime.
- v0.3 persistence model ready if tool logs are persisted.
- Permission contracts approved.

**Acceptance Criteria**

- Every tool has a permission definition.
- Tool calls are auditable.
- MCP credentials are not exposed to client components.
- Remote MCP is preferred before local stdio MCP.

**Creates app/package?**

- No new app/package expected.

**Needs user confirmation?**

- Yes, because tools and MCP affect security boundaries.

---

## v0.5: Usage / Credits / Admin Audit

**Goal**

Connect AI usage to cost tracking, credits, quota, and admin audit.

**Scope**

- Token usage events.
- Cost events.
- Credit event linkage.
- Quota policy.
- Credit preflight/reservation/settlement design.
- Admin usage dashboard inside `apps/web`.
- Agent, tool call, MCP, knowledge, and cost audit views.

**Non-goals**

- No dedicated `apps/admin` unless split criteria are met.
- No public gateway by default.
- No irreversible billing behavior without review.

**Prerequisites**

- Usage semantics approved.
- Pricing/cost table strategy approved.
- Credits integration policy approved.

**Acceptance Criteria**

- Usage can be audited by user, model, agent, provider, and time.
- Credits ledger remains owned by `@repo/credits`.
- Billing entitlements remain connected to `@repo/payment`.
- Admin can inspect usage without reading raw sensitive content by default.

**Creates app/package?**

- No new app/package expected.

**Needs user confirmation?**

- Yes, because billing/credits behavior is high impact.

---

## v0.6: Worker / Gateway / Studio Split Evaluation

**Goal**

Evaluate whether runtime pressure justifies splitting future apps.

**Scope**

- Evaluate `apps/worker`.
- Evaluate `apps/gateway`.
- Evaluate `apps/admin`.
- Evaluate `apps/studio`.
- Evaluate `apps/landing`.
- Evaluate `apps/docs`.
- Optionally plan `apps/observability`.

**Non-goals**

- Do not create all apps by default.
- Do not split just to match the target tree.
- Do not duplicate package ownership across apps.

**Prerequisites**

- v0.5 AI usage/audit model exists.
- Route ownership map exists.
- Shared package boundaries are stable.
- Deployment implications are reviewed.

**Acceptance Criteria**

- Each proposed app has a split justification.
- Each app has a dependency plan and route ownership plan.
- User confirms each app before creation.

**Creates app/package?**

- Evaluation only by default.
- May create selected apps only after explicit confirmation.

**Needs user confirmation?**

- Yes.

---

## v0.7: Design System Sedimentation

**Goal**

Extract a product-level design system from stable app components.

**Scope**

- Create `packages/design-system` only after confirmation.
- Extract clean primitives.
- Extract reusable product blocks.
- Extract stable AI presentation components.
- Extract dashboard/form/layout patterns.
- Establish token/style ownership.

**Non-goals**

- No business components.
- No auth/session fetching.
- No payment/credits logic.
- No server actions.
- No forced migration of every component.

**Prerequisites**

- Updated UI boundary audit.
- Design-system package boundary accepted.
- First extraction set is small and dependency-clean.

**Acceptance Criteria**

- `packages/design-system` has explicit exports.
- It does not import from apps.
- It can be consumed by `apps/web`.
- Extracted components render from props/slots without business coupling.

**Creates app/package?**

- Creates `packages/design-system` only if confirmed.

**Needs user confirmation?**

- Yes.

---

## v0.8: CopilotKit / AG-UI Evaluation

**Goal**

Evaluate optional agent-user interaction extensions after the core AI runtime is stable.

**Scope**

- Evaluate CopilotKit for in-app copilot surfaces.
- Evaluate AG-UI for agent-user protocol interoperability.
- Decide whether adapters belong in `packages/ai`.

**Non-goals**

- Do not redesign v0.1-v0.5 around optional protocols.
- Do not add dependencies without implementation need.
- Do not duplicate assistant-ui runtime unless justified.

**Prerequisites**

- Core AI chat, memory/knowledge, tools/MCP, and usage audit are stable.
- Clear product use case exists.

**Acceptance Criteria**

- Decision doc compares benefits, costs, and overlap with existing runtime.
- Any adapter has a strict boundary.
- No optional protocol becomes a core dependency without approval.

**Creates app/package?**

- No new app/package expected.

**Needs user confirmation?**

- Yes, especially before dependencies are installed.
