# AI Agent Infrastructure Roadmap

**Status**: Planning only  
**Current Task**: Monorepo Evolution Planning  
**Date**: 2026-05-18

---

## Roadmap Overview

```txt
Current Task：Monorepo Evolution Planning
v0.1：AI Contracts + Data Model Foundation
v0.2：assistant-ui + AI SDK + Mastra Chat + Minimal Persistence
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

## v0.1: AI Contracts + Data Model Foundation

**Goal**

Create the reusable AI infrastructure core package with stable contracts, lightweight adapter type surfaces, and a frozen minimal AI data model before any app runtime is implemented.

**Scope**

- Create `packages/ai` after explicit confirmation.
- Add provider contracts.
- Add model registry contracts.
- Add agent contracts.
- Add tool, skill, and MCP contracts.
- Add memory and knowledge contracts.
- Add usage/cost/permission/error types.
- Add lightweight Vercel AI SDK adapter types.
- Add lightweight Mastra adapter types.
- Add runtime type definitions.
- Freeze the minimal AI data model needed by v0.2 chat persistence, without necessarily generating migration files.

**Non-goals**

- No assistant-ui UI.
- No `apps/web/src/app/api/ai` routes.
- No `packages/db/src/ai.schema.ts`.
- No migrations.
- No real Vercel AI SDK runtime calls.
- No real Mastra agent instances.
- No provider SDK initialization.
- No DB queries.
- No credits charging.
- No credits ledger mutation.
- No user session, cookies, or headers.
- No worker/gateway/studio split.

**Prerequisites**

- User approves v0.1 scope freeze.
- Package boundary doc accepted.
- Exports and dependency list approved.
- Minimal AI data model is reviewed and accepted as a contract before schema work.

**Acceptance Criteria**

- `packages/ai` has explicit exports.
- It does not import from `apps/web`.
- It does not contain React UI, Next routes, cookies, server actions, or DB schema.
- It exposes only contracts, runtime type definitions, and lightweight adapter type surfaces.
- It contains no live AI SDK/Mastra runtime execution.
- The minimal AI data model required by v0.2 is documented and frozen.
- It typechecks with its own package script.

**Creates app/package?**

- Creates `packages/ai`.

**Needs user confirmation?**

- Yes.

---

## v0.2: assistant-ui + AI SDK + Mastra Chat + Minimal Persistence

**Goal**

Add the first working AI chat path inside `apps/web` using assistant-ui and Vercel AI SDK, with Mastra used in-process where agent orchestration is actually needed, and persist the minimal chat data needed for product use.

**Scope**

- Add app-local AI UI under `apps/web/src/components/ai`.
- Add app-local runtime wiring under `apps/web/src/ai`.
- Add the first AI chat route at `apps/web/src/app/api/ai/chat/route.ts`, exposed as `POST /api/ai/chat`.
- Stream responses via Vercel AI SDK.
- Integrate assistant-ui with the AI SDK chat path.
- Use Mastra in-process only where a chat workflow needs agent/tool orchestration.
- Integrate basic model/provider selection through `packages/ai` contracts.
- Add minimal user-level model setting: user default model, per-chat `modelId`, and fallback to the system default provider/model.
- Add minimal thread/message persistence.
- Allow creation of minimal `packages/db/src/ai.schema.ts` after separate schema/migration confirmation.
- Minimal schema covers `ai_provider`, `ai_model`, `ai_user_model_setting`, `ai_agent`, `ai_thread`, `ai_message`, `ai_message_part`, `ai_tool_call`, and `ai_usage`.
- Add minimal app-level auth and entitlement checks.
- Record usage audit data only: `userId`, `threadId`, `messageId`, provider, model, input/output tokens, estimated cost, creation time, request status, and failure reason when applicable.

**Non-goals**

- No credits charging.
- No credits reservation.
- No credits settlement.
- No refund handling.
- No plan quota enforcement through credits.
- No failed-call billing rollback.
- No full memory/RAG.
- No full MCP.
- No per-agent advanced model policy.
- No BYOK or multi-provider key management.
- No team-level model policy.
- No complex model pricing management UI.
- No complete model capability matrix management.
- No dedicated worker/gateway/studio.
- No design-system extraction.
- No broad app split.

**Prerequisites**

- v0.1 completed.
- User approves dependency installation and exact package versions.
- User approves creating `POST /api/ai/chat`.
- User approves minimal AI schema and migration work before any schema file or migration is created.
- Minimal AI data model freeze from v0.1 is accepted.

**Acceptance Criteria**

- Authenticated user can send a message and receive a streamed response.
- Runtime uses `packages/ai` contracts instead of ad hoc app-only types.
- No package imports from `apps/web`.
- `/api/ai/chat` is the only first streaming route; `/api/chat` is not used.
- User default model and per-chat model selection fallback correctly to the system default when unset.
- Threads, messages, message parts, tool calls, and usage audit records can be persisted.
- Usage is auditable but does not mutate the credits ledger.

**Creates app/package?**

- No new app/package expected.
- May create minimal AI schema and route/UI/runtime files only as part of the future v0.2 implementation after explicit confirmation.

**Needs user confirmation?**

- Yes, because dependencies, runtime code, route creation, schema, and migration work are required.

---

## v0.3: Memory + Knowledge Base

**Goal**

Add persistent memory, thread summaries, and source-grounded knowledge base infrastructure on top of the stable chat path.

**Scope**

- Extend AI DB schema after v0.3 schema scope freeze.
- Add user memory, agent memory, project memory, and thread summary persistence.
- Add memory write confirmation and deletion policies.
- Add thread summary strategy.
- Add knowledge base, documents, chunks, embeddings, retrieval metadata, sources, citations.
- Connect source files to `@repo/storage`.
- Add background job plan for embeddings and summarization.

**Non-goals**

- No uncontrolled user tool execution.
- No local stdio MCP.
- No complete tool marketplace.
- No credits billing enforcement.
- No app split by default.

**Prerequisites**

- v0.2 chat path stable.
- v0.2 minimal schema and chat persistence are stable.
- v0.3 schema extensions are reviewed.
- User confirms migration/schema work.
- Storage and retention policy are defined.

**Acceptance Criteria**

- Memory and knowledge are separate concepts in code and docs.
- Knowledge citations can trace back to sources.
- Memory write/delete policy is documented.
- Schema and migrations are generated only after approval.

**Creates app/package?**

- May extend `packages/db/src/ai.schema.ts` with memory and knowledge tables.
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

- Usage and cost dashboard.
- Mature token usage events and cost events.
- Credit preflight.
- Credit reservation.
- Credit settlement.
- Refund and failed request handling.
- Quota policy and plan entitlement integration.
- Admin usage dashboard inside `apps/web`.
- Agent, tool call, MCP, knowledge, and cost audit views.

**Non-goals**

- No dedicated `apps/admin` unless split criteria are met.
- No public gateway by default.
- No irreversible billing behavior without review.
- No admin app split unless `apps/web` admin surfaces meet the split criteria.

**Prerequisites**

- Usage semantics approved.
- Pricing/cost table strategy approved.
- Credits integration policy approved.
- v0.2 usage audit records are stable enough to become billing inputs.
- Failure/refund semantics are documented.

**Acceptance Criteria**

- Usage can be audited by user, model, agent, provider, and time.
- Credits ledger remains owned by `@repo/credits`.
- AI runtime performs preflight/reservation/settlement through `@repo/credits` instead of mutating ledger tables directly.
- Billing entitlements remain connected to `@repo/payment`.
- Failed requests and refunds have explicit handling.
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
