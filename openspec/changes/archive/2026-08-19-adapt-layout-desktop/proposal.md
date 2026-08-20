## Why

Encanto is a mobile-first PWA, and its layout assumes a phone viewport. On desktop the experience is broken: feed, messages, and admin are clamped into a left-aligned 320px column, while attendance, tasks, and reports stretch full-bleed across the viewport. Navigation relies entirely on a floating action button and back-bar headers, with no persistent navigation. As teachers, admins, and parents increasingly use the app from desktop browsers, we need a layout that adapts to larger screens.

## What Changes

- Introduce a shared responsive app shell for authenticated routes: persistent sidebar navigation on desktop breakpoints, no chrome changes on mobile.
- Sidebar navigation items reuse the existing role + PostHog feature-flag gating matrix (the same rules as the plus button's staff actions), with the active route highlighted.
- Unify desktop width handling: all pages render inside a centered, constrained content area on desktop instead of left-aligned 320px columns or full-bleed stretching.
- Messages becomes a two-pane layout on desktop (contacts list + conversation side by side); mobile keeps the current drill-down flow.
- Mobile-only chrome (fixed FAB and its clearance padding) is adapted so it does not overlap or float awkwardly inside the desktop shell.
- Mobile behavior below the desktop breakpoint is unchanged.

## Capabilities

### New Capabilities

- `desktop-layout`: Responsive app shell for authenticated routes — desktop sidebar navigation with role/flag gating, unified content width constraints, desktop two-pane messages, and adapted action-button placement.

### Modified Capabilities

<!-- None: existing capabilities keep their requirements. The plus button's behavior (gating, actions, labels) is unchanged; only its placement context adapts, which is covered by the new desktop-layout capability. -->

## Impact

- **Route structure**: authenticated routes (feed, messages, admin, attendance, tasks, reports) get wrapped in a shared shell layout, likely via a new `(app)` route group; URLs unchanged.
- **Layouts**: `src/app/feed/layout.tsx`, `src/app/messages/layout.tsx`, `src/app/admin/layout.tsx` width handling replaced by the shared shell.
- **Pages without layouts**: attendance, tasks, reports pages (currently full-bleed) gain the shared shell and width constraints.
- **Components**: new sidebar/shell components in `src/components/common/` (or `layout/`); `ActionButton` FAB clearance (`pb-20`, `pb-[calc(5rem+2vh)]`) adapted per breakpoint; messages list/chat pages adapted for two-pane on desktop.
- **Navigation logic**: reuses `STAFF_ACTIONS` gating from `src/components/common/ActionButton.tsx` and `FeatureFlagRoleGate`.
- **i18n**: sidebar labels sourced from `next-intl` catalogs (es/en).
- **No backend, database, or API changes.**
