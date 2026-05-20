# v0.4 Codex Goal Prompt

复制以下 prompt 进入后续 `/goal implementation`。首次建议只执行 `V0.4-T01`；后续每次继续下一个 task。

```txt
You are working in /Users/tao/work/aelokit.

Execute exactly one v0.4 task from docs/product/v0.4/IMPLEMENTATION_PLAN.md.
Default task for the first run: V0.4-T01 Stack Decision Review and Freeze.

Hard scope:
- Follow AGENTS.md, nearest AGENTS.md, docs/INDEX.md, docs/agents/CODEX_RULES.md.
- Read docs/product/v0.4/DOCUMENT_INPUTS.md before implementation.
- Read all v0.4 planning docs under docs/product/v0.4/ that are relevant to the chosen task.
- Do not inherit old v0.2/v0.3 TASK numbers.
- Do not use old prompts, old scope freezes, old implementation plans, old task lists, or validation reports as current scope.
- If documentation conflicts, write docs/product/v0.4/OPEN_QUESTIONS.md and stop before guessing.

Task rules:
- Execute only the selected task.
- Keep changes inside docs/product/v0.4/ALLOWED_PATHS.md.
- If the task requires code changes, first prove the issue from current code.
- Make the smallest reversible change.
- Do not modify package.json, pnpm-lock.yaml, DB schema, migrations, .env, CI/CD, future app/package directories, or runtime/UI files unless the selected task explicitly allows that path.
- Do not run DB-mutating commands without explicit user confirmation.
- Do not install dependencies without an exact package/version/install plan and explicit user confirmation.

v0.4 scope:
- AI Stack Decision Record.
- Runtime Boundary Hardening.
- v0.3 accepted-with-notes acceptance prerequisites.
- Citation persistence design, no migration by default.
- Authenticated runtime smoke and DB/vector verification as implementation acceptance gates.

v0.4 non-goals:
- No real third-party MCP.
- No local stdio MCP by default.
- No Assistant Cloud by default.
- No worker/gateway/studio/design-system split.
- No destructive migration.
- No credits charging.
- No /api/chat route.
- No provider secret in client.
- Do not force Mastra into all chat paths.

Required validation for docs-only task:
- git diff --check
- git diff --stat
- git diff --name-only

Required validation for boundary code task:
- pnpm check:env
- pnpm check:package-exports
- pnpm check:db-shims
- pnpm --filter @repo/ai typecheck
- pnpm --filter @repo/db typecheck
- pnpm --filter @repo/web typecheck
- git diff --check

Runtime smoke rule:
- Do not mark runtime smoke PASS from code review or typecheck.
- PASS requires authenticated browser evidence plus DB/vector evidence when required by docs/product/v0.4/ACCEPTANCE_CRITERIA.md.
- If environment is missing, report BLOCKED or PARTIAL with exact missing prerequisite.

Final report:
- list read set.
- list changed files.
- state task completed / partial / blocked.
- include verification commands and results.
- mention whether next v0.4 task can start.
```
