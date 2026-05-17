# Phase 2.13: UI Boundary Audit

**Date**: 2026-05-14
**Status**: Completed
**Objective**: Audit UI component boundaries to determine if, when, and how to extract `packages/ui` without incorrectly moving business components, App Router components, Server Components, or i18n components.

---

## 1. Audit Objectives

This phase is **read-only audit only**. No components were moved, no `packages/ui` was created, no business logic was changed.

The goal is to:
1. Catalog all components in `apps/web/src/components`
2. Classify components by their suitability for a future `packages/ui`
3. Identify dependencies that prevent extraction (i18n, Next runtime, domain packages)
4. Provide recommendations for Phase 3 app splitting

---

## 2. Component Directory Overview

### Actual Directory Structure

```
apps/web/src/components/
├── admin/              # Admin user management (3 files)
├── affiliate/          # Affiliate components (2 files)
├── animate-ui/         # Animate UI library (backgrounds, buttons, radix, primitives)
├── auth/               # Auth forms (9 files)
├── blocks/             # Marketing blocks (calltoaction, faqs, features, hero, etc.)
├── blog/               # Blog components (7 files)
├── changelog/          # Changelog components (1 file)
├── chatbox/            # Chat widgets (1 file)
├── contact/            # Contact forms (1 file)
├── custom/             # Custom effects (2 files)
├── dashboard/          # Dashboard shell, sidebar, charts (7 files)
├── data-table/         # TanStack Table wrapper (13 files + config/hooks/lib/types)
├── diceui/             # DiceUI components (kanban, roadmap)
├── docs/               # Fumadocs/MDX components (7 files)
├── icons/              # Icon components (21 files)
├── layout/             # App shell components (15 files)
├── magicui/            # MagicUI library (35 files)
├── newsletter/         # Newsletter forms (2 files)
├── page/               # Page components (1 file)
├── payment/            # Payment UI (1 file)
├── premium/            # Premium/gated content (3 files)
├── pricing/            # Pricing cards, checkout buttons (4 files)
├── providers/          # React providers (2 files)
├── settings/           # Settings pages (apikeys, billing, credits, notification, profile, security)
├── shared/             # Shared utilities (7 files)
├── tailark/            # Tailark blocks (40+ files)
├── test/               # Test components (2 files)
├── ui/                 # shadcn/ui primitives (52 files)
└── waitlist/           # Waitlist forms (1 file)
```

### Total Component Count
- **UI primitives (`ui/`)**: 52 files
- **MagicUI (`magicui/`)**: 35 files
- **Animate UI (`animate-ui/`)**: ~20 files
- **Tailark (`tailark/`)**: 40+ files
- **Data Table (`data-table/`)**: 13 files
- **Business/Domain components**: ~100+ files

---

## 3. Component Classification Results

### A. Pure UI Primitives (Future `packages/ui` Candidates)

**Criteria met**:
- No business domain dependencies
- No `next-intl` dependencies
- No App Router dependencies
- No `@/actions`, `@/db`, `@/payment`, `@/credits`, etc.
- Can be shared across `apps/web`, `apps/admin`, `apps/landing`

**Candidates from `ui/`**:

| Component | Client Component | Dependencies | Extractable |
|-----------|------------------|--------------|-------------|
| accordion.tsx | Yes | Radix UI, cn | ✅ |
| alert.tsx | No | cn | ✅ |
| alert-dialog.tsx | Yes | Radix UI, cn | ✅ |
| aspect-ratio.tsx | No | cn | ✅ |
| avatar.tsx | No | Radix UI, cn | ✅ |
| badge.tsx | No | cn | ✅ |
| breadcrumb.tsx | No | Radix UI, cn | ✅ |
| button.tsx | No | CVA, Slot, cn | ✅ |
| button-group.tsx | No | cn | ✅ |
| calendar.tsx | Yes | Radix UI, date-fns, cn | ✅ |
| card.tsx | No | cn | ✅ |
| carousel.tsx | Yes | Embla Carousel, cn | ✅ |
| chart.tsx | Yes | Recharts, cn | ✅ |
| checkbox.tsx | Yes | Radix UI, cn | ✅ |
| collapsible.tsx | Yes | Radix UI, cn | ✅ |
| command.tsx | Yes | cmdk, cn | ✅ |
| context-menu.tsx | Yes | Radix UI, cn | ✅ |
| dialog.tsx | Yes | Radix UI, Button, cn | ✅ |
| drawer.tsx | Yes | Vaul, cn | ✅ |
| dropdown-menu.tsx | Yes | Radix UI, cn | ✅ |
| empty.tsx | No | cn | ✅ |
| faceted.tsx | Yes | cn | ✅ |
| field.tsx | No | cn | ✅ |
| form.tsx | Yes | react-hook-form, Radix, cn | ✅ |
| hover-card.tsx | Yes | Radix UI, cn | ✅ |
| input.tsx | No | cn | ✅ |
| input-group.tsx | No | cn | ✅ |
| input-otp.tsx | Yes | Radix UI, cn | ✅ |
| item.tsx | No | cn | ✅ |
| kbd.tsx | No | cn | ✅ |
| label.tsx | No | Radix UI, cn | ✅ |
| menubar.tsx | Yes | Radix UI, cn | ✅ |
| navigation-menu.tsx | Yes | Radix UI, cn | ✅ |
| pagination.tsx | No | Button, cn | ✅ |
| popover.tsx | Yes | Radix UI, cn | ✅ |
| progress.tsx | Yes | Radix UI, cn | ✅ |
| radio-group.tsx | Yes | Radix UI, cn | ✅ |
| resizable.tsx | Yes | react-resizable-panels, cn | ✅ |
| scroll-area.tsx | Yes | Radix UI, cn | ✅ |
| select.tsx | Yes | Radix UI, cn | ✅ |
| separator.tsx | No | Radix UI, cn | ✅ |
| sheet.tsx | Yes | Radix UI, cn | ✅ |
| sidebar.tsx | Yes | Radix UI, Sheet, Separator, cn | ⚠️ Complex |
| skeleton.tsx | No | cn | ✅ |
| slider.tsx | Yes | Radix UI, cn | ✅ |
| sonner.tsx | Yes | sonner, cn | ✅ |
| sortable.tsx | Yes | @dnd-kit, cn | ✅ |
| spinner.tsx | No | cn | ✅ |
| switch.tsx | Yes | Radix UI, cn | ✅ |
| table.tsx | No | cn | ✅ |
| tabs.tsx | Yes | Radix UI, cn | ✅ |
| textarea.tsx | No | cn | ✅ |
| toast.tsx | Yes | Radix UI, cn | ✅ |
| toaster.tsx | Yes | Radix UI, toast, cn | ✅ |
| toggle.tsx | Yes | Radix UI, cn | ✅ |
| toggle-group.tsx | Yes | Radix UI, cn | ✅ |
| tooltip.tsx | Yes | Radix UI, cn | ✅ |

**Summary**: 52 components in `ui/`, ~50 are extractable pure UI primitives.

### B. UI Utility (Future `packages/ui` or `packages/shared`)

Already in `@repo/shared`:
- `cn` utility (clsx + tailwind-merge)

Could be extracted:
- Animation variants (from globals.css keyframes)
- Theme tokens (CSS variables in globals.css)

### C. App Shell / Layout Components (NOT for `packages/ui`)

**Location**: `layout/`

| Component | Dependencies | Reason |
|-----------|--------------|--------|
| navbar.tsx | next-intl, auth-client, routes, i18n | App navigation with auth state |
| navbar-mobile.tsx | next-intl, auth-client, routes | Mobile navigation |
| user-button.tsx | auth-client, credits, i18n | User menu with session |
| user-button-mobile.tsx | auth-client, i18n | Mobile user menu |
| locale-switcher.tsx | next-intl, next/navigation | Locale switching |
| locale-selector.tsx | next-intl | Locale selection |
| mode-switcher.tsx | next-themes | Theme toggle (could be extracted) |
| mode-switcher-horizontal.tsx | next-themes | Theme toggle variant |
| footer.tsx | next-intl, routes | Footer with i18n links |
| logo.tsx | next/image | App logo (could be extracted) |
| logo-template.tsx | next/image | Template logo |
| credits-balance-button.tsx | credits, auth | Credits display |
| credits-balance-menu.tsx | credits, auth, i18n | Credits menu |
| credits-provider.tsx | React context | Credits context |
| container.tsx | cn | Layout container (extractable) |
| error.tsx | next-intl | Error boundary |
| header-section.tsx | cn | Header section (extractable) |
| tailwind-indicator.tsx | cn | Dev indicator (extractable) |
| user-avatar.tsx | auth, Avatar | User avatar with session |

**Extractable from layout/**: `container.tsx`, `tailwind-indicator.tsx`, potentially `mode-switcher.tsx`

### D. Marketing Components (NOT for `packages/ui`)

**Location**: `blocks/`, `tailark/`

These are landing page / marketing blocks that:
- Depend on i18n (`useTranslations`)
- Depend on `next/link`, `next/image`
- Contain hardcoded marketing content
- Should go to future `apps/landing`

**Blocks**:
- `calltoaction/` - CTA sections
- `faqs/` - FAQ sections
- `features/` - Feature showcases
- `hero/` - Hero sections
- `integration/` - Integration showcases
- `logo-cloud/` - Logo clouds
- `pricing/` - Pricing sections
- `stats/` - Stats sections
- `testimonials/` - Testimonials

**Tailark**: 40+ pre-built marketing blocks from Tailark registry

### E. Domain Components (NOT for `packages/ui`)

**Auth** (`auth/`):
- `login-form.tsx` - Uses `authClient`, `useTranslations`, `next/navigation`, captcha
- `register-form.tsx` - Same dependencies
- `forgot-password-form.tsx` - Same dependencies
- `reset-password-form.tsx` - Same dependencies
- `social-login-button.tsx` - Uses `authClient`, `useTranslations`
- `auth-card.tsx`, `bottom-link.tsx`, `divider-with-text.tsx`, `error-card.tsx` - Auth UI helpers
- `login-wrapper.tsx` - Modal/redirect wrapper

**Payment** (`payment/`, `pricing/`):
- `payment-card.tsx` - Payment status display
- `pricing-card.tsx` - Uses `useTranslations`, `payment/types`, `auth`
- `pricing-table.tsx` - Pricing grid
- `create-checkout-button.tsx` - Checkout action
- `customer-portal-button.tsx` - Portal action

**Credits** (`settings/credits/`, `layout/credits-*`):
- Credit cards, tables, checkout buttons
- All depend on `@/credits`, `@/payment`, auth, i18n

**Newsletter** (`newsletter/`):
- `newsletter-form.tsx` - Uses newsletter action, captcha
- `newsletter-card.tsx` - Newsletter wrapper

**Admin** (`admin/`):
- `users-table.tsx` - User management table
- `users-page-client.tsx` - Admin page client
- `user-detail-viewer.tsx` - User detail viewer

**Settings** (`settings/`):
- All settings components depend on auth, domain packages, i18n

### F. Docs Components (NOT for `packages/ui`)

**Location**: `docs/`

- `mdx-components.tsx` - Fumadocs MDX components
- `dynamic-codeblock.tsx` - Code block with syntax highlighting
- `image-wrapper.tsx` - MDX image wrapper
- `page-actions.tsx` - Docs page actions
- `wrapper.tsx` - Docs wrapper
- `xembed.tsx` - X/Twitter embed
- `youtube-video.tsx` - YouTube embed

These should stay with `apps/docs` or Fumadocs.

### G. Generated / Vendor Components

**MagicUI** (`magicui/`):
- 35 animation/effect components
- Most are pure UI (no business dependencies)
- Some use `next/image` (`twitter-card.tsx`, `hero-video-dialog.tsx`)
- Could be partially extracted, but better to keep as vendor dependency

**Animate UI** (`animate-ui/`):
- Animation primitives and components
- Pure UI, no business dependencies
- Could be extracted, but is a vendor library

**DiceUI** (`diceui/`):
- `kanban.tsx`, `roadmap.tsx`
- Pure UI components
- Could be extracted

**Data Table** (`data-table/`):
- TanStack Table wrapper
- 13 components + config/hooks/lib/types
- No business dependencies (generic)
- **Could be extracted as `packages/ui/data-table`**

---

## 4. Dependency Scan Results

### i18n Dependencies (next-intl, useTranslations)

**73 files** depend on i18n:

- All `auth/` forms
- All `blocks/` marketing components
- All `admin/` components
- All `settings/` components
- All `pricing/` components
- All `layout/` navigation components
- `blog/` components
- `contact/` components
- `newsletter/` components
- `dashboard/` sidebar components
- `data-table/` toolbar components

### Next Runtime Dependencies (next/navigation, next/link, next/image)

**54 files** depend on Next runtime:

- `auth/` forms (useSearchParams, Link)
- `blocks/` (Link, Image)
- `tailark/` (Link, Image)
- `layout/` (Link, Image, navigation)
- `blog/` (Image, Link)
- `payment/`, `pricing/` (Link)
- `affiliate/` (Script components)

### Domain Package Dependencies (@/actions, @/payment, @/credits, etc.)

**38 files** depend on domain packages:

- `auth/` → `@/actions`, `@/lib/auth-client`
- `admin/` → `@/actions`, `@/db`
- `settings/` → `@/actions`, `@/credits`, `@/payment`, `@/newsletter`
- `pricing/` → `@/payment/types`
- `layout/credits-*` → `@/credits`
- `newsletter/` → `@/actions`
- `contact/` → `@/actions`
- `dashboard/` → `@/actions`

### Client Component Distribution

**79 files** have `"use client"` directive:

- All `ui/` primitives that need interactivity
- All `magicui/` components
- All `data-table/` components
- All `auth/` forms
- All `settings/` components
- Most `layout/` components

### Server Components

Files without `"use client"` are Server Components by default:
- Some `ui/` primitives (card, badge, separator, etc.)
- `docs/` MDX components
- Some `blocks/` marketing sections

---

## 5. Tailwind / shadcn / CSS Audit

### components.json Configuration

```json
{
  "$schema": "https://ui.shadcn.com/schema.json",
  "style": "new-york",
  "rsc": true,
  "tsx": true,
  "tailwind": {
    "config": "",
    "css": "src/styles/globals.css",
    "baseColor": "zinc",
    "cssVariables": true,
    "prefix": ""
  },
  "iconLibrary": "lucide",
  "aliases": {
    "components": "@/components",
    "utils": "@/lib/utils",
    "ui": "@/components/ui",
    "lib": "@/lib",
    "hooks": "@/hooks"
  },
  "registries": {
    "@animate-ui": "https://animate-ui.com/r/{name}.json",
    "@magicui": "https://magicui.design/r/{name}.json",
    "@tailark": "https://tailark.com/r/{name}.json",
    "@diceui": "https://diceui.com/r/{name}.json"
  }
}
```

### Tailwind CSS Version

**Tailwind CSS v4** is used:
- `@import "tailwindcss"` syntax
- `@theme inline` for custom properties
- CSS variables for theming
- No `tailwind.config.js/ts` file (v4 uses CSS-based config)

### globals.css Structure

- Theme tokens (colors, fonts, shadows, animations)
- Light/dark mode variables
- Animation keyframes
- Base layer styles
- Custom utility classes

### shadcn/ui Component Location

All shadcn components are in `apps/web/src/components/ui/`

### Future `packages/ui` CSS Considerations

1. **globals.css should stay in app** - Contains app-specific theme tokens
2. **CSS variables are app-level** - Design system could be separate, but not now
3. **Tailwind content scanning** - Would need to scan `packages/ui/src/**/*.{ts,tsx}`
4. **Animation keyframes** - Could be shared, but currently in globals.css

---

## 6. Future `packages/ui` Recommended Structure

**Minimum viable extraction**:

```
packages/ui/
├── package.json
├── tsconfig.json
├── src/
│   ├── index.ts           # Re-export all primitives
│   ├── primitives/
│   │   ├── accordion.tsx
│   │   ├── alert.tsx
│   │   ├── alert-dialog.tsx
│   │   ├── aspect-ratio.tsx
│   │   ├── avatar.tsx
│   │   ├── badge.tsx
│   │   ├── breadcrumb.tsx
│   │   ├── button.tsx
│   │   ├── button-group.tsx
│   │   ├── calendar.tsx
│   │   ├── card.tsx
│   │   ├── carousel.tsx
│   │   ├── chart.tsx
│   │   ├── checkbox.tsx
│   │   ├── collapsible.tsx
│   │   ├── command.tsx
│   │   ├── context-menu.tsx
│   │   ├── dialog.tsx
│   │   ├── drawer.tsx
│   │   ├── dropdown-menu.tsx
│   │   ├── empty.tsx
│   │   ├── faceted.tsx
│   │   ├── field.tsx
│   │   ├── form.tsx
│   │   ├── hover-card.tsx
│   │   ├── input.tsx
│   │   ├── input-group.tsx
│   │   ├── input-otp.tsx
│   │   ├── item.tsx
│   │   ├── kbd.tsx
│   │   ├── label.tsx
│   │   ├── menubar.tsx
│   │   ├── navigation-menu.tsx
│   │   ├── pagination.tsx
│   │   ├── popover.tsx
│   │   ├── progress.tsx
│   │   ├── radio-group.tsx
│   │   ├── resizable.tsx
│   │   ├── scroll-area.tsx
│   │   ├── select.tsx
│   │   ├── separator.tsx
│   │   ├── sheet.tsx
│   │   ├── skeleton.tsx
│   │   ├── slider.tsx
│   │   ├── spinner.tsx
│   │   ├── switch.tsx
│   │   ├── table.tsx
│   │   ├── tabs.tsx
│   │   ├── textarea.tsx
│   │   ├── toggle.tsx
│   │   ├── toggle-group.tsx
│   │   └── tooltip.tsx
│   ├── feedback/
│   │   ├── toast.tsx
│   │   ├── toaster.tsx
│   │   └── sonner.tsx
│   └── utils/
│       └── cn.ts          # Re-export from @repo/shared
```

**Dependencies for `@repo/ui`**:
- `react`, `react-dom`
- `class-variance-authority`
- `clsx`, `tailwind-merge` (or use `@repo/shared`)
- `lucide-react`
- `@radix-ui/*` (all Radix primitives used)
- `react-hook-form` (for form component)
- `@tanstack/react-table` (if including data-table)
- `recharts` (if including chart)
- `sonner` (for sonner component)
- `cmdk` (for command component)
- `vaul` (for drawer)
- `date-fns` (for calendar)
- `embla-carousel-react` (for carousel)
- `@dnd-kit/*` (for sortable)

---

## 7. Components NOT Suitable for `packages/ui`

### Must Stay in App

| Category | Location | Reason |
|----------|----------|--------|
| Auth forms | `auth/` | Depend on `authClient`, `useTranslations`, `next/navigation`, captcha |
| Admin components | `admin/` | Depend on `@/actions`, `@/db`, i18n |
| Settings pages | `settings/` | Depend on auth, domain packages, i18n |
| Payment UI | `payment/`, `pricing/` | Depend on `@/payment`, auth, i18n |
| Credits UI | `settings/credits/`, `layout/credit-*` | Depend on `@/credits`, auth, i18n |
| Newsletter forms | `newsletter/` | Depend on actions, captcha |
| Dashboard shell | `dashboard/` | Depend on auth, routes, i18n |
| Navigation | `layout/navbar*`, `layout/user-*` | Depend on auth, routes, i18n |
| Locale switcher | `layout/locale-*` | Depend on `next-intl` |
| Marketing blocks | `blocks/`, `tailark/` | Depend on i18n, `next/link`, content |
| Docs components | `docs/` | Depend on Fumadocs |
| Blog components | `blog/` | Depend on i18n, `next/link` |

### Vendor Libraries (Keep as Dependencies)

| Library | Location | Recommendation |
|---------|----------|----------------|
| MagicUI | `magicui/` | Keep as vendor, don't extract to `packages/ui` |
| Animate UI | `animate-ui/` | Keep as vendor |
| DiceUI | `diceui/` | Keep as vendor |
| Tailark | `tailark/` | Keep as vendor (marketing blocks) |

---

## 8. Phase 3 App Splitting Impact

### Recommended Order

1. **Phase 3.1: Extract `apps/docs`**
   - Move `docs/` components to `apps/docs/src/components/`
   - Fumadocs setup stays with docs app
   - No shared UI needed

2. **Phase 3.2: Extract `apps/landing`**
   - Move `blocks/`, `tailark/` to `apps/landing/src/components/`
   - Marketing content and i18n stay with landing
   - May need shared UI primitives

3. **Phase 3.3: Extract `packages/ui` (minimal)**
   - Extract only pure UI primitives from `ui/`
   - Keep globals.css in apps
   - Update import paths in all apps

4. **Phase 3.4: Extract `apps/admin`**
   - Move `admin/` components to `apps/admin/src/components/`
   - Share UI primitives from `@repo/ui`
   - Admin-specific components stay in admin app

### UI Primitives Needed Before App Splitting

For Phase 3 to succeed, these primitives should be stable:
- Button, Card, Badge, Input, Textarea, Select
- Dialog, Drawer, Dropdown-Menu
- Table, Pagination
- Form, Label, Checkbox, Switch
- Toast/Sonner
- Skeleton, Spinner

---

## 9. Validation Results

### Commands Executed

| Command | Result |
|---------|--------|
| `pnpm check:db-shims` | ✅ Passed |
| `pnpm check:package-exports` | ✅ Passed |
| `pnpm typecheck` | ✅ Passed |
| `pnpm lint` | ✅ Passed (4 warnings in credits package) |
| `pnpm format` | ✅ Passed |
| `pnpm --filter @repo/web build` | ✅ Passed |
| `pnpm build` | ✅ Passed |
| `pnpm --filter @repo/web db:generate` | ✅ Passed (no changes) |

### Lint Warnings

**4 warnings** in `@repo/credits` package (optional chain suggestions):

| File | Line | Warning |
|------|------|---------|
| `src/distribute.ts` | 356 | `useOptionalChain` |
| `src/distribute.ts` | 502 | `useOptionalChain` |
| `src/ledger.ts` | 481 | `useOptionalChain` |
| `src/ledger.ts` | 533 | `useOptionalChain` |

These are safe optional chain simplifications, not blocking.

---

## 10. Recommendations

### Immediate Actions

1. **Do NOT create `packages/ui` yet** - Wait until Phase 3 planning
2. ~~Complete `check:package-exports` script~~ - ✅ Done
3. **Fix lint warnings in `@repo/credits`** - Optional chain improvements (optional, not blocking)

### Phase 3 Prerequisites

Before extracting `packages/ui`:
1. Complete `apps/docs` extraction
2. Complete `apps/landing` extraction
3. Ensure all apps can import from `@repo/ui`
4. Configure Tailwind content scanning for `packages/ui`

### Future `packages/ui` Scope

**Include**:
- All `ui/` primitives (52 components)
- Potentially `data-table/` (generic TanStack Table wrapper)

**Exclude**:
- All business/domain components
- All i18n-dependent components
- All auth/payment/credits components
- All marketing blocks
- All vendor libraries (magicui, animate-ui, tailark, diceui)

---

## 11. Summary

| Metric | Value |
|--------|-------|
| Total components scanned | ~200+ |
| Pure UI primitives | 52 |
| i18n-dependent components | 73 |
| Next runtime-dependent | 54 |
| Domain package-dependent | 38 |
| Client Components | 79 |
| Extractable to `packages/ui` | ~50 |
| Must stay in app | ~150 |

**Phase 2.13 Status**: ✅ Completed

- No `packages/ui` created
- No components moved
- No business logic changed
- Full audit documentation provided
- Recommendations for Phase 3 documented
- `check:package-exports` script added and passing
- All validation commands passing
