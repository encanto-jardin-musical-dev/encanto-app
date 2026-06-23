## Why

The Admin Options dashboard already links a "Grupos" shortcut to `/admin/groups`, but that route does not exist yet. Admins currently have no way to create, browse, or edit groups from the app. This change delivers the full groups admin flow, mirroring the children module that already ships (`/admin/children`).

## What Changes

- Add a **Groups list** screen (`/admin/groups`) with a debounced name search and infinite-scroll list; each row shows the group image + name and navigates to the group detail.
- Add a **Create Group** screen (`/admin/groups/new`), reached from the list's Action Button. Form fields: required group **name**, optional **group image**, and optional **teacher** assignment.
- Add a **Group detail** screen (`/admin/groups/[groupID]`) showing the group image, name, the assigned teacher, and the list of children in the group. The Action Button switches to **edit**.
- Add an **Edit Group** screen (`/admin/groups/[groupID]/edit`) reusing the create form, plus delete.
- Add query/hook/mutation layers for groups following the established pattern (`src/queries/groups/`, `src/hooks/`).
- Add a private `group-images` storage bucket + signed-URL helper for group images (mirrors `children-avatars`).
- Add Spanish i18n keys under a new `AdminGroups` namespace.

Notes:
- The `groups` table holds a single `teacher_id`; the wireframe's multi-teacher detail and the `<Location>` label are **out of scope** (no schema support) and noted as future work.

## Capabilities

### New Capabilities
- `admin-groups`: Admin-only CRUD flow for groups — list with search, create, view detail (with assigned teacher and member children), edit, and delete.

### Modified Capabilities
<!-- None — no existing spec-level behavior changes. -->

## Impact

- **Routes**: new `src/app/admin/groups/` tree (`page.tsx`, `new/`, `[groupID]/`, `[groupID]/edit/`).
- **Components**: new `src/components/admin/groups/` (list, search bar, list item, form, detail, confirm-delete modal).
- **Queries/Hooks**: new `src/queries/groups/` + matching `src/hooks/Use*Group*` files.
- **Storage**: new private Supabase bucket `group-images` + `src/utils/uploadGroupImage.ts`.
- **DB/RLS**: no schema change required — `groups` table and admin write RLS policies already exist (`20260416120000_admin_entity_management_rls.sql`). A storage bucket migration is added.
- **i18n**: new `AdminGroups` namespace in `messages/es.json`.
- Reuses existing `AdminActionButton`, `NavigationBar`, and the teacher/children read patterns.
