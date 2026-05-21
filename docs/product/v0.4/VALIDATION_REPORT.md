# v0.4 Validation Report

本文件记录 v0.4 implementation 的静态验证、runtime smoke、DB/vector verification 和已知阻塞。报告不打印 secret 值。

## T07 Authenticated Runtime Smoke

日期：2026-05-20

Status: PARTIAL.

Passed evidence:

- Dev server started with `pnpm --filter @repo/web dev`.
- Local URL: `http://localhost:3000`.
- Browser session: Chrome authenticated session reached `/chat`.
- Authenticated user visible in UI: `admin` / `admin@gmail.com`.
- UI smoke:
  - Prompt: `v0.4 runtime smoke: reply with the single word pong.`
  - UI rendered assistant response: `pong`.
- Browser-context route smoke:
  - Request path: `POST /api/ai/chat`.
  - HTTP status: `200`.
  - Response content type: `text/event-stream`.
  - `x-ai-thread-id`: present.
  - `x-ai-message-id`: present.
  - `x-ai-memory-enabled`: `false`.
  - `x-ai-knowledge-enabled`: `false`.
  - Response body used UI message stream data and included `pong`.
- Read-only DB evidence for the two smoke requests:
  - `smoke_threads=2`.
  - `smoke_messages=4`.
  - `smoke_parts=6`.
  - `usage_records=2,success=2,error=0`.
  - `credit_transactions_for_smoke_user_since_start=0`.
- Memory default evidence:
  - After clearing local browser memory/knowledge preferences and reloading, UI showed `Memory Off` and `Knowledge Off`.

Partial / blocked evidence:

- Knowledge-enabled UI attempt hit an embedding provider error before citations could be returned:
  - error class: `AI_APICallError`.
  - provider endpoint returned HTTP 400.
  - sanitized response body: `Unsupported parameter: encoding_format`.
- Because knowledge retrieval did not return citations, T07 does not mark knowledge citation runtime PASS.
- Confirmed-only durable memory recall was not separately exercised with controlled memory data in this task.

Conclusion:

- Authenticated base chat runtime smoke: PASS.
- UI message stream headers/metadata path: PASS.
- Thread/message/message part persistence: PASS.
- Usage audit and no credits mutation: PASS.
- Knowledge citation runtime: PARTIAL/BLOCKED by embedding provider compatibility.
- Overall T07: PARTIAL.
