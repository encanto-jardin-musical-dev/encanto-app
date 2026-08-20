## Context

Encanto is a mobile-first PWA (Next.js 16 App Router, HeroUI, Tailwind 3.4). There is no shared app shell: each route group renders its own chrome. Navigation is hub-and-spoke — `/feed` is the home, a floating action button (`src/components/common/ActionButton.tsx`) opens a role/flag-gated menu of destinations, and section pages use a back-bar header (`src/components/common/NavigationBar.tsx`).

Current desktop behavior is inconsistent:

- `feed`, `messages`, `admin` layouts clamp content to a **left-aligned** `w-full md:w-80` (320px) column (`src/app/feed/layout.tsx`, `src/app/messages/layout.tsx`, `src/app/admin/layout.tsx`).
- `attendance`, `tasks`, `reports` pages have no group layout and render **full-bleed** across the viewport.
- Only 5 `md:` usages exist in the codebase; no `useMediaQuery`, no custom breakpoints, no sidebar/topbar components.
- Mobile-only chrome: FAB fixed at `bottom-8 right-8` with clearance paddings (`pb-20`, `pb-[calc(5rem+2vh)]`) baked into content containers.

The role + feature-flag gating matrix for navigation already exists in `ActionButton.tsx` (`STAFF_ACTIONS`: attendance/reports/tasks gated by `admin_options_attendance`/`admin_options_reports`/`admin_options_tasks`, admin options admin-only, messages always visible).

## Goals / Non-Goals

**Goals:**

- A single shared responsive shell for all authenticated routes: sidebar navigation on desktop, current behavior untouched on mobile.
- Unified, centered content width on desktop for every page.
- Desktop two-pane messages (contacts list + conversation).
- Reuse the existing role + PostHog flag gating as the single source of truth for navigation visibility.
- All new chrome text localized via `next-intl`.

**Non-Goals:**

- No changes to mobile layout/behavior below the desktop breakpoint.
- No redesign of page internals (forms, lists, cards) beyond width containment.
- No collapsible/resizable sidebar, no tablet-specific layouts (v1 uses one desktop breakpoint).
- No changes to plus-button menu behavior, auth pages, or backend.

## Decisions

### 1. Shared shell via a new `(app)` route group

Move authenticated routes (`feed`, `messages`, `admin`, `attendance`, `tasks`, `reports`) under `src/app/(app)/` and render the shell from `src/app/(app)/layout.tsx`. Route groups do not affect URLs, so no redirects are needed.

**Why over alternatives:** Adding `<AppShell>` inside each of the three existing layouts (plus new layouts for attendance/tasks/reports) duplicates chrome across six locations and invites drift. A root-level wrapper can't easily exclude `(auth)`, login, and auth callback routes. The route group gives one layout, one source of truth, zero URL change.

**Note:** `feed` keeps its parallel routes (`@user`, `@group`) intact inside the group; the shell wraps the feed layout, which continues composing them.

### 2. Breakpoint: `md` (768px)

Use Tailwind's default `md` as the single desktop breakpoint, matching the existing (limited) `md:` usage in the codebase. Sidebar appears at `md:` and up; below it, nothing changes.

### 3. Shell structure

`AppShell` (client component): `h-dvh flex` — left `Sidebar` (hidden below `md:`), right main scroll region containing the page. Sidebar shows the Encanto logo, nav items, and the current user (avatar + name) at the bottom. Main region renders `{children}` inside a centered width constraint.

### 4. Nav items: extract gating into a shared hook

Extract the `STAFF_ACTIONS` list and its role/flag filtering from `ActionButton.tsx` into a shared module (e.g., `src/components/common/navigation.ts` + `useNavItems()` hook). Both the FAB menu and the sidebar consume it, keeping one source of truth. Sidebar items:

- Feed (`/feed`) and Messages (`/messages`): all roles, always visible.
- Attendance, Reports, Tasks: staff, each behind its existing per-action flag (hidden when flag is `false` or `undefined`).
- Admin (`/admin`): admin role only.

Parents see Feed + Messages. All hooks run unconditionally and in stable order, treating `undefined` as off (`=== true`), per existing convention. Active item highlighted via `usePathname()` prefix match. Labels reuse the existing `ActionButton.actions` i18n namespace plus new keys for Feed/sidebar-specific text.

### 5. Content width strategy

Inside the shell main region, pages render in `w-full max-w-4xl mx-auto` (value may vary per page type, e.g. wider for admin lists). The old `md:w-80` left-aligned columns are removed from feed/messages/admin layouts. Pages that currently manage their own `h-screen` (messages, admin) switch to filling the shell's main region (`h-full` within the scroll area).

### 6. Messages two-pane on desktop

At `md:`+, the messages layout renders a two-column grid: contacts list (fixed-width left pane) and conversation (right pane). Mobile keeps the current drill-down (list → chat). Implementation: `messages/layout.tsx` renders both panes; the list pane is hidden on mobile when a conversation route is active, and the conversation pane shows an empty state on desktop when no `[senderID]` is selected. Existing `[senderID]` route and components are reused; no data-fetching changes.

### 7. FAB placement on desktop

Keep the FAB at all breakpoints (it hosts create-actions, not just navigation). On desktop it remains fixed to the viewport bottom-right; because content is now centered and constrained, the FAB no longer overlaps content edges. Mobile-only clearance paddings (`pb-20`, `pb-[calc(5rem+2vh)]`) become mobile-only (`md:pb-0` or equivalent) where the sidebar/shell changes the geometry.

### 8. Page headers

`NavigationBar` back-bars remain as page title headers on desktop (back navigation is still meaningful within sections). No change required in v1.

## Risks / Trade-offs

- [Moving six route trees into `(app)` touches many files] → URLs are unchanged; verify with `pnpm build` and a smoke pass over every route (feed, messages list/chat, admin hub + entity pages, attendance, tasks, reports). Middleware/auth checks match on paths, which don't change.
- [Feed parallel routes break inside the new group] → Keep `layout.tsx`, `page.tsx`, `default.tsx`, `@user`, `@group` structure identical when moving; verify feed renders both slots.
- [Mobile regressions from shared shell] → All shell chrome is hidden below `md:`; mobile classes on existing pages stay untouched. Verify mobile viewport visually for each section.
- [Flag-gating duplication if hook extraction is done wrong] → Extract, then refactor `ActionButton` to consume the same hook; behavior is covered by the existing `plus-button-actions` spec scenarios.
- [Messages two-pane state (selected contact) desyncs with URL] → Selection derives from the `[senderID]` route param only; no extra client state.
- [`h-screen` vs `h-dvh` inconsistencies] → Shell uses `h-dvh`; inner pages use `h-full`/`min-h-0` within the shell instead of their own `h-screen`.

## Migration Plan

1. Extract nav gating module/hook; refactor `ActionButton` to use it (no visible change).
2. Create `(app)` route group + `AppShell` + `Sidebar` components (behind no flag; desktop-only via CSS).
3. Move routes into `(app)` one cluster at a time (feed → messages → admin → attendance/tasks/reports), updating each layout's width handling; verify build + both viewport classes after each cluster.
4. Implement messages two-pane and FAB clearance adaptations.
5. Full pass: mobile + desktop viewports for every route; `pnpm lint`.

Rollback: revert the change; no data or backend dependencies.

## Open Questions

- Content max-width per page type (`max-w-4xl` default; admin entity lists may want wider) — decide during implementation.
- Whether the sidebar should show icon+label or collapse to icons at `md` and expand at `lg` — v1 keeps icon+label at all desktop widths.
