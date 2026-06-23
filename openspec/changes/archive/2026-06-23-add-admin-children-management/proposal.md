## Why

The Admin dashboard currently only lists shortcut tiles and a summary — none of the entity create/edit flows exist. Admins need to actually manage children: browse the full roster, search it, view a child's detail (groups + parents), and create or edit a child record. This change delivers the first end-to-end admin CRUD vertical (Children) and establishes the route structure, contextual action button, and toast conventions that the remaining entities (Groups, Teachers, Parents) will reuse.

## What Changes

- **Route restructure**: rename the admin base route from `/admin-options` to `/admin` and adopt the nested structure from the wireframe:
  - `/admin` (dashboard), `/admin/children` (list), `/admin/children/new` (create), `/admin/children/[childID]` (detail), `/admin/children/[childID]/edit` (edit).
  - The dashboard tiles point at `/admin/{groups,children,teachers,parents}`; only the Children routes are built in this change (the others remain navigable stubs).
- **Children list screen**: a searchable, alphabetically-ordered (by name) list of children with **lazy loading / infinite scroll, 20 records per request**. A search bar filters the list by name. Each row shows the child's avatar (or a placeholder when none), name, and parent name (when a guardian exists).
- **Add Children screen**: a form to create a child. Required fields are ID (document type + number), names, last names, gender, birth date, and address. **Avatar and groups are optional** — a child can be created without an avatar image or any group. **Parents/guardians are not part of creation** and are never required to create a child.
- **Children detail screen**: shows the child's identity (gender, name, ID type + number, birth date, address), the **Groups** they belong to (may be empty), and the **Parents** (guardians, with name + email — may be empty).
- **Children edit screen**: the same form prefilled with the child's data; on submit it updates the record.
- **Contextual action button**: the floating action button SHALL change per screen — on the list it is "Add" (navigates to `/admin/children/new`), on the create/edit form it is "Save" (submits the form), and on the detail screen it is "Edit" (navigates to the edit screen). Icon and behavior change with context.
- **Toast notifications**: show success/error toasts on child creation and edit using the existing HeroUI `addToast`.
- **i18n**: all new titles, labels, field labels, placeholders, and toast copy come from the `next-intl` catalog (`messages/es.json`); no hardcoded user-facing strings.

## Capabilities

### New Capabilities
- `admin-children-management`: Admin CRUD for children — a searchable, lazily-loaded children list (20/page, alphabetical), a child detail view (identity, groups, parents), and create/edit forms, with success/error toasts and localized copy.
- `admin-contextual-action-button`: A screen-aware floating action button whose icon and behavior change by context (Add on a list, Save on a form, Edit on a detail view), reused across admin entity screens.

### Modified Capabilities
- `admin-options-page`: the admin dashboard moves from `/admin-options` to `/admin`, and its shortcut tiles point at the new `/admin/{entity}` routes.
- `plus-button-actions`: the admin entry action navigates to `/admin` instead of `/admin-options`.

## Impact

- **Routing**: rename `src/app/admin-options/` → `src/app/admin/`; add `src/app/admin/children/` with `page.tsx`, `new/`, `[childID]/`, and `[childID]/edit/`. Update all references to `/admin-options` (`AdminShortcuts.tsx`, `ActionButton.tsx`, page titles).
- **Components**: new `src/components/admin/children/` (list, list item, search, form, detail, groups section, parents section); a reusable contextual action button under `src/components/admin/` (or `common/`).
- **Data**: new queries under `src/queries/children/` (paginated list with search, get-by-id with relations, insert, update; link `child_groups`) and matching hooks under `src/hooks/` (`useInfiniteQuery` for the list, `useMutation` for create/edit). Reads `groups` and `child_guardians`/`profiles` for the detail and form.
- **i18n**: extend `messages/es.json` with an `AdminChildren` namespace (and update the existing admin title key if needed).
- **State**: optionally a small atom/context to let a screen register the current action-button behavior, or per-screen rendering of the contextual button.
- **RLS**: child create/update is admin-gated (existing `admin_insert_children` / `admin_update_children` policies in `20260416120000_admin_entity_management_rls.sql`); reads rely on existing read policies.
- **Dependencies**: no new packages (HeroUI `addToast`, React Query `useInfiniteQuery`/`useMutation`, Heroicons).
