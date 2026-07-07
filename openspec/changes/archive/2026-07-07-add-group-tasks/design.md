# Design — Add Group Tasks

## Context

The `tasks` table already exists remotely (`title`, `description`, `due_date`, `group_id`, `teacher_id`, `attachments Json`, timestamps) with FKs to `groups` and `profiles`, but it has never been wired up: its only RLS policy is `SELECT USING (true)` and there are no write policies. The `/tasks` route is a placeholder gated by the `admin_options_tasks` PostHog flag via `ActionButton` (`src/components/common/ActionButton.tsx:46-50`).

Existing building blocks this change composes:

- **Group resolution per role** is already solved: `UserHydrator` populates `userSelectOptionsAtom` with group ids — a teacher's assigned groups (`group_teachers`), all groups for admins, and for parents each child option's **key is the child's `group_id`** (`UserHydrator.tsx:106`). The feed's `contextGroupValue` atom therefore already yields "the selected child's group" for parents and "the selected group" for staff.
- **Staff group listing pattern**: `get-attendance-groups.ts` (teacher → `group_teachers!inner`, admin → all groups).
- **Flag + role gating**: `FeatureFlagRoleGate` renders `notFound()` unless the flag is on and role is allowed (used by `/attendance`).
- **Attachments**: S3 presigned uploads via `upload-attachment-url` (staff-only) and read-side signing via `sign-attachment-urls` + `UseAttachmentUrlsQuery`, already used for message attachments with an `Attachment[]` JSON shape.
- **RLS helpers**: `public.is_staff(uuid)` and `public.is_admin(uuid)` already exist (attendance migration).
- **Feed store**: `groupTasksAtom` already declared in `src/lib/store/feed.ts`.

Wireframe routes: `/tasks` (list + search + FAB), `/tasks/new` (create form), `/tasks/[groupId]/[taskId]` (detail).

## Goals / Non-Goals

**Goals:**

- Staff can create, list, search, edit, and delete tasks for groups they are allowed to manage (teacher: assigned groups; admin: any group).
- Parents see task cards in the feed for the selected child's group only, can filter the feed by "Tareas", and can open a read-only detail view.
- Database is safe by default: RLS enforces the same rules the UI enforces, so no client bug can leak tasks across groups.
- All UI behind `admin_options_tasks`; DRY reuse of the query→hook→component pattern, `FeatureFlagRoleGate`, `NavigationBar`, and the attachment infra.

**Non-Goals:**

- Link entries in the task body (wireframe TODO — future change).
- Push notifications when a task is created.
- Task completion / submission tracking per child.
- Daily-report cards in the feed (the "Reportes" chip stays disabled).

## Decisions

### D1 — RLS via a migration, no schema changes

The table shape already matches the wireframe (title, due date, description, attachments, group, author). We only add policies:

- Drop `"Enable read access for all users"`.
- `SELECT`: `is_staff(auth.uid())` **OR** guardian-of-child-in-group (`EXISTS` over `child_guardians` ⋈ `child_groups` on `tasks.group_id`).
- `INSERT` / `UPDATE` / `DELETE`: `is_admin(auth.uid())` **OR** the acting user teaches the group (`EXISTS` over `group_teachers WHERE teacher_id = auth.uid() AND group_id = tasks.group_id`). `INSERT` additionally requires `teacher_id = auth.uid()` so authorship can't be forged.

*Alternative considered*: an RPC (`get_group_tasks`) like `get_profiles_by_guardian`. Rejected — plain table queries under RLS are simpler, typed for free, and there is no cross-table shaping to do.

*Note*: staff SELECT is intentionally school-wide (like attendance groups for admins); teachers writing is what's scoped. This matches how small-school staff roles work elsewhere in the app.

### D2 — Group scoping reuses `contextGroupValue`; no new selector

For parents the feed already binds the child selector to a group id. The parent tasks query keys on `['tasks', groupId]` with `groupId = contextGroupValue`, so switching children switches tasks automatically and a parent never queries a group their selected child isn't in (RLS backstops this).

For the staff list page, `/tasks` shows tasks for **all groups the user manages** (teacher: assigned; admin: all), since the wireframe list is not group-tabbed. The create form has a group `Select` populated from the same source as `UserHydrator`/attendance groups.

### D3 — Data layer: one `tasks` domain, shared by both experiences (DRY)

`src/queries/tasks/`:

- `get-group-tasks.ts` — tasks for a single `group_id` (parent feed + staff filter), ordered `created_at DESC`.
- `get-staff-tasks.ts` — tasks for the user's managed groups with `groups(name)` join; accepts optional `teacherId` exactly like `getAttendanceGroups` (teacher passes own id, admin omits).
- `get-task-by-id.ts` — single task with group name + author profile for the detail page.
- `create-task.ts`, `update-task.ts`, `delete-task.ts`.

`src/hooks/`: `UseGroupTasksQuery`, `UseStaffTasksQuery`, `UseTaskByIdQuery`, `UseCreateTaskMutation`, `UseUpdateTaskMutation`, `UseDeleteTaskMutation`. Mutations invalidate `['tasks']`. Query keys: `['tasks', 'group', groupId]`, `['tasks', 'staff', userId]`, `['tasks', 'detail', taskId]`.

List search is **client-side** filtering on title (the school's task volume is tiny; avoids a server search API). *Alternative*: `ilike` server search — rejected as premature.

### D4 — Routes and components

| Route | Access | Content |
|---|---|---|
| `/tasks` | staff (`FeatureFlagRoleGate`) | search input, task list (`TaskListItem` with kebab menu: view/edit/delete), FAB → `/tasks/new` |
| `/tasks/new` | staff (`FeatureFlagRoleGate`) | `TaskForm`: title, group select, due date (`DatePicker`), description with counter, "Add files" |
| `/tasks/[groupId]/[taskId]` | staff + parent (flag-gated, RLS scopes rows) | read-only detail: title, group, due date, description, attachment previews; edit/delete for staff |

Edit reuses `TaskForm` in edit mode (SOLID: one form component, create/update behavior injected via props/mutation). Server pages stay thin (like `/attendance`): `NavigationBar` + gate + client component.

Detail-page gating differs from staff pages: the flag must be on, but **both roles** are allowed (`allowedRoles: [parent, teacher, admin]`), because parents navigate here from the feed card.

### D5 — Parent feed integration

- `TaskFeedCard` (new, `src/components/feed/`) renders the wireframe's colored card: title, description snippet, due date, relative created time, "Ver más" link → `/tasks/[groupId]/[taskId]`.
- `FeedGroup` additionally runs `UseGroupTasksQuery(contextGroupValue)` (enabled only when the `admin_options_tasks` flag is true) and stores results in the existing `groupTasksAtom`. Task cards and message cards are merged into one list sorted by `created_at` DESC — matching the wireframe where the task card sits between messages.
- `FeedFilters` becomes stateful: a `feedFilterAtom` (`'all' | 'messages' | 'tasks'`) in `src/lib/store/feed.ts`; the "Tareas" chip is enabled only when the flag is on; `FeedGroup` filters the merged list by the atom. "Reportes" stays disabled.

*Alternative considered*: a dedicated parent `/tasks` list page. Rejected — the wireframe puts the parent experience in the feed; the detail route covers "see more".

### D6 — Attachments reuse the message pipeline

`TaskForm` uses the same presigned-PUT flow (`upload-attachment-url`, staff-only — which matches tasks being staff-authored) and stores the same `Attachment[]` JSON shape in `tasks.attachments`. Detail view signs read URLs through `sign-attachment-urls` / `UseAttachmentUrlsQuery`. No new edge functions or buckets.

## Risks / Trade-offs

- [Open SELECT policy dropped could break an unknown consumer] → grep shows no code reads `tasks` today except the unused `groupTasksAtom`; verified before migration lands.
- [Parent with a child in multiple groups] → `UserHydrator` already takes `child_groups[0]`; tasks inherit that existing behavior rather than solving multi-group children here.
- [Merged feed of messages + tasks complicates `FeedGroup`] → keep merge logic in a small pure helper (`mergeFeedItems`) that is trivially unit-testable later; cards stay separate components.
- [Client-side search won't scale] → acceptable at kindergarten scale; the query layer isolates a later switch to server search.
- [Flag off while a parent has a deep link to a task detail] → `FeatureFlagRoleGate` renders `notFound()`, same behavior as other gated routes.

## Migration Plan

1. Ship the RLS migration first (`supabase migration new tasks_rls`); it is backward-compatible for staff and only *restricts* the currently open read.
2. Ship UI + data layer behind `admin_options_tasks` (already off/on per PostHog environment).
3. Rollback: disable the flag (UI disappears); the RLS migration can stay — it is strictly safer than the status quo.

## Open Questions

- None blocking. Group-select default for teachers with exactly one group: preselect it (small UX nicety, decided in implementation).
