## 1. Localization

- [x] 1.1 Add an `AdminOptionsPage` namespace to `messages/es.json` with: `sections.shortcuts` header ("Crear o editar nuevos items"), `tiles.{groups,children,teachers,parents}` labels, `summary.totalKids` label, `assistance.title`, and `assistance.{childCare,workshops}` labels (Spanish copy).
- [x] 1.2 Decide the page title source (reuse existing `ActionButton.actions.admin-options` per design) and confirm it resolves the localized screen name.

## 2. Data layer

- [x] 2.1 Create `src/queries/children/get-children-count.ts` exporting `getChildrenCount(client: TypedSupabaseClient)` that selects from `children` with `{ count: 'exact', head: true }` and returns the count.
- [x] 2.2 Create `src/hooks/UseChildrenCountQuery.ts` (React Query) wrapping the query with `createClient()` and a stable `queryKey` (e.g., `['children-count']`), mirroring `UseGetUserChildrenQuery.ts`.
- [x] 2.3 Create `src/lib/mock/adminAssistance.ts` exporting a typed assistance shape `{ childCare: { current; total }; workshops: { current; total } }` with mocked wireframe values (childCare 50/100; workshops 30/100) and a clear `// TODO: replace with live data` marker.

## 3. Components

- [x] 3.1 Create `src/components/admin/AdminShortcutTile.tsx` (`"use client"`) — a HeroUI-based tile taking an icon, localized label, and route; uses `onPress` to navigate and exposes an accessible label from i18n.
- [x] 3.2 Create `src/components/admin/AdminShortcuts.tsx` rendering the four tiles (Groups, Children, Teachers, Parents) in a responsive row/grid, each mapped to a stable key, Heroicon, and stub route.
- [x] 3.3 Create `src/components/admin/AssistanceMetric.tsx` rendering a localized label and a `current/total` value.
- [x] 3.4 Create `src/components/admin/AdminSummaryPanel.tsx` (`"use client"`) consuming `UseChildrenCountQuery` for Total of Kids (with a loading placeholder before it resolves) and the mocked assistance shape for the two metrics (Child care, Workshops).

## 4. Page composition

- [x] 4.1 Update `src/app/admin-options/page.tsx` to keep the `NavigationBar` (back to `/feed`) and localized title, and render `AdminShortcuts` and `AdminSummaryPanel` below it, matching the wireframe layout.
- [x] 4.2 Ensure `AdminSummaryPanel` reads the real count from `UseChildrenCountQuery` and the mocked assistance from `src/lib/mock/adminAssistance.ts`.
- [x] 4.3 Verify all headers/labels are read from the `AdminOptionsPage` namespace — no hardcoded user-facing literals remain in the page or components.

## 5. Verification

- [x] 5.1 Run `pnpm lint` and resolve any issues.
- [x] 5.2 Run `pnpm build` to confirm the page type-checks and builds.
- [x] 5.3 Confirm an admin session can read the `children` count under existing RLS (check `get_advisors`/manual query); if blocked, fall back to an RPC/count view.
- [x] 5.4 Manually verify at `/admin-options`: shortcut tiles render with icons/labels and navigate; Total of Kids shows the real `children` count (with a graceful loading placeholder first); Child care shows 50/100; Workshops shows 30/100; back action returns to the feed; all copy is in Spanish from the catalog.
