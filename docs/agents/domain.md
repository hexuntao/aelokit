# Domain Docs

How the engineering skills should consume this repo's domain documentation when exploring the codebase.

## Layout

This is a single-context repo.

Primary domain and architecture inputs:

- `CONTEXT.md` at the repo root, if present.
- `docs/adr/`, if present.
- `docs/product/AELOKIT_AI_SAAS_PLATFORM_PRD.md` as the product north star.
- `docs/architecture/` for current architecture boundaries and staged evolution plans.
- `docs/product/` for product scope, acceptance criteria, and implementation plans.
- `docs/modules/` for module-specific behavior and ownership notes.

## Before exploring, read these

- Read `CONTEXT.md` first when it exists.
- Read ADRs in `docs/adr/` that touch the area you're about to work in.
- If `CONTEXT.md` or `docs/adr/` do not exist, proceed silently and use the existing `docs/product/`, `docs/architecture/`, and `docs/modules/` docs relevant to the task.

The producer skill `/grill-with-docs` may create `CONTEXT.md` or ADRs lazily when terms or decisions actually get resolved.

## Use the glossary's vocabulary

When your output names a domain concept, use the term as defined in `CONTEXT.md` if present. Don't drift to synonyms the glossary explicitly avoids.

If the concept you need isn't in the glossary yet, either reconsider whether you're inventing language the project does not use, or note the gap for `/grill-with-docs`.

## Flag ADR conflicts

If your output contradicts an existing ADR, surface it explicitly rather than silently overriding.
