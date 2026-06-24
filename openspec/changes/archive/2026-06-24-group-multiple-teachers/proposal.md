## Why

The `groups` table currently holds a single nullable `teacher_id`, so a group can have at most one teacher. The Groups admin wireframe shows multiple teachers per group, and in practice a class is often co-taught. The pending `admin-groups-management` change deliberately deferred this as out-of-scope because it needs a schema change. This change introduces a proper many-to-many model so a group can have several teachers.

This **supersedes the single-teacher decision** in `admin-groups-management`: the group create/edit form assigns a set of teachers instead of one.

## What Changes

- **BREAKING (data model)**: Add a `group_teachers` join table (`group_id`, `teacher_id`, timestamps) with admin-write / authenticated-read RLS. Backfill existing `groups.teacher_id` values into it, then **drop `groups.teacher_id`**.
- Update `getUserGroups` (the teacher feed's source of "my groups") to resolve a teacher's groups through `group_teachers` instead of `groups.teacher_id`.
- Update the groups admin flow to assign **multiple** teachers:
  - `GroupForm` uses a multi-select teacher picker and returns `teacherIds: string[]`.
  - `create-group` / `update-group` reconcile `group_teachers` links (add/remove), mirroring how `child_groups` are reconciled in the children flow.
  - `get-group-by-id` returns all assigned teachers; `GroupDetail` renders the teacher list (matching the wireframe's multi-teacher section).
- Regenerate `src/types/database.types.ts` to include `group_teachers` and drop `groups.teacher_id`.
- Update i18n for plural teacher copy.

## Capabilities

### New Capabilities
- `group-teachers`: Many-to-many association between groups and teacher profiles — schema, RLS, backfill, teacher-side group resolution, and multi-teacher assignment in the admin groups flow.

### Modified Capabilities
<!-- `admin-groups` is still defined in the pending `admin-groups-management` change (not yet in openspec/specs/), so its single-teacher requirement is amended there rather than as a delta here. This change records the superseding behavior in `group-teachers`. -->

## Impact

- **DB**: new migration creating `group_teachers` (+ RLS), backfilling from `groups.teacher_id`, dropping `groups.teacher_id`.
- **Types**: regenerate `src/types/database.types.ts`.
- **Queries**: update `src/queries/users/get-user-groups.ts`; update `create-group` / `update-group` / `get-group-by-id` (from `admin-groups-management`) to use `group_teachers`.
- **Components**: `GroupForm` (multi-select), `GroupDetail` (teacher list).
- **Consumers**: `UseGetUserGroupsQuery` → `UserHydrator` continue to work via the updated query (teacher feed unaffected functionally).
- **i18n**: plural teacher keys in `messages/es.json`.
- **Dependency**: builds on `admin-groups-management`; that change should land first (or the two are implemented together).
