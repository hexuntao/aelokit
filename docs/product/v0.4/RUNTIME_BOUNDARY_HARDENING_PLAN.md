# v0.4 Runtime Boundary Hardening Plan

状态：READY_FOR_REVIEW

本计划用于 future v0.4 implementation。当前回合只生成文档。

## 1. Objective

硬化现有 AI runtime boundary，让后续 tools/MCP/credits/admin audit 扩展前，当前 AI workspace 不发生 route、secret、package、schema、citation、usage 边界漂移。

## 2. Current Boundary Facts

- `apps/web/src/app/api/ai/chat/route.ts` 是唯一 AI chat stream route。
- `apps/web/src/components/ai/ChatProvider.tsx` 使用 `AssistantChatTransport({ api: '/api/ai/chat' })`。
- `apps/web/src/ai` 包含 context、entitlements、models、providers、runtime、persistence、usage、memory、knowledge、Mastra wiring。
- `packages/ai` 暴露 contracts/runtime-types/adapters type surfaces。
- `packages/db/src/ai.schema.ts` 包含 `ai_message_part`, `ai_usage`, `ai_memory_draft`。
- `packages/db/src/knowledge.schema.ts` 包含 knowledge source/document/chunk/access metadata。
- `apps/web/src/ai/knowledge/vector.ts` 使用 PgVector index `aelokit_knowledge_embeddings`。
- citation 当前通过 `x-ai-knowledge-citations` header 和 `messageMetadata.citations` 传到 UI。

## 3. Hardening Areas

### H-01 Route Boundary

Required state:

- Only `POST /api/ai/chat` handles AI chat stream.
- No `/api/chat` route.
- Route remains HTTP boundary, not reusable domain model.

Checks:

```bash
test ! -e apps/web/src/app/api/chat/route.ts
rg -n "/api/chat|api: '/api/chat'|api: \"/api/chat\"" apps packages
rg -n "AssistantChatTransport" apps/web/src/components/ai apps/web/src/ai
```

### H-02 Transport Boundary

Required state:

- assistant-ui uses AI SDK runtime path.
- Custom transport must inherit from or intentionally replace `AssistantChatTransport` with explicit forwarding rules.
- No `TextStreamChatTransport` for main chat because it lacks tool calls, usage and finish reason.

Checks:

```bash
rg -n "TextStreamChatTransport|useAISDKRuntime|useChatRuntime|AssistantChatTransport" apps/web/src
```

### H-03 Secret Boundary

Required state:

- Provider and embedding secrets only read through `@repo/env/server`.
- Client env only uses `NEXT_PUBLIC_*`.
- No provider key in component props, metadata, headers, message parts or browser payload.

Checks:

```bash
rg -n "OPENAI_API_KEY|AI_GATEWAY_API_KEY|process.env" apps/web/src/components apps/web/src/app -g '*.tsx' -g '*.ts'
rg -n "NEXT_PUBLIC_.*KEY|NEXT_PUBLIC_.*SECRET" packages/env/src env.example
```

### H-04 Package Boundary

Required state:

- `packages/ai` has no live runtime imports.
- `packages/ai` does not import `@repo/db`, `@repo/auth`, `next/*`, React UI, provider SDKs or Mastra runtime.
- `apps/web/src/ai` can wire live runtime and app policy.

Checks:

```bash
rg -n "@mastra|@ai-sdk|from 'ai'|@repo/db|next/|react" packages/ai/src
pnpm check:package-exports
pnpm --filter @repo/ai typecheck
```

### H-05 DB and Shim Boundary

Required state:

- Real schema remains in `packages/db/src`.
- `apps/web/src/db/*` remains shim-only.
- No migration/schema writes in v0.4 unless scope changes.

Checks:

```bash
pnpm check:db-shims
rg -n "pgTable|mysqlTable|sqliteTable|drizzle" apps/web/src/db apps/web/src
```

### H-06 Usage and Credits Boundary

Required state:

- `ai_usage` remains audit-only.
- AI runtime does not mutate credits ledger.
- Future credits integration must go through `@repo/credits` only after v0.5 or explicit scope update.

Checks:

```bash
rg -n "@repo/credits|ledger|settlement|reservation|consume" apps/web/src/ai apps/web/src/app/api/ai packages/ai/src
```

### H-07 Memory Boundary

Required state:

- Create writes pending `ai_memory_draft` only.
- Confirm writes durable Mastra memory and stores mapping.
- Recall reads confirmed and not-disabled memory only.
- User ownership is enforced by `resourceId` / `userId`.

Checks:

```bash
rg -n "aiMemoryDraft|confirmed|disabled|resourceId|mastraThreadId" apps/web/src/ai/memory-service.ts packages/db/src/ai.schema.ts
```

### H-08 Knowledge Boundary

Required state:

- Retrieval overfetches before access filtering.
- Final chunks respect owner/public/shared access.
- Embedding/vector errors do not become false success.
- Citation metadata includes source/document/chunk/provenance/score/provider.

Checks:

```bash
rg -n "vectorTopK|knowledgeSourceAccess|includeOtherUserPublic|citations|SourceCitationMetadata" apps/web/src/ai/knowledge
```

### H-09 Citation Boundary

Required state:

- Response-only citation limitation is documented.
- Future persistence must not re-query retrieval as historical citation fact.
- If no-migration source/data part persistence is implemented, `ai_message_part.partType='source'` must be used consistently.
- If dedicated citation table is required, it waits for separate migration confirmation.

Checks:

```bash
rg -n "source-url|source-document|messageMetadata|x-ai-knowledge-citations|partType.*source" apps/web/src packages/db/src
```

## 4. Required Static Verification

Future implementation must run:

```bash
pnpm check:env
pnpm check:package-exports
pnpm check:db-shims
pnpm --filter @repo/ai typecheck
pnpm --filter @repo/db typecheck
pnpm --filter @repo/web typecheck
git diff --check
git diff --stat
```

## 5. Runtime Verification

Static checks do not replace runtime smoke. Future implementation must also follow `SMOKE_AND_VECTOR_VERIFICATION_PLAN.md`.

## 6. Rollback Strategy

- Docs-only hardening: revert the specific doc file.
- Runtime hardening code: revert only the task-owned files.
- No dependency rollback should be needed because v0.4 default scope forbids dependency changes.
- No DB rollback should be needed because v0.4 default scope forbids schema/migration changes.

## 7. Stop Conditions

Stop and update `OPEN_QUESTIONS.md` if:

- hardening requires dependency or lockfile changes.
- hardening requires schema/migration.
- official docs require unstable API to satisfy acceptance.
- runtime smoke requires DB-mutating commands without user confirmation.
- boundary checks conflict with current repo rules.

## 8. V0.4-T02 Runtime Boundary Audit Result

日期：2026-05-20

Status: PASS. No blocking runtime boundary drift was found.

Code-grounded findings:

- Route boundary: `apps/web/src/app/api/ai/chat/route.ts` is present and
  `apps/web/src/app/api/chat/route.ts` is absent. Search hits for `/api/chat`
  are documentation guardrails only.
- Transport boundary: `apps/web/src/components/ai/ChatProvider.tsx` uses
  `AssistantChatTransport` with `API_URL = '/api/ai/chat'` and
  `useChatRuntime`; no `TextStreamChatTransport` is used for the main chat.
- Secret boundary: provider and embedding env names are not read in
  `apps/web/src/components/ai`; visible component mentions are display-only env
  names. Client env exposes analytics/Turnstile public keys only.
- Package boundary: `packages/ai/src` has no live provider SDK, DB, Next,
  React UI or Mastra runtime imports. The only Mastra hit is a runtime-free
  adapter comment.
- DB shim boundary: `apps/web/src/db/*.ts` source files re-export `@repo/db`
  surfaces. No Drizzle table definitions were found in `apps/web/src/db`.
- Usage and credits boundary: AI runtime/package searches found no
  `@repo/credits` ledger import or mutation; the `consumeStream` hit in
  `/api/ai/chat` is AI SDK stream consumption, not credits consumption.
- Memory boundary: `ai_memory_draft` supports pending/confirmed/deleted plus
  disabled state, and recall filters confirmed, not-disabled rows for the
  current `resourceId`.
- Knowledge boundary: retrieval overfetches with `vectorTopK = topK * 5` and
  then filters against owner/public/shared access before citations are built.
- Citation boundary: current live citations are carried by
  `x-ai-knowledge-citations` and finish `messageMetadata.citations`.
  `saveMessageParts()` can persist AI SDK `source-url` / `source-document`
  parts as `partType='source'`, but current retrieval citations are not yet
  emitted as persisted source/data parts. This is the expected T04/T05 citation
  persistence surface, not an unrelated boundary drift.

T03 decision:

- No mandatory runtime boundary hardening patch is required by T02.
- T03 should be marked SKIPPED unless a later validation command exposes a new
  blocking boundary issue.
- T05 may proceed only after T04 confirms the no-migration citation persistence
  path and all T05 prompt conditions remain true.
