# AI Mastra Memory Knowledge v0.3 Tasks

本文档输出可直接复制给 Codex 的 v0.3 TASK 列表。

每次只执行一个 TASK。任何 TASK 如果没有接入真实 `/api/ai/chat` 或真实 UI，必须标记 `PARTIAL UNTIL WIRED`，不能把 helper/service/skeleton 当作完成。

# TASK-001: Review v0.3 Mastra-first Planning Docs

## Goal

Review v0.3 planning docs and confirm whether they are implementation-ready.

## Must Read

- `AGENTS.md`
- `docs/product/AI_MASTRA_MEMORY_KNOWLEDGE_V0_3_ENTRYPOINT.md`
- `docs/product/AI_MASTRA_MEMORY_KNOWLEDGE_V0_3_SCOPE_FREEZE.md`
- `docs/product/AI_MASTRA_MEMORY_KNOWLEDGE_V0_3_IMPLEMENTATION_PLAN.md`
- `docs/product/AI_MASTRA_MEMORY_KNOWLEDGE_V0_3_ACCEPTANCE.md`
- `docs/product/AI_MASTRA_MEMORY_KNOWLEDGE_V0_3_OPEN_QUESTIONS.md`
- `docs/product/AI_MASTRA_MEMORY_KNOWLEDGE_V0_3_TASKS.md`
- `docs/product/AI_AGENT_INFRASTRUCTURE_ROADMAP.md`
- `docs/architecture/AI_RUNTIME_LAYERING.md`

## Allowed Files

- v0.3 docs only.

## Forbidden Files

- `apps/**`
- `packages/**`
- `package.json`
- `pnpm-lock.yaml`
- `.env*`
- migrations

## Main Path Requirement

N/A. This is docs review only.

## Mastra Capability Used

Official docs review only: Memory, RAG, Storage, Vector, Agent/framework integration.

## AeloKit Responsibility

Confirm scope, product boundary, task sequencing and open questions.

## Implementation Requirements

- Do not write code.
- Do not install dependencies.
- Do not modify schema or migration.
- Identify contradictions between v0.3 docs and current repo docs.
- Patch docs only if the task explicitly asks to fix the planning package.

## Acceptance Criteria

- Review report lists blockers and non-blockers.
- No code changes.
- No package/lockfile/env/schema changes.

## Static Checks

```bash
git diff --check -- docs/product/AI_MASTRA_MEMORY_KNOWLEDGE_V0_3_*.md
```

## Runtime Smoke

N/A.

## Storage / DB / Vector Verification

N/A.

## v0.2 Regression Checks

Confirm no v0.2 runtime/UI/schema files changed.

## Completion Report

Use the report format from `ENTRYPOINT`.

# TASK-002: Decide Mastra Runtime Placement and Dependency Plan

## Goal

Produce the v0.3 runtime placement and dependency plan without installing anything.

## Must Read

- All TASK-001 documents
- `apps/web/package.json`
- `package.json`
- `pnpm-lock.yaml`
- `packages/env/src/server.ts`
- `env.example`
- `apps/web/src/app/api/ai/chat/route.ts`
- `apps/web/src/ai/**`
- Mastra official docs for Memory, RAG, Storage, PgVector and AI SDK integration

## Allowed Files

- v0.3 docs under `docs/product`.

## Forbidden Files

- `apps/web/package.json`
- `package.json`
- `pnpm-lock.yaml`
- `apps/web/**`
- `packages/**`
- `.env*`

## Main Path Requirement

Plan must state how future implementation wires into `POST /api/ai/chat`.

## Mastra Capability Used

Planning for Memory, PostgreSQL Storage, RAG, chunking, embedding, vector retrieval, PgVector and AI SDK integration.

## AeloKit Responsibility

Decide app-local runtime placement, auth/consent/source ownership boundaries, env and package ownership.

## Output Requirements

- Must output a `User Confirmation Required Before TASK-003` section.
- Must list exact packages with version ranges.
- Must list exact install command.
- Must list all env variable names required.
- Must state whether PgVector is required.
- Must state which embedding provider is required.
- Must state whether new metadata schema/migration is required.
- Must list blocked items that cannot proceed without user confirmation.
- Must NOT write unconfirmed content as facts.
- Must NOT proceed to TASK-003 without user confirmation of this output.

## Implementation Requirements

- Output where Mastra runtime goes.
- Output whether v0.3 is in-process.
- Output exact candidate packages and why.
- Output storage/vector/embedding plan.
- Output env plan.
- Output user-confirmation list.
- Do not install dependencies.

## Acceptance Criteria

- Dependency plan is concrete enough for TASK-003.
- Open Questions are updated or referenced.
- No package/lockfile/source changes.
- Output includes `User Confirmation Required Before TASK-003` section.

## Static Checks

```bash
git diff --check -- docs/product
```

## Runtime Smoke

N/A.

## Storage / DB / Vector Verification

Document expected verification only. Do not run DB commands unless separately confirmed.

## v0.2 Regression Checks

Confirm `/api/ai/chat` and UI untouched.

## Completion Report

Must include default decisions and confirmation blockers. Must include the `User Confirmation Required Before TASK-003` section.

# TASK-003: Add Mastra Dependencies and Env

## Goal

After user confirms TASK-002, install the approved dependencies and add approved server-only env/config.

## Must Read

- TASK-002 output
- `AGENTS.md`
- `apps/AGENTS.md`
- `apps/web/AGENTS.md`
- `packages/env/AGENTS.md`
- `apps/web/package.json`
- `package.json`
- `pnpm-lock.yaml`
- `packages/env/src/server.ts`
- `env.example`

## Allowed Files

- `apps/web/package.json`
- `pnpm-lock.yaml`
- `packages/env/src/server.ts`
- `env.example`
- one approved config file only if TASK-002 and user confirmation explicitly require it

## Forbidden Files

- `packages/ai/**`
- `packages/db/**`
- `apps/web/src/app/api/ai/chat/route.ts`
- `apps/web/src/components/ai/**`
- migrations
- `.env`

## Main Path Requirement

`PARTIAL UNTIL WIRED`.

## Mastra Capability Used

Dependency/env setup only.

## AeloKit Responsibility

Package ownership, server-only env validation, no client secret exposure.

## Implementation Requirements

- Use only user-confirmed install command.
- Do not add unconfirmed packages.
- If env schema changes, update `env.example`.
- Do not create runtime code.
- Inspect diff and stop if package manager changes unauthorized files.

## Acceptance Criteria

- Approved packages installed.
- Env example matches schema.
- No runtime/UI/schema/migration change.

## Static Checks

```bash
pnpm check:env
pnpm check:package-exports
pnpm --filter @repo/env typecheck
pnpm --filter @repo/web typecheck
git diff --check -- apps/web/package.json pnpm-lock.yaml packages/env/src/server.ts env.example
```

Note: If `pnpm --filter @repo/env typecheck` script does not exist, report N/A in completion report. Do not pretend it passed.

## Runtime Smoke

N/A.

## Storage / DB / Vector Verification

No DB writes. Verify package presence only.

## v0.2 Regression Checks

Confirm v0.2 route/UI source untouched.

## Completion Report

Must include exact packages and env variables changed.

# TASK-004: Create App-local Mastra Runtime Skeleton

## Goal

Create `apps/web/src/ai/mastra/**` runtime skeleton.

## Must Read

- v0.3 entrypoint/scope/acceptance/tasks
- `apps/AGENTS.md`
- `apps/web/AGENTS.md`
- `packages/ai/AGENTS.md`
- `docs/architecture/AI_RUNTIME_LAYERING.md`
- `docs/architecture/AI_AGENT_INFRASTRUCTURE_BOUNDARIES.md`
- Mastra official docs for selected runtime/storage/vector packages

## Allowed Files

- `apps/web/src/ai/mastra/**`
- `apps/web/src/ai/index.ts` if needed

## Forbidden Files

- `packages/ai/**`
- `packages/db/**`
- `apps/web/src/app/api/ai/chat/route.ts`
- `apps/web/src/components/ai/**`
- package manifests
- lockfile

## Main Path Requirement

`PARTIAL UNTIL WIRED`.

## Mastra Capability Used

App-local Mastra runtime factory/config skeleton only.

## AeloKit Responsibility

Keep runtime in app layer and secrets server-only.

## Skeleton Scope Guardrail

- TASK-004 MUST ONLY create:
  - Runtime factory functions
  - Config resolvers
  - Storage/vector constructor wrappers
- TASK-004 MUST NOT create:
  - Memory service implementation
  - Knowledge service implementation
  - Chat route integration
  - UI components
  - Any live runtime execution
- All skeleton code MUST be marked `PARTIAL UNTIL WIRED`.
- No skeleton code may be called from production routes until explicitly wired by later TASKs.

## Implementation Requirements

- Use `server-only` where appropriate.
- Do not instantiate runtime in client code.
- Do not export live Mastra runtime from `packages/ai`.
- No DB writes.
- No chat route change.
- Only create factory/config/constructor wrappers.

## Acceptance Criteria

- Skeleton typechecks.
- `packages/ai` remains runtime-free.
- No secret reaches client.
- No production route calls skeleton code.

## Static Checks

```bash
pnpm --filter @repo/web typecheck
pnpm check:package-exports
```

## Runtime Smoke

Optional no-op import smoke if safe.

## Storage / DB / Vector Verification

No writes. If constructor smoke is run, report no persisted data was created.

## v0.2 Regression Checks

Confirm `/api/ai/chat` untouched.

## Completion Report

Must say `PARTIAL UNTIL WIRED`. List all skeleton modules created. Explicitly state none are wired to production routes.

# TASK-005: Wire Confirmed Mastra Memory into Chat Context

## Goal

Inject already-confirmed/already-enabled Mastra Memory into real `POST /api/ai/chat`.

## Must Read

- All v0.3 docs
- `apps/AGENTS.md`
- `apps/web/AGENTS.md`
- `apps/web/src/app/api/ai/chat/route.ts`
- `apps/web/src/ai/**`
- `packages/db/src/ai.schema.ts`
- Mastra Memory docs: overview, storage, message history, working memory, semantic recall, processors

## Allowed Files

- `apps/web/src/ai/**`
- `apps/web/src/app/api/ai/chat/route.ts`
- approved AeloKit metadata files only if schema/migration was separately confirmed

## Forbidden Files

- `packages/ai` live runtime
- `/api/chat`
- unconfirmed schema/migration
- credits/payment files
- full automatic memory consolidation
- memory creation/confirmation/deletion/disabling logic (belongs to TASK-006)
- UI for memory controls (belongs to TASK-006)

## Main Path Requirement

Must wire real `/api/ai/chat`.

## Mastra Capability Used

Memory read path, threads/resources, conversation history, working memory or semantic recall according to confirmed design.

## AeloKit Responsibility

Auth, consent, enable/disable policy, ownership mapping, v0.2 persistence and usage audit preservation.

## Critical Guardrail

- TASK-005 MUST NOT automatically create durable memory.
- TASK-005 MUST NOT create/confirm/delete/disable memory entries.
- TASK-005 can ONLY read already-confirmed/already-enabled memory and inject it into chat context.
- Durable memory creation/confirmation/deletion/disabling MUST be done through TASK-006 user-confirmed UI or explicit API.
- If no confirmed/enabled memory exists, chat proceeds without memory context (v0.2 behavior).

## Implementation Requirements

- Memory disabled path must behave like v0.2 chat.
- Memory enabled path must inject available memory/context.
- Durable memory must not be silently saved without user confirmation.
- Response metadata or UI-observable evidence must show memory was used.
- Do not replace AI SDK streaming unless explicitly confirmed.
- Do not create/confirm/delete/disable any memory entries.

## Acceptance Criteria

- Plain chat still works.
- Memory-enabled chat uses memory.
- Memory-disabled chat does not use memory.
- Usage audit still writes.
- No memory creation/deletion performed by this TASK.

## Static Checks

```bash
pnpm --filter @repo/web typecheck
pnpm --filter @repo/ai typecheck
pnpm check:package-exports
```

## Runtime Smoke

- Send normal chat.
- Enable memory through TASK-006 UI (or assume pre-confirmed memory exists).
- Ask a related follow-up.
- Verify memory usage evidence.

## Storage / DB / Vector Verification

Verify selected Mastra storage and AeloKit mapping/metadata. Do not invent table names.

## v0.2 Regression Checks

Verify thread/message/message_part/usage audit still write.

## Completion Report

Include proof from the real route. Explicitly state no memory creation/deletion was performed.

# TASK-006: Add User-confirmed Memory Controls

## Goal

Add minimal UI and API for memory enable/disable, create/confirm, delete/disable.

## Must Read

- All v0.3 docs
- `apps/AGENTS.md`
- `apps/web/AGENTS.md`
- `apps/web/src/components/ai/**`
- `apps/web/src/ai/**`
- Mastra Memory docs relevant to writes/deletes/storage

## Allowed Files

- `apps/web/src/components/ai/**`
- `apps/web/src/ai/**`
- app-local page/action files explicitly required for memory UI

## Forbidden Files

- `packages/design-system/**`
- `packages/ai` runtime
- unconfirmed schema/migration
- admin memory audit

## Main Path Requirement

Must expose authenticated UI path.

## Mastra Capability Used

Memory write/delete/disable capability according to selected storage/runtime.

## AeloKit Responsibility

Consent UI, user control, source/audit display, no silent sensitive memory save.

## Critical Guardrail

- All durable memory creation/confirmation/deletion/disabling MUST go through this TASK's user-confirmed UI or explicit API.
- TASK-005 MUST NOT create/confirm/delete/disable memory; it only reads memory created/confirmed through this TASK.
- User must explicitly confirm before any durable memory is saved.
- No automatic memory consolidation without user opt-in.

## Implementation Requirements

- Memory toggle.
- Manual create or confirm memory.
- Delete/disable memory.
- Clear disabled state behavior.
- UI copy must not claim automatic memory if it is not implemented.
- All memory lifecycle operations require explicit user action.

## Acceptance Criteria

- User can enable/disable memory.
- User can create/confirm memory.
- User can delete/disable memory.
- Disabled memory is not used by chat.
- No memory is created without explicit user confirmation.

## Static Checks

```bash
pnpm --filter @repo/web typecheck
```

## Runtime Smoke

Run the memory UI workflow from acceptance.

## Storage / DB / Vector Verification

Verify selected memory state and mapping.

## v0.2 Regression Checks

Plain chat remains usable with memory disabled.

## Completion Report

Include UI path and evidence. List all memory lifecycle operations supported.

# TASK-007: Add Minimal Knowledge Ingestion

## Goal

Add minimal manual knowledge source ingestion with Mastra chunking/embedding/vector path.

## Must Read

- All v0.3 docs
- `apps/AGENTS.md`
- `apps/web/AGENTS.md`
- `packages/db/AGENTS.md` if metadata schema exists
- Mastra RAG docs: overview, chunking and embedding, vector databases, retrieval, PgVector

## Allowed Files

- `apps/web/src/ai/**`
- app-local minimal source UI/action files if explicitly in scope
- approved metadata files only after separate schema/migration confirmation

## Forbidden Files

- full upload system
- worker indexing
- complex knowledge admin
- self-built RAG/vector/rerank engine
- unconfirmed schema/migration
- batch import functionality
- file upload UI or API

## Main Path Requirement

`PARTIAL UNTIL RETRIEVAL WIRED` unless this TASK also wires chat retrieval.

## Mastra Capability Used

RAG, document chunking, embedding, vector store.

## AeloKit Responsibility

Source ownership metadata, visibility/access policy, mapping and provenance.

## Ingestion Scope Guardrail

- TASK-007 MUST ONLY support:
  - Manual text source input (paste/type text)
  - Single source ingestion at a time
  - Mastra official chunking/embedding/vector flow
- TASK-007 MUST NOT support:
  - File upload
  - Batch import
  - Worker/background indexing
  - Full knowledge admin UI
  - External document connectors
- If embedding provider is not configured, TASK-007 MUST be marked BLOCKED.
- TASK-007 MUST NOT bypass embedding requirement.
- TASK-007 MUST NOT proceed without valid embedding provider configuration.

## Implementation Requirements

- Manual text source only.
- Use Mastra official chunking/embedding/vector flow.
- Verify chunk/vector creation.
- Preserve source provenance.
- Do not create worker or full file lifecycle.
- Do not support file upload.
- Do not support batch import.
- Fail gracefully if embedding provider is not configured.

## Acceptance Criteria

- One manual text source can be indexed.
- Chunk/vector count can be verified.
- Source ownership is preserved.
- Embedding provider is confirmed configured and used.

## Static Checks

```bash
pnpm --filter @repo/web typecheck
pnpm check:env
```

## Runtime Smoke

Create one minimal text source and index it.

## Storage / DB / Vector Verification

Verify source metadata and vector/index state using actual selected storage/vector APIs.

## v0.2 Regression Checks

Plain chat route still works.

## Completion Report

Must state whether retrieval is wired. Must confirm embedding provider was configured and used.

# TASK-008: Wire Knowledge Retrieval into Chat

## Goal

Wire Mastra knowledge retrieval into real `/api/ai/chat`.

## Must Read

- All v0.3 docs
- `apps/web/src/app/api/ai/chat/route.ts`
- `apps/web/src/ai/**`
- `apps/web/src/components/ai/**`
- Mastra retrieval and vector docs

## Allowed Files

- `apps/web/src/ai/**`
- `apps/web/src/app/api/ai/chat/route.ts`
- message metadata/part mapping files as needed

## Forbidden Files

- `/api/chat`
- self-built RAG pipeline
- unconfirmed schema/migration
- MCP/tools
- credits/payment files

## Main Path Requirement

Must wire real `/api/ai/chat`.

## Mastra Capability Used

Vector retrieval and optional Mastra RAG/rerank path if confirmed.

## AeloKit Responsibility

Source access policy, retrieval context injection, citation metadata, usage audit preservation.

## Citation Metadata Requirement

- TASK-008 MUST define the source/citation message metadata shape or `ai_message_part` source part shape.
- Minimum required fields for source/citation:
  - `sourceId`: unique identifier for the source
  - `title`: human-readable source title
  - `documentId` or `chunkId`: reference to the indexed document or chunk
  - `provenance`: origin information (e.g., URL, file path, or manual entry indicator)
  - `score`: relevance score from retrieval
  - `provider`: retrieval/embedding provider used
- If citation is not persisted to DB, TASK-008 MUST document:
  - Response-only metadata path
  - How provenance is carried through stream
  - Acceptance limitations for non-persisted citations

## Implementation Requirements

- Retrieve only user-accessible sources.
- Inject retrieval context into model request.
- Attach provenance to response metadata or source parts.
- Do not replace v0.2 persistence.
- Do not bypass usage audit.
- Define and document the source/citation metadata shape.

## Acceptance Criteria

- Query about indexed source returns grounded answer.
- Retrieval evidence includes source/chunk provenance.
- Ordinary chat still works without knowledge source.
- Source/citation metadata shape is defined and documented.

## Static Checks

```bash
pnpm --filter @repo/web typecheck
pnpm --filter @repo/db typecheck
pnpm check:package-exports
```

## Runtime Smoke

Ask a source-grounded question and verify retrieval.

## Storage / DB / Vector Verification

Verify selected vector retrieval result references the indexed source.

## v0.2 Regression Checks

Verify normal chat streaming, thread/message/message_part and usage audit.

## Completion Report

Include proof from real route. Include the defined source/citation metadata shape.

# TASK-009: Render Citations / Sources

## Goal

Render citation/source in AI UI and preserve provenance.

## Must Read

- All v0.3 docs
- `apps/web/src/components/ai/**`
- `apps/web/src/ai/persistence/index.ts`
- `packages/db/src/ai.schema.ts`
- AI SDK message part/source docs and Mastra retrieval docs

## Allowed Files

- `apps/web/src/components/ai/**`
- `apps/web/src/ai/**`
- `apps/web/src/app/api/ai/chat/route.ts` only if needed for source metadata emission

## Forbidden Files

- design-system extraction
- full knowledge admin
- unrelated UI redesign
- unconfirmed schema/migration

## Main Path Requirement

Must show citation/source in UI from real chat response.

## Mastra Capability Used

Retrieval source/citation metadata.

## AeloKit Responsibility

Citation rendering, access-safe source display, message part/metadata persistence where selected.

## Citation Data Shape Requirement

- TASK-009 MUST render citations using the source/citation metadata shape defined in TASK-008.
- Each rendered citation MUST display at minimum:
  - Source title
  - Provenance indicator (e.g., "Manual entry", "Uploaded document", URL if applicable)
  - Relevance score (optional in UI, but must be in metadata)
- If citation is persisted to `ai_message_part`:
  - `part_type` MUST be `'source'`
  - `content` MUST contain the full source/citation metadata JSON
  - Query verification: `SELECT id, message_id, runtime_part_type, content FROM ai_message_part WHERE part_type = 'source' ORDER BY created_at DESC LIMIT 20;`
- If citation is response-only (not persisted):
  - Document why persistence is not selected
  - Document how provenance is carried through stream response
  - Document acceptance limitations (e.g., citations not visible in history)

## Implementation Requirements

- UI displays citation/source.
- Source title/URI/reference does not leak unauthorized data.
- Provenance survives stream and persistence path if persistence is selected.
- Existing message rendering remains intact.
- Use the source/citation metadata shape defined in TASK-008.

## Acceptance Criteria

- Citation/source visible in UI.
- Source provenance can be inspected.
- Existing text/tool/file rendering still works.
- Citation data shape matches TASK-008 definition.

## Static Checks

```bash
pnpm --filter @repo/web typecheck
```

## Runtime Smoke

Ask knowledge-grounded question and inspect UI citations.

## Storage / DB / Vector Verification

If persisted, verify:

```sql
select id, message_id, runtime_part_type, content
from ai_message_part
where part_type = 'source'
order by created_at desc
limit 20;
```

If response-only, document why and how provenance is carried.

## v0.2 Regression Checks

Verify ordinary chat UI still works.

## Completion Report

Include citation rendering evidence. Explicitly state whether citations are persisted or response-only and the implications.

# TASK-010: v0.3 Integration Acceptance

## Goal

Run final v0.3 acceptance without developing new features.

## Must Read

- All v0.3 docs
- `docs/product/AI_CHAT_V0_2_ACCEPTANCE.md`
- `docs/product/AI_CHAT_V0_2_SCOPE_FREEZE.md`
- final implementation diffs

## Allowed Files

- validation report docs only, unless user explicitly authorizes fixes.

## Forbidden Files

- new dependencies
- new schema/migration
- feature work
- MCP
- credits charging
- worker/gateway/studio

## Main Path Requirement

Validate real `/api/ai/chat`, memory, knowledge, citations, persistence and usage audit.

## Mastra Capability Used

Verify selected Memory and RAG capabilities.

## AeloKit Responsibility

Verify auth, consent, source ownership, UI, usage audit, v0.2 persistence and future credits boundary.

## Implementation Requirements

- Do not add features.
- Run static checks.
- Run runtime smoke.
- Verify storage/db/vector.
- Verify v0.2 regression.
- Output final decision.

## Acceptance Criteria

- Product acceptance satisfied or gaps listed.
- Architecture acceptance satisfied or gaps listed.
- Static checks run.
- Runtime smoke run or blockers classified.
- Final result is explicit.

## Static Checks

```bash
pnpm check:env
pnpm check:package-exports
pnpm --filter @repo/ai typecheck
pnpm --filter @repo/db typecheck
pnpm --filter @repo/web typecheck
pnpm --filter @repo/web build
```

## Runtime Smoke

1. 登录 `/chat`
2. 普通聊天仍正常
3. 启用 memory
4. 创建/确认 memory
5. 发送相关消息，确认 memory 被使用
6. 删除/禁用 memory
7. 创建 minimal knowledge source
8. 发送相关问题，确认 retrieval 生效
9. UI 展示 citation/source
10. `ai_usage` 继续写入
11. credits ledger 无变化

## Storage / DB / Vector Verification

Run the actual selected verification queries/API checks. Do not use placeholder table names as proof.

## v0.2 Regression Checks

- `/api/ai/chat` remains only stream route.
- v0.2 thread/message/message_part/usage audit still writes.
- credits ledger unchanged.
- OpenAI official and relay baseURL paths still valid if env is available.

## Completion Report

Final result must be one of:

- `ACCEPTED`
- `ACCEPTED WITH NOTES`
- `REJECTED`
