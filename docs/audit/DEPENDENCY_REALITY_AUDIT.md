# Dependency Reality Audit

## 1. Executive Summary

- Audit date: 2026-05-17.
- Workspace manager: pnpm workspace with Turborepo.
- Package manager: `pnpm@10.26.1`.
- Audited workspaces: 15 (`saas-template`, `@repo/web`, and 13 packages).
- Structured source scan, excluding generated/cache directories, scanned 652 TS/JS/config files and found 2,736 import/export/require forms, including 1,281 external package references.
- High-confidence phantom dependencies: `apps/web` imports `server-only` but did not declare it; `packages/config` runs `tsc` but did not declare `typescript`; package lint scripts rely on `biome`, which was declared only in `apps/web`.
- Minimal cleanup applied only to high-confidence items. Larger `apps/web` unused/misplaced candidates remain `needs-manual-review`.

## 2. Workspace Map

| Workspace | Path | Source directories |
| --- | --- | --- |
| `saas-template` | `.` | `scripts`, root config files |
| `@repo/web` | `apps/web` | `src`, `scripts`, `content`, config files |
| `@repo/analytics` | `packages/analytics` | `src` |
| `@repo/auth` | `packages/auth` | `src` |
| `@repo/config` | `packages/config` | `src` |
| `@repo/credits` | `packages/credits` | `src` |
| `@repo/db` | `packages/db` | `src`, `drizzle.config.ts` |
| `@repo/env` | `packages/env` | `src` |
| `@repo/i18n` | `packages/i18n` | `src` |
| `@repo/mail` | `packages/mail` | `src` |
| `@repo/newsletter` | `packages/newsletter` | `src` |
| `@repo/notification` | `packages/notification` | `src` |
| `@repo/payment` | `packages/payment` | `src` |
| `@repo/shared` | `packages/shared` | `src` |
| `@repo/storage` | `packages/storage` | `src` |

Detected apps: `apps/web`.

Detected packages: `packages/analytics`, `packages/auth`, `packages/config`, `packages/credits`, `packages/db`, `packages/env`, `packages/i18n`, `packages/mail`, `packages/newsletter`, `packages/notification`, `packages/payment`, `packages/shared`, `packages/storage`.

No `@repo/ui` or `@repo/docs` workspace currently exists.

## 3. Current Dependency Distribution

- Root before cleanup: `turbo` only.
- `@repo/web`: large runtime dependency set for Next app, UI components, Fumadocs, analytics, scripts, email preview, Drizzle proxy scripts, and workspace shims.
- Domain packages: mostly declare direct runtime package dependencies and `typescript` / `@types/*` devDependencies.
- `@repo/config` was the only package with `typecheck: tsc --noEmit` but without direct `typescript`.
- `@biomejs/biome` was declared under `@repo/web` even though every workspace has `lint` / `format` scripts using `biome`.

Root scripts:

- `dev`, `build`, `lint`, `format`, `typecheck` use `turbo`.
- `check:db-shims`, `check:package-exports`, `check:env` use Node scripts under `scripts/`.
- `web:*` scripts delegate to `@repo/web`.

Workspace package scripts:

- `@repo/web`: Next dev/build/start, Fumadocs content/postinstall, Biome lint/format, Drizzle proxy scripts, tsx maintenance scripts, React Email preview, knip, TypeScript.
- `@repo/db`: Biome, TypeScript, Drizzle Kit.
- All other packages: Biome lint/format and TypeScript typecheck.

## 4. Import Scan Method

Commands requested by the task were run. The first raw grep included `apps/web/.source`; structured analysis excluded generated/cache directories:

- `node_modules`
- `.next`
- `.turbo`
- `dist`
- `.source`

The structured parser scanned:

- Static imports and exports with `from`.
- Type-only imports/exports.
- Dynamic `import(...)`.
- CommonJS `require(...)`.
- TS/JS config files.
- Root `scripts` and `.github` workflow references for CLI usage.

Package normalization:

- Relative imports and `@/` app aliases are not package dependencies.
- Node built-ins and `node:*` imports are not package dependencies.
- Scoped subpath imports are attributed to the top-level package, for example `@radix-ui/react-dialog`.
- `@repo/*` imports must be declared by the importing workspace.
- `mdx/types` is provided by `@types/mdx`, not by a package named `mdx`; it was not treated as an automatic add.

## 5. Script / CLI Dependency Scan

CLI usage found:

- Root: `turbo`.
- `@repo/web`: `next`, `fumadocs-mdx`, `biome`, `tsx`, `react-email`, `knip`, `tsc`.
- `@repo/db`: `drizzle-kit`, `biome`, `tsc`.
- Packages: `biome`, `tsc`.

Workflow usage:

- `.github/workflows/ci.yml`: `pnpm install --frozen-lockfile`, `pnpm check:package-exports`, `pnpm check:db-shims`, `pnpm check:env`, `pnpm typecheck`, `pnpm lint`, `pnpm build`.
- `.github/workflows/distribute-credits.yml`: `pnpm --filter @repo/web distribute-credits`.

## 6. Root Dependency Findings

`turbo` is correctly rooted because root scripts directly call it.

`@biomejs/biome` is workspace-wide tooling:

- All workspaces use `biome` scripts.
- Before cleanup it was declared only in `apps/web`.
- `pnpm why @biomejs/biome` showed it only under `@repo/web`.
- Proposed and applied: move `@biomejs/biome` to root `devDependencies`.

## 7. Apps Dependency Findings

### apps/web

Direct runtime/config/script imports include:

- Workspace packages: `@repo/analytics`, `@repo/auth`, `@repo/config`, `@repo/credits`, `@repo/db`, `@repo/env`, `@repo/i18n`, `@repo/mail`, `@repo/newsletter`, `@repo/notification`, `@repo/payment`, `@repo/shared`, `@repo/storage`.
- App/runtime packages: `next`, `next-intl`, `react`, `react-dom`, `better-auth`, `drizzle-orm`, `zod`, `next-safe-action`, `lucide-react`, `motion`, `recharts`, `sonner`, `zustand`, `server-only`, and many UI component packages.
- Config/script-only packages: `drizzle-kit`, `fumadocs-mdx`, `tsx`, `react-email`, `knip`, `typescript`, `@tailwindcss/postcss`, `postcss`, `tailwindcss`.

High-confidence phantom:

- `server-only`: imported by `apps/web/src/lib/require-session.ts` and `apps/web/src/lib/server.ts`, but not declared.

Manual-review candidates:

- `postcss-load-config`: referenced only in JSDoc type annotation in `apps/web/postcss.config.mjs`; do not add automatically.
- `mdx/types`: type import in `apps/web/src/components/docs/mdx-components.tsx`; current `@types/mdx` likely owns this module.
- Knip reports many unused dependencies, but also reports current shim entry files as unused. Treat as auxiliary only.

## 8. Packages Dependency Findings

### @repo/config

- Direct import: `@repo/env`.
- Script import/CLI: `tsc`, `biome`.
- Finding: `typescript` missing for `typecheck`.
- Applied: add `typescript` to `devDependencies`.

### @repo/shared

- Direct imports: `react`, `clsx`, `tailwind-merge`.
- Current `react` is a `peerDependency` with `@types/react` in devDependencies. Keep.
- `@types/node` has no direct import evidence but kept for typecheck consistency.

### @repo/i18n

- Direct imports: `@repo/config`, `@repo/env`, `deepmerge`, `next-intl`.
- Type-only import: `fumadocs-core/i18n`; current `fumadocs-core` in devDependencies is appropriate.

### @repo/env

- Direct imports: `@t3-oss/env-nextjs`, `zod`.
- `@t3-oss/env-core` is declared but not directly imported; keep as `needs-manual-review` because env packages often expose peer/internal typing contracts.

### @repo/db

- Direct imports: `@repo/env`, `drizzle-orm`, `postgres`.
- CLI/config: `drizzle-kit`, `@next/env`.
- Keep `@next/env` because Drizzle/env loading can rely on Next env behavior even without a simple import in source scan.

### @repo/auth

- Direct imports: `@repo/config`, `@repo/db`, `@repo/env`, `better-auth`, `better-auth-harmony`, `cookie`.
- `@repo/shared` is declared but no direct import found; `needs-manual-review`.

### @repo/payment

- Direct imports: `@repo/config`, `@repo/db`, `@repo/env`, `drizzle-orm`, `stripe`.
- `@repo/shared` and `zod` declared but no direct import found; `needs-manual-review`.

### @repo/credits

- Direct imports: `@repo/config`, `@repo/db`, `date-fns`, `drizzle-orm`.

### @repo/mail

- Direct imports: `@repo/config`, `@repo/env`, `@react-email/components`, `react`, `react-dom`, `resend`, `use-intl`.
- `@repo/shared` declared but no direct import found; `needs-manual-review`.

### @repo/newsletter

- Direct imports: `@repo/config`, `@repo/env`, `@beehiiv/sdk`, `resend`.

### @repo/notification

- Direct imports: `@repo/config`, `@repo/env`.

### @repo/storage

- Direct imports: `@repo/config`, `@repo/env`, `s3mini`.

### @repo/analytics

- Direct imports: `@repo/config`, `@repo/env`.

### @repo/ui

- No `@repo/ui` workspace exists. Current UI is inside `apps/web/src/components`.

## 9. Phantom Dependencies

High-confidence:

| Workspace | Dependency | Evidence | Action |
| --- | --- | --- | --- |
| `@repo/web` | `server-only` | `apps/web/src/lib/require-session.ts`, `apps/web/src/lib/server.ts` | Add to `dependencies` |
| `@repo/config` | `typescript` | `typecheck: tsc --noEmit` | Add to `devDependencies` |
| Root | `@biomejs/biome` | All workspace lint/format scripts call `biome`; previously only declared by web | Add to root `devDependencies` |

Manual-review / not applied:

| Workspace | Dependency | Evidence | Reason |
| --- | --- | --- | --- |
| `@repo/web` | `postcss-load-config` | JSDoc type in `postcss.config.mjs` | Type-only config annotation, not enough to add |
| `@repo/web` | `mdx` | `mdx/types` type import | Usually provided by `@types/mdx`; not a runtime package |

## 10. Unused Declared Dependencies

Declared but not found by direct TS/JS import/script scan. These were not removed automatically:

- `@repo/web`: `@base-ui/react`, `@beehiiv/sdk`, `@next/env`, `@orama/orama`, `@react-email/components`, `@react-email/preview-server`, `@stripe/stripe-js`, `@swc/helpers`, `@tanstack/eslint-plugin-query`, `@types/canvas-confetti`, `better-auth-harmony`, `clsx`, `cookie`, `deepmerge`, `dotenv`, `postgres`, `s3mini`, `stripe`, `swiper`, `tailwind-merge`, `tailwindcss-animate`, `use-intl`, `use-media`, `vite`, plus several UI packages reported by knip.
- `@repo/auth`: `@repo/shared`.
- `@repo/mail`: `@repo/shared`.
- `@repo/payment`: `@repo/shared`, `zod`.
- `@repo/env`: `@t3-oss/env-core`.

Framework/style/type dependencies kept:

- `@tailwindcss/postcss`, `postcss`, `tailwindcss`, `tw-animate-css`, `@types/*`, `@swc/helpers`, `@react-email/preview-server`, `vite`.

## 11. Misplaced Dependencies

High-confidence:

- `@biomejs/biome` was misplaced in `@repo/web` because it is workspace-wide tooling used by all packages. Move to root.

Manual-review:

- `apps/web` still declares provider libraries now directly imported by extracted packages, for example `@beehiiv/sdk`, `s3mini`, `stripe`, `@react-email/components`. Because compatibility shims and template assets remain in `apps/web`, these are not removed in this minimal cleanup.

## 12. Dependencies To Add

- Root `devDependencies`: `@biomejs/biome@2.3.12`.
- `apps/web` `dependencies`: `server-only@^0.0.1`.
- `packages/config` `devDependencies`: `typescript@^5.9.3`.

## 13. Dependencies To Remove

- `apps/web` `devDependencies`: `@biomejs/biome`.

No business/runtime dependencies were removed.

## 14. Dependencies To Move

- `@biomejs/biome`: `apps/web/devDependencies` -> root `devDependencies`.

## 15. Needs Manual Review

- `apps/web` large unused-declared list from knip/grep. It includes template UI assets, framework implicit deps, package-extraction leftovers, and packages that may be retained for optional features.
- `@repo/auth` / `@repo/mail` / `@repo/payment` `@repo/shared` declarations.
- `@repo/payment` `zod`.
- `@repo/env` `@t3-oss/env-core`.
- `apps/web` `postcss-load-config` JSDoc-only type.
- `apps/web` `mdx/types` module ownership.

## 16. Proposed Minimal Change Set

Applied:

1. Add `@biomejs/biome` to root `devDependencies`.
2. Remove `@biomejs/biome` from `apps/web/devDependencies`.
3. Add `server-only` to `apps/web/dependencies`.
4. Add `typescript` to `packages/config/devDependencies`.
5. Run `pnpm install --no-frozen-lockfile` to update `pnpm-lock.yaml`.

Not applied:

- No mass deletion from `apps/web`.
- No dependency version upgrades.
- No import rewrites.
- No schema, migration, app, or package changes.

## 17. Validation Plan

Run:

```bash
pnpm check:env || true
pnpm check:package-exports
pnpm check:db-shims
pnpm --filter @repo/env typecheck
pnpm --filter @repo/db typecheck
pnpm --filter @repo/auth typecheck
pnpm --filter @repo/payment typecheck
pnpm --filter @repo/credits typecheck
pnpm --filter @repo/mail typecheck
pnpm --filter @repo/newsletter typecheck
pnpm --filter @repo/notification typecheck
pnpm --filter @repo/storage typecheck
pnpm --filter @repo/analytics typecheck
pnpm --filter @repo/i18n typecheck
pnpm --filter @repo/config typecheck
pnpm --filter @repo/shared typecheck
pnpm --filter @repo/web build
pnpm --filter @repo/web db:generate
pnpm typecheck
pnpm lint
pnpm format
pnpm build
```

`@repo/ui` and `@repo/docs` validations are not runnable because those workspaces do not exist.
