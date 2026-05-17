# Dependency Reality Cleanup

## Audit Method

- Confirmed repository state with `git status --short`.
- Listed apps, packages, root scripts, GitHub workflows, package scripts, and package manager.
- Used `pnpm list -r --depth -1` and package.json discovery to build the workspace map.
- Scanned TS/JS/config imports, exports, dynamic imports, and require calls across `apps`, `packages`, `scripts`, root config files, and `.github`.
- Excluded generated/cache directories from structured analysis: `node_modules`, `.next`, `.turbo`, `dist`, `.source`.
- Scanned scripts and workflows for CLI-only dependencies.
- Ran targeted `pnpm why` / `pnpm list` for suspicious dependencies.
- Ran `pnpm --filter @repo/web knip` as auxiliary evidence only.

## Modified package.json Files

- `package.json`
- `apps/web/package.json`
- `packages/config/package.json`

## Added Dependencies

- Root `devDependencies`: `@biomejs/biome@2.3.12`.
- `apps/web` `dependencies`: `server-only@^0.0.1`.
- `packages/config` `devDependencies`: `typescript@^5.9.3`.

## Removed Dependencies

- `apps/web` `devDependencies`: `@biomejs/biome`.

## Moved Dependencies

- `@biomejs/biome`: moved from `apps/web` to root because it is workspace-wide lint/format tooling.

## Kept Unchanged

- `apps/web` framework/style/type dependencies such as Tailwind, PostCSS, Fumadocs, React Email preview, and `@types/*`.
- `apps/web` provider dependencies that are now primarily used by extracted packages, pending manual review.
- Package-level `@types/node` and React type packages, because they affect TypeScript compilation even when not directly imported.

## Needs Manual Review

- `apps/web`: large knip unused-dependency list, including optional/template UI dependencies and package-extraction leftovers.
- `@repo/auth`, `@repo/mail`, `@repo/payment`: declared `@repo/shared` but no direct import found.
- `@repo/payment`: declared `zod` but no direct import found.
- `@repo/env`: declared `@t3-oss/env-core` but no direct import found.
- `apps/web`: `postcss-load-config` JSDoc-only type reference.
- `apps/web`: `mdx/types` type import ownership.

## pnpm-lock.yaml

Updated by `pnpm install --no-frozen-lockfile`.

## Validation Results

Passed:

- `pnpm check:env || true`
- `pnpm check:package-exports`
- `pnpm check:db-shims`
- `pnpm --filter @repo/env typecheck`
- `pnpm --filter @repo/db typecheck`
- `pnpm --filter @repo/auth typecheck`
- `pnpm --filter @repo/payment typecheck`
- `pnpm --filter @repo/credits typecheck`
- `pnpm --filter @repo/mail typecheck`
- `pnpm --filter @repo/newsletter typecheck`
- `pnpm --filter @repo/notification typecheck`
- `pnpm --filter @repo/storage typecheck`
- `pnpm --filter @repo/analytics typecheck`
- `pnpm --filter @repo/i18n typecheck`
- `pnpm --filter @repo/config typecheck`
- `pnpm --filter @repo/shared typecheck`
- `pnpm --filter @repo/web build`
- `pnpm --filter @repo/web db:generate`
- `pnpm typecheck`
- `pnpm lint`
- `pnpm format`
- `pnpm build`

Not runnable because the workspaces do not exist:

- `pnpm --filter @repo/ui typecheck`
- `pnpm --filter @repo/docs build`

Install warning observed:

- Existing peer warnings from `better-auth` against current `drizzle-kit` / `drizzle-orm`, and from `react-twitter-embed` against React 19. These were pre-existing dependency graph constraints and were not changed by this cleanup.

## Business Code and Migration Status

- Business code changed: no.
- Import paths changed: no.
- Database schema changed: no.
- Migration generated: no. `db:generate` reported `No schema changes, nothing to migrate`.
