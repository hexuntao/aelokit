# Domain Docs

How the engineering skills should consume this repo's domain documentation when exploring the codebase.

## Layout

This is a single-context repo.

Primary domain and architecture inputs:

- `docs/INDEX.md` as the documentation entrypoint for current, historical, reference-only, and needs-review docs.
- Current version `docs/product/v0.x/DOCUMENT_INPUTS.md` as the minimal input set for that version.
- `CONTEXT.md` at the repo root, if present.
- `docs/adr/`, if present.
- `docs/product/AELOKIT_AI_SAAS_PLATFORM_PRD.md` as the product north star.
- `docs/architecture/` for current architecture boundaries and staged evolution plans.
- Current version files under `docs/product/v0.x/` for product scope, acceptance criteria, and implementation plans.
- `docs/modules/` for module-specific behavior and ownership notes.

Historical product docs under `docs/product/AI_CONTRACTS_FOUNDATION_*`, `docs/product/AI_CHAT_V0_2_*`, and `docs/product/AI_MASTRA_MEMORY_KNOWLEDGE_V0_3_*` are background only unless the current version `DOCUMENT_INPUTS.md` explicitly includes them.

## Before exploring, read these

- Read `docs/INDEX.md` before broad product or architecture exploration.
- Read the current version `DOCUMENT_INPUTS.md` before version planning or implementation.
- Read `CONTEXT.md` first when it exists.
- Read ADRs in `docs/adr/` that touch the area you're about to work in.
- If `CONTEXT.md` or `docs/adr/` do not exist, proceed silently and use `docs/INDEX.md`, the current version input set, and the relevant `docs/architecture/` or `docs/modules/` docs.
- Do not default to reading all of `docs/product/`.

The producer skill `/grill-with-docs` may create `CONTEXT.md` or ADRs lazily when terms or decisions actually get resolved.

## Historical Docs

Historical docs can explain prior decisions and regression guardrails, but they cannot define current scope. Old Prompt, old Implementation Plan, old Scope Freeze, old task list, and old Validation Report files must not be treated as current requirements.

## Use the glossary's vocabulary

When your output names a domain concept, use the term as defined in `CONTEXT.md` if present. Don't drift to synonyms the glossary explicitly avoids.

If the concept you need isn't in the glossary yet, either reconsider whether you're inventing language the project does not use, or note the gap for `/grill-with-docs`.

## Flag ADR conflicts

If your output contradicts an existing ADR, surface it explicitly rather than silently overriding.
