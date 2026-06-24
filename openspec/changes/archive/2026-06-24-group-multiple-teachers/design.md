## Context

`groups.teacher_id` is a single nullable FK → `profiles`. Its only reader in the codebase is `getUserGroups(client, userID)` (`src/queries/users/get-user-groups.ts`), consumed by `UseGetUserGroupsQuery` → `UserHydrator`, which hydrates the set of groups a teacher belongs to for the feed. The pending `admin-groups-management` change adds the admin CRUD UI assuming a single teacher.

The app already has a precedent for many-to-many group membership: `child_groups` links children to groups, and the children flow reconciles those links on create/update (`create-child.ts`, `update-child.ts`). We mirror that precedent for teachers.

## Goals / Non-Goals

**Goals:**
- A group can have zero or more teachers via a `group_teachers` join table.
- Preserve teacher-side behavior: a teacher still sees "my groups" in the feed.
- Reconcile teacher links on group create/edit the same way `child_groups` are reconciled.
- No dual source of truth — `groups.teacher_id` is removed after backfill.

**Non-Goals:**
- Changing how children are linked to groups.
- Per-teacher roles within a group (lead vs. assistant) — flat membership only.
- Reworking the feed/hydration logic beyond updating the one query.

## Decisions

- **Join table `group_teachers`** with `id` (uuid pk), `group_id` (FK → `groups`, on delete cascade), `teacher_id` (FK → `profiles`, on delete cascade), `created_at`, and a unique constraint on `(group_id, teacher_id)`. Indexes on `group_id` and `teacher_id`. Rationale: identical shape and conventions to `child_groups`.

- **RLS**: admin INSERT/UPDATE/DELETE via `is_admin(auth.uid())`; SELECT for authenticated users (so teachers can read their own memberships and admins can read all). Mirrors the `child_groups` policies added in `20260416120000_admin_entity_management_rls.sql`.

- **Backfill then drop `teacher_id`**. Migration order: (1) create `group_teachers` + RLS; (2) `insert into group_teachers (group_id, teacher_id) select id, teacher_id from groups where teacher_id is not null`; (3) `alter table groups drop column teacher_id`. Rationale: avoids a lingering dual source of truth. Alternative (keep `teacher_id` as "primary teacher") rejected — adds ambiguity and sync burden for no current requirement.

- **Update `getUserGroups`** to select groups joined through `group_teachers`: `from('group_teachers').select('groups(*)').eq('teacher_id', userID)` (then map to the group rows), or an equivalent inner-join select on `groups`. Keep the hook's return shape (array of group rows) stable so `UserHydrator` needs no change. Verify the mapped shape matches what `UserHydrator` reads.

- **Admin form reconciliation**. `GroupForm` exposes `teacherIds: string[]` via a multi-select (`selectionMode="multiple"`) populated from `get-available-teachers`. `create-group` inserts the group then bulk-inserts `group_teachers` links. `update-group` diffs existing vs. selected links and inserts/deletes the difference — the exact pattern used for `child_groups` in `update-child.ts`.

- **Detail** uses `get-group-by-id` selecting `group_teachers(profiles(...))`; `GroupDetail` renders a teacher list/grid (the wireframe's "Teachers:" row).

- **Type regeneration** via `supabase gen types typescript` so `group_teachers` is typed and `groups.teacher_id` is removed.

## Risks / Trade-offs

- **Dropping `groups.teacher_id` is irreversible in-place** → Backfill into `group_teachers` runs in the same migration before the drop, so no data is lost. Rollback = restore from backup / re-add column from the join table.
- **`getUserGroups` shape drift** → If the join-through select returns nested `{ groups: {...} }` objects, `UserHydrator`'s mapping could break. Mitigation: shape the query to return flat group rows (or update the mapping) and verify against `UserHydrator` lines 96–106 during implementation.
- **Ordering dependency with `admin-groups-management`** → If this lands first, the not-yet-built `create-group`/`update-group`/`get-group-by-id` must be authored against `group_teachers` from the start. Mitigation: land `admin-groups-management` first, or implement both together; tasks below assume the group queries exist or are created here.
- **`teacher_id` re-appearing in generated types** if regeneration is skipped → Task explicitly regenerates types.

## Migration Plan

1. Migration: create `group_teachers` + RLS, backfill from `groups.teacher_id`, drop `groups.teacher_id`.
2. Regenerate database types.
3. Update `getUserGroups`; verify teacher feed hydration unchanged.
4. Update/author group create/update/detail queries and `GroupForm`/`GroupDetail` for multiple teachers.
5. Update i18n.

Rollback: re-add `groups.teacher_id` (nullable), backfill the first teacher per group from `group_teachers`, revert the query/UI changes.

## Open Questions

- Should a group require at least one teacher, or is zero allowed? Defaulting to **zero allowed** (consistent with the current nullable column and the optional-teacher requirement in `admin-groups-management`).
- If a teacher is deleted, `on delete cascade` removes their links — confirm that matches desired behavior (assumed yes).
