## Why

The Admin Options screen currently exists only as a placeholder that renders its title. Admins need a real landing page that gives them quick entry points to create/edit core entities (Groups, Children, Teachers, Parents) and an at-a-glance summary of total kids and today's attendance across Child care and Workshops. This turns the admin entry point into a useful dashboard instead of an empty stub.

## What Changes

- Build out the `/admin-options` page to match the wireframe:
  - A "Create or edit new items" section with four shortcut tiles: **Groups**, **Children**, **Teachers**, **Parents**, each with an icon and a localized label.
  - A summary block showing **Total of Kids** (single large number).
  - A **Today assistance** block with two metrics rendered as `current/total`: **Child care** and **Workshops**.
- Keep the existing `NavigationBar` (back to `/feed`) and the localized page title.
- Source all titles and labels from the `next-intl` message catalog (`messages/es.json`); no hardcoded user-facing strings.
- **Total of Kids uses real data**: derive it from the count of rows in the Supabase `children` table via a dedicated query + React Query hook, following the existing `src/queries/users/*` + `src/hooks/Use*Query.ts` patterns.
- **Today assistance is mocked**: real attendance data is not yet available, so Child care and Workshops values come from a small, clearly isolated mock source that can later be swapped for live queries without UI changes.
- The four shortcut tiles navigate to placeholder destinations (no create/edit flows are built in this change); their targets are stubbed and may point to not-yet-implemented routes.

## Capabilities

### New Capabilities
- `admin-options-page`: The Admin Options dashboard — a role-appropriate landing screen with entity creation/editing shortcuts (Groups, Children, Teachers, Parents) and a summary panel (Total of Kids sourced from the real `children` table; Today assistance split into Child care and Workshops, initially mocked), with all copy localized via i18n.

### Modified Capabilities
<!-- The existing plus-button-actions spec only requires that /admin-options shows its localized name; building out the page does not change that requirement. No existing capability requirements change. -->

## Impact

- **Routing/Page**: `src/app/admin-options/page.tsx` (replaces the placeholder body with the dashboard layout).
- **Components**: New components under `src/components/admin/` (e.g., shortcut tiles grid, summary panel, assistance metric). Built with HeroUI (`@heroui/react`) and Heroicons (`@heroicons/react`) per existing conventions.
- **i18n**: New `AdminOptionsPage` namespace in `messages/es.json` for section headers, tile labels, and metric labels.
- **Data (real)**: A new query `src/queries/children/get-children-count.ts` (or under `src/queries/users/`) using `TypedSupabaseClient` to count `children` rows via a `head`/`count` select, plus a `src/hooks/UseChildrenCountQuery.ts` React Query hook wrapping it.
- **Data (mock)**: A small mock provider/util (e.g., `src/lib/mock/adminAssistance.ts`) returning today's Child care and Workshops assistance, isolated so it can later be replaced by Supabase-backed queries/hooks.
- **Dependencies**: No new packages.
