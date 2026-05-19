# AI Mastra Memory Knowledge v0.3 Implementation Plan

本文档把 v0.3：Mastra-first Memory + Knowledge Integration 拆成可单独执行、单独验证、单独提交的 TASK。

执行规则：

- 每次只执行一个 TASK。
- 每个 TASK 开始前必须重新读取 `ENTRYPOINT`、`SCOPE_FREEZE`、`ACCEPTANCE`、`OPEN_QUESTIONS`、`TASKS`。
- 涉及 Mastra / AI SDK / assistant-ui / provider SDK / embedding / vector / storage / deployment 的 TASK 必须先核对官方最新文档。
- 涉及依赖、env、schema、migration、DB 命令或 lockfile 的 TASK 必须先等待用户确认。
- helper/service/runtime skeleton 未接入 `/api/ai/chat` 或 UI 时，必须标记 `PARTIAL UNTIL WIRED`。

## 1. Phase Summary

| TASK | Title | Type | Main path status |
| --- | --- | --- | --- |
| TASK-001 | v0.3 planning docs review only | docs/review | N/A |
| TASK-002 | Mastra dependency / runtime placement decision | plan | N/A |
| TASK-003 | Mastra dependency + env + package boundary setup | setup after confirmation | PARTIAL UNTIL WIRED |
| TASK-004 | App-local Mastra runtime skeleton | runtime skeleton | PARTIAL UNTIL WIRED |
| TASK-005 | Mastra Memory minimal integration | runtime integration | Must wire `/api/ai/chat` |
| TASK-006 | User-confirmed memory UI | UI integration | Must wire UI |
| TASK-007 | Mastra Knowledge minimal ingestion | ingestion | PARTIAL UNTIL RETRIEVAL WIRED |
| TASK-008 | Knowledge retrieval into `/api/ai/chat` | runtime integration | Must wire `/api/ai/chat` |
| TASK-009 | Citation/source rendering | UI + persistence metadata | Must wire UI |
| TASK-010 | v0.3 integration acceptance | validation | N/A |

## 2. TASK-001: v0.3 Planning Docs Review Only

Goal: review this v0.3 document set and confirm whether it is implementation-ready.

Scope: docs-only review, no code.

Allowed Files: v0.3 docs only if review notes must be patched.

Forbidden Files: `apps/**`, `packages/**`, `package.json`, `pnpm-lock.yaml`, `.env*`, migrations.

Main Path Requirement: N/A. This TASK must not touch `/api/ai/chat`.

Mastra Capability Used: documentation review of Memory, RAG, Storage, Vector, Agent and framework integration.

AeloKit Responsibility: confirm product boundary and phase boundary.

Static Checks: `git diff --check -- docs/product/AI_MASTRA_MEMORY_KNOWLEDGE_V0_3_*.md`.

Runtime Smoke: N/A.

Storage / DB / Vector Verification: N/A.

v0.2 Regression Checks: confirm no v0.2 files changed.

Completion Report Format: required standard report from `ENTRYPOINT`.

Suggested Commit Message: `docs(ai): add v0.3 mastra memory knowledge plan`.

## 3. TASK-002: Mastra Dependency / Runtime Placement Decision

Goal: decide where Mastra runtime lives, whether v0.3 runs in-process, and which packages/env/storage/vector choices are needed.

Scope: planning only.

Allowed Files: v0.3 docs and a dependency decision doc if explicitly created under `docs/product`.

Forbidden Files: package manifests, lockfile, source code, env schema, migrations.

Main Path Requirement: N/A. Must describe how future implementation wires into `/api/ai/chat`.

Mastra Capability Used: Memory, PostgreSQL storage if selected, RAG, `MDocument`, embedding, vector store, retrieval, PgVector, AI SDK/framework integration.

AeloKit Responsibility: runtime placement, auth boundary, consent, env, source ownership, usage audit, v0.2 persistence boundary.

Static Checks: `git diff --check -- docs/product`.

Runtime Smoke: N/A.

Storage / DB / Vector Verification: document expected verification only.

v0.2 Regression Checks: confirm no runtime files changed.

Completion Report Format: include selected default decisions and user-confirmation blockers.

Suggested Commit Message: `docs(ai): decide v0.3 mastra runtime placement`.

## 4. TASK-003: Mastra Dependency + Env + Package Boundary Setup

Goal: after user confirms TASK-002, add the exact v0.3 dependencies and env/config changes needed for the selected Mastra path.

Scope: dependency and env setup only; no business logic.

Allowed Files:

- `apps/web/package.json`
- `pnpm-lock.yaml`
- `packages/env/src/server.ts`
- `env.example`
- conditional config file only if TASK-002 names it and user confirms it

Forbidden Files:

- `packages/ai/**`
- `packages/db/src/ai.schema.ts`
- migrations
- `/api/ai/chat`
- AI UI
- credits/payment files

Main Path Requirement: `PARTIAL UNTIL WIRED`.

Mastra Capability Used: selected install packages only; no live runtime.

AeloKit Responsibility: dependency ownership, server-only env, package boundary, no client secret exposure.

Static Checks:

```bash
pnpm check:env
pnpm check:package-exports
pnpm --filter @repo/web typecheck
```

Runtime Smoke: N/A unless TASK-002 requires a no-op import smoke.

Storage / DB / Vector Verification: verify package install only; no DB writes.

v0.2 Regression Checks: `/chat` source untouched; no route/UI runtime changes.

Completion Report Format: include exact installed packages and diff scope.

Suggested Commit Message: `build(web): add v0.3 mastra dependencies`.

## 5. TASK-004: App-local Mastra Runtime Skeleton

Goal: create app-local Mastra runtime skeleton under `apps/web/src/ai/mastra/**`.

Scope: app runtime wiring skeleton only.

Allowed Files:

- `apps/web/src/ai/mastra/**`
- `apps/web/src/ai/index.ts` only if exporting app-local runtime helpers is necessary

Forbidden Files:

- `packages/ai/**`
- `packages/db/**`
- `apps/web/src/app/api/ai/chat/route.ts`
- `apps/web/src/components/ai/**`
- package manifests unless TASK-003 already handled dependencies

Main Path Requirement: `PARTIAL UNTIL WIRED`.

Mastra Capability Used: app-local Mastra instance/config factory, selected storage/vector/provider adapters as structural wiring only.

AeloKit Responsibility: server-only runtime boundary, no `packages/ai` runtime, no client secret exposure.

Static Checks:

```bash
pnpm --filter @repo/web typecheck
pnpm check:package-exports
```

Runtime Smoke: optional no-op server import smoke if available.

Storage / DB / Vector Verification: no data writes; verify configured storage/vector adapter can be constructed only if safe and confirmed.

v0.2 Regression Checks: `/api/ai/chat` untouched.

Completion Report Format: must state `PARTIAL UNTIL WIRED`.

Suggested Commit Message: `feat(web): add mastra runtime skeleton`.

## 6. TASK-005: Mastra Memory Minimal Integration

Goal: wire Mastra Memory into the existing `/api/ai/chat` context path.

Scope: minimal memory enablement and context injection for chat.

Allowed Files:

- `apps/web/src/ai/**`
- `apps/web/src/app/api/ai/chat/route.ts`
- approved AeloKit metadata files only if a prior schema TASK confirmed them

Forbidden Files:

- `packages/ai` live runtime
- `/api/chat`
- credits ledger
- unconfirmed schema/migration
- full automatic memory consolidation

Main Path Requirement: must wire real `POST /api/ai/chat`.

Mastra Capability Used: Memory, threads/resources, conversation history, working memory or semantic recall according to confirmed design.

AeloKit Responsibility: auth, route access control, user consent, enable/disable policy, ownership/mapping, v0.2 persistence and usage audit preservation.

Static Checks:

```bash
pnpm --filter @repo/web typecheck
pnpm --filter @repo/ai typecheck
pnpm check:package-exports
```

Runtime Smoke: chat before/after enabling memory; prove response metadata or UI state shows memory was used.

Storage / DB / Vector Verification: verify Mastra storage records or AeloKit metadata/mapping only as approved.

v0.2 Regression Checks: normal chat still streams; thread/message/message_part/usage audit still write.

Completion Report Format: include evidence that memory context affected the real route.

Suggested Commit Message: `feat(web): integrate mastra memory into ai chat`.

## 7. TASK-006: User-confirmed Memory UI

Goal: add minimal UI for memory enable/disable, create/confirm, delete/disable.

Scope: app-local UI only.

Allowed Files:

- `apps/web/src/components/ai/**`
- app-local page or action files explicitly needed for memory UI
- app-local AI memory service files under `apps/web/src/ai/**`

Forbidden Files:

- `packages/design-system/**`
- `packages/ai` runtime
- unconfirmed schema/migration
- full admin audit UI

Main Path Requirement: must wire a visible UI path used by authenticated `/chat` users.

Mastra Capability Used: Memory write/delete/disable path as exposed by selected Mastra storage/runtime.

AeloKit Responsibility: consent UI, user control, source display, no silent sensitive memory saves.

Static Checks:

```bash
pnpm --filter @repo/web typecheck
```

Runtime Smoke: enable memory, create/confirm memory, chat uses memory, delete/disable memory.

Storage / DB / Vector Verification: verify memory state changes in selected storage/mapping.

v0.2 Regression Checks: plain chat still works with memory disabled.

Completion Report Format: include screenshots or browser/runtime evidence if available.

Suggested Commit Message: `feat(web): add confirmed memory controls`.

## 8. TASK-007: Mastra Knowledge Minimal Ingestion

Goal: add minimal manual knowledge source ingestion using Mastra-recommended chunking, embedding and vector storage.

Scope: manual source only; no upload system or worker indexing.

Allowed Files:

- `apps/web/src/ai/**`
- app-local minimal knowledge UI/action files if explicitly required
- approved AeloKit metadata files only after schema confirmation

Forbidden Files:

- full file upload system
- worker indexing
- complex knowledge admin
- self-built chunking/vector/rerank engine
- unconfirmed schema/migration

Main Path Requirement: `PARTIAL UNTIL RETRIEVAL WIRED` unless TASK also proves chat retrieval.

Mastra Capability Used: RAG, `MDocument` or current official document API, chunking, embedding, vector store.

AeloKit Responsibility: source ownership metadata, visibility/access policy, citation mapping, no unauthorized source access.

Static Checks:

```bash
pnpm --filter @repo/web typecheck
pnpm check:env
```

Runtime Smoke: create one manual source and confirm it is chunked/embedded/indexed.

Storage / DB / Vector Verification: verify source metadata, Mastra vector index, embedding record count or official vector store query.

v0.2 Regression Checks: chat route still works without retrieval.

Completion Report Format: must state whether retrieval is wired; if not, `PARTIAL UNTIL RETRIEVAL WIRED`.

Suggested Commit Message: `feat(web): add minimal mastra knowledge ingestion`.

## 9. TASK-008: Knowledge Retrieval Into `/api/ai/chat`

Goal: wire knowledge retrieval context into the existing chat route.

Scope: retrieval only; use sources already ingested by TASK-007.

Allowed Files:

- `apps/web/src/ai/**`
- `apps/web/src/app/api/ai/chat/route.ts`
- message metadata/part mapping where needed

Forbidden Files:

- `/api/chat`
- self-built RAG pipeline
- unconfirmed schema/migration
- credits
- MCP/tools

Main Path Requirement: must wire real `POST /api/ai/chat`.

Mastra Capability Used: vector retrieval, optional rerank/RAG pipeline if confirmed by docs.

AeloKit Responsibility: source access policy, citation metadata, v0.2 persistence and usage audit preservation.

Static Checks:

```bash
pnpm --filter @repo/web typecheck
pnpm --filter @repo/db typecheck
pnpm check:package-exports
```

Runtime Smoke: ask a question answered by the manual source and prove retrieval context was used.

Storage / DB / Vector Verification: verify retrieval result references source/chunk/provenance.

v0.2 Regression Checks: ordinary chat without knowledge still streams and persists.

Completion Report Format: include exact proof of retrieval on real route.

Suggested Commit Message: `feat(web): wire knowledge retrieval into ai chat`.

## 10. TASK-009: Citation / Source Rendering

Goal: render citations/sources in the AI UI and preserve provenance.

Scope: source/citation rendering only.

Allowed Files:

- `apps/web/src/components/ai/**`
- `apps/web/src/ai/**`
- `apps/web/src/app/api/ai/chat/route.ts` only for response metadata/message part emission

Forbidden Files:

- design-system extraction
- full knowledge admin
- unrelated chat UI redesign
- unconfirmed schema/migration

Main Path Requirement: must show citations/sources in the UI from real `/api/ai/chat` output.

Mastra Capability Used: retrieval source metadata/citation metadata from selected RAG path.

AeloKit Responsibility: UI rendering, source visibility/access policy, provenance display, message part persistence if selected.

Static Checks:

```bash
pnpm --filter @repo/web typecheck
```

Runtime Smoke: response shows citation/source in UI.

Storage / DB / Vector Verification: if citation is persisted, verify `ai_message_part.part_type = 'source'`; if not persisted, explain response-only metadata path.

v0.2 Regression Checks: existing text/tool/file rendering still works.

Completion Report Format: include citation rendering evidence.

Suggested Commit Message: `feat(web): render ai knowledge citations`.

## 11. TASK-010: v0.3 Integration Acceptance

Goal: validate v0.3 end to end without adding features.

Scope: validation/report only, with minimal fixes only if explicitly allowed.

Allowed Files: validation report docs only unless user authorizes fixes.

Forbidden Files: new dependencies, schema, migration, features, MCP, credits, worker/gateway/studio.

Main Path Requirement: validate `/api/ai/chat`, UI, persistence, memory, knowledge and citations.

Mastra Capability Used: verify selected Memory and RAG capabilities.

AeloKit Responsibility: verify auth, consent, ownership, UI, usage audit, future credits boundary.

Static Checks:

```bash
pnpm check:env
pnpm check:package-exports
pnpm --filter @repo/ai typecheck
pnpm --filter @repo/db typecheck
pnpm --filter @repo/web typecheck
pnpm --filter @repo/web build
```

Runtime Smoke: full v0.3 acceptance flow from `ACCEPTANCE`.

Storage / DB / Vector Verification: run selected storage/vector verification from final implementation.

v0.2 Regression Checks: normal chat, persistence and usage audit still pass; credits ledger unchanged.

Completion Report Format: final result must be `ACCEPTED`, `ACCEPTED WITH NOTES`, or `REJECTED`.

Suggested Commit Message: `chore(ai): validate v0.3 mastra memory knowledge integration`.
