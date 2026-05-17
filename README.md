![AeloKit Open Graph](apps/web/public/aelokit-og.png)

# AeloKit

AeloKit is an OpenAI-style, open-source full-stack kit for building self-hostable, production-ready AI chat and agent workspaces.

From boilerplate to production—ship your AI workspace fast.

## Value Proposition

- **A product foundation that is already wired.** Authentication, dashboard structure, billing, credits, email, storage, notifications, analytics, docs, configuration, environment validation, and deployment conventions are organized as a production base.
- **Agent-ready code and UI organization.** The application is shaped for replaceable model access, composable tool/function calls, clear conversation state, and future evaluation, observability, cost control, and permission boundaries.
- **A calm workspace experience.** The default interface favors whitespace, hierarchy, readable messages, references, attachments, session management, and responsive layouts so users can focus on content and action.

## Who It Is For

- Founders building a commercial AI chat or agent workspace.
- Developers who want a self-hostable SaaS base without assembling every product primitive from scratch.
- Agencies and consultants shipping repeatable AI workspaces for clients.
- Internal platform teams prototyping agent workflows with real auth, billing, storage, and operations surfaces.

## Feature Overview

- Next.js web app with localized marketing pages, auth pages, dashboard, settings, pricing, docs, blog, changelog, roadmap, and legal pages.
- Better Auth integration with credential and social login support.
- Drizzle + PostgreSQL database package with app-level compatibility shims.
- Payment, subscription, lifetime plan, credit package, and transaction primitives.
- Transactional email, newsletter, notification, storage, and analytics packages.
- Typed website configuration and shared environment validation.
- Fumadocs-powered documentation and MDX content pipeline.
- Responsive UI built from the existing app component system.

## Tech Stack

- Turborepo + pnpm workspace
- Next.js App Router + React + TypeScript
- Tailwind CSS + shadcn/ui-style primitives
- PostgreSQL + Drizzle ORM
- Better Auth
- Stripe / Creem-ready payment package
- Resend-ready mail and newsletter flows
- S3-compatible object storage
- Biome for linting and formatting

## Quick Start

```bash
pnpm install
cp env.example .env
pnpm dev
```

Open the web app from the local URL printed by Next.js.

## Environment Variables

`env.example` is the single complete environment reference for this repository. Copy it to `.env` for local development and fill in real values for the providers you enable.

Do not commit secrets. Application code should read business environment variables through `@repo/env/server` or `@repo/env/client`, not ad hoc `process.env` access.

Useful validation command:

```bash
pnpm check:env
```

## Local Development

```bash
# Monorepo
pnpm dev
pnpm build
pnpm lint
pnpm typecheck

# Web app
pnpm --filter @repo/web dev
pnpm --filter @repo/web build
pnpm --filter @repo/web content
pnpm --filter @repo/web lint
pnpm --filter @repo/web typecheck

# Database package
pnpm --filter @repo/db db:generate
pnpm --filter @repo/db db:migrate
pnpm --filter @repo/db db:studio
```

Do not run database migrations against a shared database until the target environment and credentials are explicit.

## Workspace Structure

```text
apps/
  web/              # Full SaaS application
packages/
  config/           # Shared SaaS configuration and types
  env/              # Shared environment validation
  i18n/             # Internationalization routing and messages
  db/               # Drizzle database layer
  auth/             # Authentication core
  payment/          # Payment domain package
  credits/          # Credits domain package
  mail/             # Transactional email package
  newsletter/       # Newsletter package
  notification/     # Notification package
  storage/          # Object storage package
  analytics/        # Analytics package
  shared/           # Shared pure utilities, constants, and types
```

The current UI lives in `apps/web/src/components/`. There is intentionally no `packages/ui` yet.

## Deployment

The recommended managed deployment target is Vercel with `apps/web` as the root directory.

- Root Directory: `apps/web`
- Install Command: `pnpm install --frozen-lockfile`
- Build Command: `pnpm build`
- Output: Next.js default

Docker builds run from the monorepo root:

```bash
docker build -t aelokit .
```

Set production secrets in your deployment provider, not in the repository.

## License and Commercial Use

This repository currently uses the MIT License. Review [LICENSE](LICENSE) before distributing a commercial product or hosted derivative, and replace this section with your final product licensing terms if your distribution model changes.
