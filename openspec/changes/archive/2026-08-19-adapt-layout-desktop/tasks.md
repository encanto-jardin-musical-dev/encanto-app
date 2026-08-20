## 1. Extract shared navigation gating

- [x] 1.1 Create `src/components/common/navigation.ts` with the shared nav item list (key, route, icon, adminOnly, flag) extracted from `ActionButton.tsx` STAFF_ACTIONS, plus Feed as an always-visible item
- [x] 1.2 Create `useNavItems()` hook (role from `userRoleAtom` + per-action PostHog flags read unconditionally, `=== true` checks) returning the visible nav items for the current user
- [x] 1.3 Refactor `ActionButton.tsx` to consume the shared list/hook; verify plus-button behavior unchanged (flag off fallback, staff menu, parent direct navigation)
- [x] 1.4 Add i18n keys for sidebar-specific labels (Feed item, messages empty state, sidebar accessible labels) to all locale catalogs in `src/i18n/`

## 2. App shell and sidebar components

- [x] 2.1 Create `Sidebar` client component in `src/components/common/` — app icon, app name, collapsible icon-only mode, nav items from `useNavItems()` with localized labels, active-route highlight via `usePathname()` prefix match, clickable user avatar that opens the avatar edit modal, signed avatar URL helper
- [x] 2.2 Create `AppShell` client component — `h-dvh flex`, sidebar hidden below `md:`, main scroll region rendering children in a centered width constraint (`w-full max-w-5xl mx-auto` default)

## 3. Route group migration

- [x] 3.1 Create `src/app/(app)/layout.tsx` rendering `AppShell` around children
- [x] 3.2 Move `feed` into `(app)` preserving parallel routes (`@user`, `@group`, `layout.tsx`, `page.tsx`, `default.tsx`); remove the `md:w-80` left-aligned column from the feed layout; verify feed renders both slots
- [x] 3.3 Move `messages` into `(app)`; remove `md:w-80` column and standalone `h-screen` from the messages layout
- [x] 3.4 Move `admin` into `(app)`; remove `md:w-80` column and standalone `h-screen` from the admin layout; verify admin hub and entity list/detail pages fill the shell main region
- [x] 3.5 Move `attendance`, `tasks`, `reports` into `(app)`; replace their full-bleed `h-screen`/`h-full` page wrappers so they fill the shell main region with constrained width

## 4. Messages two-pane on desktop

- [x] 4.1 Update messages layout to a two-column grid at `md:+` (fixed-width contacts pane + conversation pane); keep drill-down behavior below `md:`
- [x] 4.2 Add desktop empty state (localized) in the conversation pane when no `[senderID]` is selected
- [x] 4.3 Verify selection state derives solely from the `[senderID]` route param (no extra client state) and chat page grid rows adapt inside the pane

## 5. Action button and clearance adaptation

- [x] 5.1 Make FAB clearance paddings mobile-only (`pb-20`, `pb-[calc(5rem+2vh)]` in `FeedGroup.tsx`, `reports/new/page.tsx`, `admin/children/[childID]/page.tsx`, etc. → `md:pb-0` or equivalent)
- [x] 5.2 Verify the FAB is visible and activatable on desktop without overlapping the sidebar or constrained content

## 6. Verification

- [x] 6.1 Desktop viewport pass: feed, messages (list + conversation + empty state), admin hub + children/groups/teachers/parents list & detail, attendance, tasks, reports (list, new, detail) — centered content, sidebar gating per role, active highlight
- [x] 6.2 Mobile viewport pass: same routes — confirm no visual/behavioral regressions vs. pre-change layout
- [x] 6.3 Verify role/flag matrix: parent sidebar (Feed + Messages), teacher (no Admin), admin (all), disabled/loading flags hide items in both sidebar and plus-button menu
- [x] 6.4 Run `pnpm lint` and `pnpm build`; fix any issues
