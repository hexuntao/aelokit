# Monorepo Migration — Phase 2.1: Extract packages/config

## Summary

Phase 2.1 extracts `packages/config` from `apps/web`, providing a shared package for core SaaS static configuration and config types. This is the first shared package in the monorepo — no other packages or apps are created in this phase.

## Structure Change

```
Before:                              After:
├── apps/web/src/config/             ├── apps/web/src/config/
│   ├── website.tsx                  │   ├── website.ts          (shim, re-exports from @repo/config)
│   ├── navbar-config.tsx            │   ├── navbar-config.tsx   (unchanged)
│   ├── sidebar-config.tsx           │   ├── sidebar-config.tsx  (unchanged)
│   ├── price-config.tsx             │   ├── price-config.tsx    (unchanged)
│   ├── credits-config.tsx           │   ├── credits-config.tsx  (unchanged)
│   ├── footer-config.tsx            │   ├── footer-config.tsx   (unchanged)
│   ├── avatar-config.tsx            │   ├── avatar-config.tsx   (unchanged)
│   └── social-config.tsx            │   └── social-config.tsx   (unchanged)
├── apps/web/src/types/index.d.ts    ├── apps/web/src/types/index.d.ts (re-exports config types from @repo/config)
├── apps/web/src/payment/types.ts    ├── apps/web/src/payment/types.ts (re-exports config types from @repo/config)
├── apps/web/src/credits/types.ts    ├── apps/web/src/credits/types.ts (re-exports CreditPackage from @repo/config)
                                     ├── packages/config/
                                     │   ├── package.json
                                     │   ├── tsconfig.json
                                     │   └── src/
                                     │       ├── index.ts
                                     │       ├── website.ts
                                     │       └── types.ts
```

## What Changed

- **`packages/config/`** created as `@repo/config` workspace package.
- **`websiteConfig`** now lives in `packages/config/src/website.ts`, exported from `@repo/config`.
- **Config types** (WebsiteConfig, PricePlan, PaymentConfig, PlanIntervals, PaymentTypes, etc.) now defined in `packages/config/src/types.ts`.
- **`apps/web/src/config/website.ts`** is now a shim that re-exports from `@repo/config`. All existing `import { websiteConfig } from '@/config/website'` continue to work.
- **`apps/web/src/types/index.d.ts`** re-exports config types from `@repo/config`, keeps MenuItem/NestedMenuItem/BlogCategory locally.
- **`apps/web/src/payment/types.ts`** re-exports PlanIntervals, PaymentTypes, Price, Credits, PricePlan, PaymentProviderName, PlanInterval, PaymentType from `@repo/config`. Payment-domain types (PaymentScenes, PaymentStatus, Customer, Subscription, Payment, PaymentProvider, etc.) remain local.
- **`apps/web/src/credits/types.ts`** re-exports CreditPackage and CreditPackagePrice from `@repo/config`. Credit-domain types (CREDIT_TRANSACTION_TYPE, CreditTransaction) remain local.
- **`apps/web/package.json`** added `"@repo/config": "workspace:*"` dependency.
- **`apps/web/next.config.ts`** added `transpilePackages: ['@repo/config']`.

## What Did NOT Change

- No new apps created (no admin, landing, docs, worker, gateway, studio).
- No other packages created (no db, auth, payment, credits, ui, shared).
- Client hook configs (navbar, sidebar, price, credits, footer, avatar, social) remain in `apps/web/src/config/`.
- Payment provider implementations (Stripe, Creem) unchanged.
- Credits business logic unchanged.
- No server actions moved.
- No app routes moved.
- No Fumadocs content moved.
- No messages/i18n moved.
- No UI rewrites.
- No dependency upgrades.
- No features removed.

## packages/config Constraints

`packages/config` does NOT depend on:
- `@/` (apps/web path aliases)
- `apps/web` internal paths
- `next-intl`
- `lucide-react`
- `useTranslations`
- React components
- Server Actions
- Drizzle
- better-auth
- Stripe SDK / Creem SDK

It only contains:
- `websiteConfig` (static config object)
- Config-related types (WebsiteConfig, PricePlan, PaymentConfig, etc.)
- Enums (PlanIntervals, PaymentTypes)
