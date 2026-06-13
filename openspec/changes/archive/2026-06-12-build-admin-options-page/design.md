## Context

The `/admin-options` route exists but only renders a `NavigationBar` and a centered title (`src/app/admin-options/page.tsx`). It is a Server Component that resolves its title via `getTranslations('ActionButton')`. The app uses Next.js 15 App Router + React 19, HeroUI for components, Heroicons for icons, and `next-intl` for localization (single locale `es`, messages in `messages/es.json`). Global client state uses Jotai; server state uses React Query. The wireframe defines the target Admin Options dashboard: an entity-shortcut row (Groups, Children, Teachers, Parents) plus a summary panel (Total of Kids; Today assistance → Child care, Workshops). Real assistance/summary data does not exist yet, so it must be mocked behind a swappable seam.

## Goals / Non-Goals

**Goals:**
- Render the Admin Options dashboard matching the wireframe layout (shortcut tiles + summary panel).
- Localize every header, tile label, and metric label via `next-intl` (new `AdminOptionsPage` namespace).
- Wire **Total of Kids** to real data (count of `children` rows) via a query + React Query hook following existing patterns; wire **Today assistance** (Child care `x/y`, Workshops `x/y`) to a single isolated mock source that can later be replaced by Supabase-backed data without UI changes.
- Reuse existing conventions: `NavigationBar`, HeroUI components, Heroicons, `@/` imports.

**Non-Goals:**
- Building actual create/edit flows for Groups, Children, Teachers, or Parents (tiles navigate to placeholder/stub targets only).
- Implementing real data fetching, Supabase queries, or RLS for summary/assistance metrics.
- Role gating/redirect logic on the page itself (route access is already governed upstream by the plus-button-actions admin-only entry).
- Adding new locales or changing the i18n infrastructure.

## Decisions

### Decision: Real Total of Kids via a children-count query + hook; mocked assistance
**Total of Kids** is real data: add a query (e.g., `src/queries/children/get-children-count.ts`) that uses `TypedSupabaseClient` to select `children` with `{ count: 'exact', head: true }`, returning the row count. Wrap it in a `src/hooks/UseChildrenCountQuery.ts` React Query hook (using `createClient()` from `@/utils/supabase/client` and `useQuery`), mirroring `UseGetUserChildrenQuery.ts`. **Today assistance** stays mocked in a single module (e.g., `src/lib/mock/adminAssistance.ts`) exporting a typed shape so it can later become a hook.
- **Why:** The `children` table exists and directly answers "Total of Kids"; counting with `head: true` avoids transferring rows. Following the established queries/hooks convention keeps the code consistent and makes the assistance swap (mock → query) a known, localized pattern.
- **Alternatives considered:** Fetching all children rows and counting client-side (rejected — wasteful payload); mocking Total of Kids too (rejected — real data is available now); a Postgres RPC/aggregate view (deferred — overkill for a single count, can be added later if combined summary data is needed).

### Decision: Page composition with a client summary container
The page stays a Server Component for the shell (NavigationBar, title) and reads localized strings via `getTranslations`. Because Total of Kids comes from a client-side React Query hook, the summary panel (and interactive tiles) live in small `"use client"` child components. The hook supplies `totalKids`; the mock module supplies assistance values; the panel renders both.
- **Why:** Keeps server-rendered shell where possible while allowing React Query for the live count, consistent with how the app fetches data client-side. Tiles already need `"use client"` for `onPress`/navigation.
- **Alternatives considered:** Fetching the count server-side in the page (possible, but the app's convention is client React Query hooks with `createClient()`; staying consistent reduces surprise). Handle loading/empty count states gracefully (e.g., show a skeleton/`—` until resolved).

### Decision: New `AdminOptionsPage` i18n namespace
Add an `AdminOptionsPage` block to `messages/es.json` containing: a `sections.shortcuts` header ("Create or edit new items"), `tiles.{groups,children,teachers,parents}` labels, `summary.totalKids` label, `assistance.title`, and `assistance.{childCare,workshops}` labels. The page title may continue to use the existing `ActionButton.actions.admin-options` value or a dedicated `AdminOptionsPage.title` — prefer reusing the existing title key to keep a single source of truth for the screen name (consistent with plus-button-actions).
- **Why:** Centralizes all new copy under one namespace; keeps labels resolvable by stable keys; respects the project rule that all titles/labels come from i18n.
- **Alternatives considered:** Reusing `ActionButton.actions` for tile labels (rejected — those are FAB action labels, semantically different from entity shortcuts).

### Decision: Component structure under `src/components/admin/`
Introduce focused components: a shortcut tile (`AdminShortcutTile`) rendered in a responsive grid/row, and a summary panel (`AdminSummaryPanel`) composing the Total of Kids figure and two assistance metrics (`AssistanceMetric` showing `current/total`). Built with HeroUI primitives and Heroicons.
- **Why:** Keeps components small and feature-organized per `AGENTS.md`; mirrors existing `src/components/{domain}/` structure.
- **Alternatives considered:** One monolithic page component (rejected — harder to read/test and inconsistent with conventions).

### Decision: Tile navigation targets are stubs
Each tile maps a stable key to a route. Targets point at placeholder/not-yet-implemented routes (or a shared "coming soon" placeholder) since create/edit flows are out of scope. Keys mirror the entity names (`groups`, `children`, `teachers`, `parents`).
- **Why:** Lets the UI be fully wired and navigable now while deferring the heavy CRUD work to follow-up changes.

## Risks / Trade-offs

- **Mocked assistance masks integration gaps** → Mitigation: isolate it in one typed module with a clear `// TODO: replace with live data` marker so the swap point is obvious and greppable.
- **Children count query/RLS** → Mitigation: the count read must respect existing RLS for the `children` table; verify an admin session can read the count, and handle loading/error states (show a placeholder rather than a crash).
- **Tile routes lead nowhere yet (dead ends)** → Mitigation: point them at a clearly labeled placeholder destination (or reuse the existing placeholder-screen pattern) so users see an intentional "not built yet" screen rather than a 404.
- **i18n drift / hardcoded strings creeping in** → Mitigation: enforce in tasks that every header/label is read from the `AdminOptionsPage` namespace; review for literals before completion.
- **Icon choice ambiguity for tiles** → Mitigation: pick the closest existing Heroicons (e.g., user-group for Groups, face/child-like for Children, academic-cap/user for Teachers, users for Parents); document choices in tasks.

## Migration Plan

Additive, UI-only change with no data model or breaking impact:
1. Add `AdminOptionsPage` keys to `messages/es.json`.
2. Add the children-count query and `UseChildrenCountQuery` hook (real Total of Kids).
3. Add the mock assistance module with a typed shape and default values from the wireframe (Child care 50/100; Workshops 30/100).
4. Build the admin components and compose them in `page.tsx`, feeding the real count and mocked assistance into the summary panel.
5. Verify with `pnpm lint` and `pnpm build`; manually verify the page renders the wireframe layout with localized copy and a real children count.
Rollback: revert the page body to the prior placeholder and remove the new components/query/hook/keys; no DB migrations to undo (read-only count query).

## Open Questions

- Should the four tiles navigate to dedicated placeholder routes (one per entity) or a single shared placeholder for now? (Default assumption: shared/stub placeholder until CRUD changes land.)
- Confirm the exact Spanish copy for each label (proposed values to be added in es.json; adjust to product wording if provided).
- Should the page title use the existing `ActionButton.actions.admin-options` value or a new `AdminOptionsPage.title`? (Default: reuse existing to keep one source of truth.)
- Does the existing `children` RLS allow an admin client session to read the count? (Assumed yes; verify during implementation and fall back to an RPC/count view if a policy blocks it.)
