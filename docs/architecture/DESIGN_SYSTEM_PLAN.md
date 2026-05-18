# AeloKit Design System Plan

**Status**: Planning only  
**Current Task**: Monorepo Evolution Planning  
**Date**: 2026-05-18

---

## 1. Why Not a Narrow `packages/ui`

AeloKit should not plan only for a narrow `packages/ui` that exports primitives such as button, card, and dialog.

Reasons:

- The current app already contains more than primitives: marketing blocks, docs components, dashboard layouts, data tables, icon systems, AI workspace surfaces, forms, and page section patterns.
- Future apps need a product-level design language, not just shadcn-style primitives.
- A narrow UI package would encourage moving primitives early while leaving repeated product blocks duplicated in apps.
- Existing AGENTS rules correctly prevent premature `packages/ui`; future extraction should be broader, more deliberate, and based on audited component dependencies.

The target should be:

```txt
packages/design-system
```

This package is a product design system. It can include primitives, blocks, tokens, layout systems, AI workspace presentation, dashboard patterns, marketing patterns, form wrappers, icons, and style utilities.

---

## 2. Current Boundary

Current source of truth:

```txt
apps/web/src/components
```

Current responsibilities:

- Business components.
- Page-bound components.
- Auth, admin, billing, pricing, settings, docs, dashboard components.
- shadcn/ui primitives in `ui/`.
- Third-party component libraries copied or adapted under `magicui/`, `animate-ui/`, `tailark/`, `diceui/`.
- Product blocks and layout pieces.

Future boundary:

```txt
apps/web/src/components = app-specific and page-bound components
packages/design-system = audited cross-app reusable design system
```

No component should move only because it is visually reusable. It must also be dependency-clean.

---

## 3. Planned Directory Structure

Future structure only. Do not create during Current Task.

```txt
packages/design-system/
  src/
    ui/
    blocks/
    marketing/
    ai/
    dashboard/
    forms/
    layouts/
    icons/
    tokens/
    styles/
    hooks/
    utils/
```

---

## 4. Subdirectory Boundaries

| Directory | Owns | Does not own |
| --- | --- | --- |
| `src/ui` | Primitive components such as button, dialog, input, table, tabs, tooltip, select | Business copy, auth state, payment actions, route data |
| `src/blocks` | Reusable neutral product blocks that are not marketing-specific | Hardcoded page content, app route assumptions |
| `src/marketing` | Reusable marketing sections, pricing display shells, feature grids, social proof presentation | Checkout mutation logic, session-aware billing state |
| `src/ai` | Presentational AI workspace components, message part renderers, tool-call displays, citations display, empty states | AI provider SDKs, API route calls, credits mutations, memory writes |
| `src/dashboard` | Shell primitives, sidebar/layout variants, stat cards, data display patterns | User-specific queries, admin mutations, billing actions |
| `src/forms` | Generic form layout wrappers, field composition, validation display components | Domain-specific server actions, provider-specific submit behavior |
| `src/layouts` | Page shells, containers, split panes, app frame primitives | App-specific navigation trees and auth redirects |
| `src/icons` | Product icon set, visual assets, icon wrappers | Provider credentials or runtime state |
| `src/tokens` | Design tokens, spacing, radius, color, typography, motion tokens | Business configuration or environment values |
| `src/styles` | Shared CSS, Tailwind entrypoints, CSS variables | App-only global styles that assume one app root |
| `src/hooks` | Presentation-only hooks, viewport/layout hooks | Auth hooks, data-fetching hooks, billing hooks |
| `src/utils` | Presentation utilities such as class merging or style helpers | Business helpers, DB helpers, server-only helpers |

---

## 5. Allowed and Forbidden Coupling

Allowed:

- React.
- Styling dependencies.
- Icon dependencies.
- `@repo/shared` utilities.
- Framework-neutral type helpers.
- Optional framework adapter subpaths if explicitly designed later.

Forbidden:

- Database access.
- Payment logic.
- Credits deduction.
- Auth session fetching.
- Next.js route handlers.
- Server actions.
- `@/actions`, `@/db`, `@/payment`, `@/credits`, `@/storage`, `@/auth` imports.
- Concrete page data fetching.
- Direct provider SDK initialization.
- `next/navigation`, `next/headers`, `cookies()`, or route mutation logic in reusable components.

`next/link`, `next/image`, and `next-intl` require an explicit adapter decision. The safer default is to keep those components app-local until a framework adapter pattern is approved.

---

## 6. Current Component Sedimentation Plan

### Phase A: Audit

Use the existing UI boundary audit as the starting point and update it before extraction:

- Classify primitives, layout components, marketing blocks, dashboard pieces, AI components, docs components, and business components.
- Mark dependencies that block extraction.
- Mark components that need adapter props instead of direct app imports.
- Verify style/token ownership.

### Phase B: Extract primitives only if stable

Candidate source:

- `apps/web/src/components/ui`
- Low-risk `shared` or layout utilities that do not depend on app routes.

Do not extract:

- Auth forms.
- Billing buttons.
- Credits UI.
- Admin tables.
- Settings pages.
- Components with server actions or route assumptions.

### Phase C: Extract product patterns

Candidate categories:

- Generic dashboard layout shells.
- Generic data display patterns.
- Reusable marketing section shells with content passed as props.
- Generic docs/changelog/legal presentation components.

### Phase D: Extract AI presentation components

Only after v0.2/v0.3 AI workspace components stabilize:

- Thread shell presentation.
- Message part renderers.
- Tool-call status UI.
- Attachment and citation displays.
- Model/agent picker presentation shells.

Keep runtime wiring, API calls, and usage/credits behavior in apps.

---

## 7. When Creation Is Allowed

Create `packages/design-system` only when all are true:

- User explicitly confirms entering design-system extraction.
- Updated component dependency audit exists.
- Package boundary and exports are approved.
- First extraction set is small and reversible.
- `apps/web` import migration plan exists.
- Style/tokens ownership is clear.
- No future app split is blocked by missing design-system.

Recommended horizon: v0.7.

---

## 8. Migration Strategy

1. Keep all components in `apps/web` during AI infrastructure foundation.
2. Identify repeated needs across future app boundaries.
3. Extract tokens/styles only after confirming Tailwind and CSS variable ownership.
4. Extract primitives with no app dependencies.
5. Extract blocks only when content/data comes through props or slots.
6. Add subpath exports gradually.
7. Update `apps/web` imports in small batches.
8. Run targeted typecheck/lint for affected workspaces.

Do not combine design-system extraction with AI runtime implementation in the same PR.

---

## 9. Design System Acceptance Criteria

Future `packages/design-system` is healthy when:

- It can be consumed by `apps/web` and at least one planned future app.
- It has explicit subpath exports.
- It does not import from any app.
- It does not fetch sessions or mutate business state.
- It can render with mock/static props.
- It has clear token/style ownership.
- It reduces duplication without forcing premature app splits.
