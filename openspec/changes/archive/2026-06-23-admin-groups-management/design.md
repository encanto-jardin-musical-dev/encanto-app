## Context

The children admin module (`/admin/children`) is a complete, recently-shipped reference for entity CRUD in this app: list page with `NavigationBar` + search + infinite list + `AdminActionButton`, a `new` page, a `[id]` detail page, and a `[id]/edit` page, all backed by `src/queries/children/` functions wrapped in `src/hooks/Use*` React Query hooks. The `groups` table and admin write RLS already exist; only the UI/data layer and a storage bucket are missing. This change clones the children pattern for groups so the codebase stays consistent.

Relevant schema (`groups`): `id`, `name` (required), `image_url` (nullable), `teacher_id` (nullable FK → `profiles`), `created_at`, `updated_at`. Children belong to groups via the `child_groups` join table. Admin INSERT/UPDATE/DELETE RLS on `groups` is already in place via `is_admin(auth.uid())`.

## Goals / Non-Goals

**Goals:**
- Mirror the children module's structure exactly so patterns are predictable.
- Required name, optional image, optional single teacher on create/edit.
- Detail shows image, name, assigned teacher, and member children.
- Reuse `AdminActionButton` (`add` / `save` / `edit` variants), `NavigationBar`, debounced search, infinite scroll, and signed-URL image handling.

**Non-Goals:**
- Multiple teachers per group. The wireframe shows two teacher avatars, but `groups.teacher_id` is a single nullable column. Single teacher only; multi-teacher is future work requiring a schema change.
- A `<Location>` field shown in the wireframe — no column exists; omitted.
- Managing group membership of children from the group screens (children are assigned to groups from the child form today). Detail shows members read-only.
- Any DB schema change to `groups` (already exists).

## Decisions

- **Reuse children architecture verbatim.** Files map 1:1: `GroupsSearchBar`, `GroupsList`, `GroupListItem`, `GroupForm` (+`GroupFormRef`), `GroupDetail`, `ConfirmDeleteGroupModal`; queries `get-groups-page`, `get-group-by-id`, `create-group`, `update-group`, `delete-group`, `get-available-teachers`; hooks `UseGroupsListQuery`, `UseGroupByIdQuery`, `UseCreateGroupMutation`, `UseUpdateGroupMutation`, `UseDeleteGroupMutation`. Rationale: lowest-risk, matches CLAUDE.md query→hook→component rule and existing review precedent.

- **Group image via a dedicated private bucket `group-images` + signed URLs.** Mirror `uploadChildAvatar.ts` as `uploadGroupImage.ts` (validate type/size, upload to `${groupId}/image.${ext}`, return storage path; resolve to signed URLs for display). Create-flow uploads to a `tmp-${Date.now()}` key before the row id exists, same as children. Rationale: consistency with the established private-bucket-with-signed-URL approach; avoids a public bucket.

- **Single teacher picker.** `GroupForm` loads teachers via `get-available-teachers` (`profiles` where `role = 'teacher'`) and renders a single optional `Select` bound to `teacher_id`. Alternative (multi-select join table) rejected — out of scope, needs schema change.

- **List query shape.** `get-groups-page` selects `id, name, image_url` with `ilike` name search, `order('name')`, keyset/offset pagination identical to `get-children-page`; resolves `image_url` to signed URLs in batch. `UseGroupsListQuery` uses `useInfiniteQuery` with key `['groups-list', search]`.

- **Detail data.** `get-group-by-id` returns the group plus the joined teacher profile (`teacher:profiles(...)`) and member children via `child_groups(children(...))`, resolving image/avatar paths to signed URLs. `GroupDetail` renders image + name, a teacher card, and a children grid (read-only). Hook key `['group', groupID]`.

- **Mutations invalidate `['groups-list']`** (and `['group', id]` on update) so the list/detail refresh, matching children mutation hooks.

## Risks / Trade-offs

- **Wireframe vs. schema mismatch (multi-teacher, location)** → Implement to the schema (single teacher, no location); call it out in proposal/non-goals so reviewers and the user can confirm. If multi-teacher is truly needed, it's a follow-up change with a `group_teachers` join table.
- **New storage bucket requires a migration** → Add `group-images` bucket migration modeled on `20260613100000_create_children_avatars_bucket.sql`, with the same RLS (admins write, authenticated read via signed URLs). Risk: bucket must exist before image upload works; the form degrades gracefully when no image is chosen.
- **Temp-key upload orphans on create** → Same known trade-off as children; acceptable, and an image is optional.

## Migration Plan

1. Add the `group-images` storage bucket migration (private, admin write, authenticated read).
2. Ship queries/hooks/components/routes (no runtime dependency on the migration unless an image is uploaded).
3. No rollback complexity — additive only; the `/admin/groups` link already points at the new route.

## Open Questions

- Confirm single-teacher is acceptable for v1 (wireframe implies multiple). Proceeding with single per the written requirement ("assign a teacher").
- Should the children grid on detail be tappable to the child detail? Defaulting to read-only display; can be linked later.
