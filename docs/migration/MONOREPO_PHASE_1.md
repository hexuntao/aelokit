# Monorepo Migration — Phase 1

## Summary

Phase 1 migrates the project from a single Next.js application to a pnpm workspace + Turborepo monorepo. All business code previously at the repository root has been moved into `apps/web/`, preserving the original `src/` structure inside that workspace package.

## Structure Change

```
Before (single repo):          After (monorepo):
├── src/                       ├── apps/
│   ├── app/                   │   └── web/
│   ├── components/            │       ├── src/
│   ├── hooks/                 │       │   ├── app/
│   ├── actions/               │       │   ├── components/
│   ├── mail/                  │       │   ├── hooks/
│   ├── newsletter/            │       │   ├── actions/
│   ├── payment/               │       │   ├── mail/
│   ├── credits/               │       │   ├── newsletter/
│   ├── config/                │       │   ├── payment/
│   ├── db/                    │       │   ├── credits/
│   └── ...                    │       │   ├── config/
├── public/                    │       │   ├── db/
├── package.json               │       │   └── ...
└── ...                        │       ├── public/
                               │       └── package.json
                               ├── packages/          (shared packages, future)
                               ├── package.json       (root workspace config)
                               ├── pnpm-workspace.yaml
                               └── turbo.json
```

## Path Mapping

| Old Path | New Path |
|---|---|
| `src/app/` | `apps/web/src/app/` |
| `src/components/` | `apps/web/src/components/` |
| `src/hooks/` | `apps/web/src/hooks/` |
| `src/actions/` | `apps/web/src/actions/` |
| `src/mail/` | `apps/web/src/mail/` |
| `src/newsletter/` | `apps/web/src/newsletter/` |
| `src/payment/` | `apps/web/src/payment/` |
| `src/credits/` | `apps/web/src/credits/` |
| `src/config/` | `apps/web/src/config/` |
| `src/db/` | `apps/web/src/db/` |

## What Changed

- **Root `package.json`** now defines the pnpm workspace and Turborepo pipeline.
- **`pnpm-workspace.yaml`** declares `apps/*` and `packages/*` as workspace members.
- **`turbo.json`** configures build/dev/lint pipelines with proper dependencies.
- **`apps/web/`** contains the full Next.js application with its own `package.json`, `next.config.ts`, and `tsconfig.json`.
- **TypeScript path aliases** (`@/`) inside `apps/web` continue to work as before — no import changes needed within the app.
- **Documentation** has been updated to reflect `apps/web/src/...` paths for file references.

## What Did NOT Change

- `@/` import aliases remain valid within `apps/web/` (resolved by its own `tsconfig.json`).
- Runtime behavior and feature logic are untouched.
- Environment variables and deployment configuration are unchanged (still read from `apps/web/.env`).
- Public assets remain at `apps/web/public/`.

## Notes

- The `packages/` directory is reserved for future shared libraries (e.g., UI component kit, shared types, utility functions). It is not yet populated.
- When adding new workspace packages, update `pnpm-workspace.yaml` and ensure `turbo.json` pipeline entries reference the correct dependencies.
- CI/CD pipelines may need updates to account for the monorepo structure (e.g., running builds from the repo root with `pnpm --filter` or `turbo run`).
- The `apps/web/src/` path prefix should be used in all documentation and cross-package references. Within `apps/web/` itself, `@/` aliases remain the preferred import style.
