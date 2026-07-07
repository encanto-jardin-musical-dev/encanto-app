# Add Group Tasks

## Why

Teachers and admins currently have a Tasks action behind the `admin_options_tasks` feature flag, but it lands on a placeholder page — there is no way to create or manage tasks, and parents have no visibility into what their children's groups have been assigned. The `tasks` table already exists in the database but is unused and protected only by a wide-open `SELECT USING (true)` RLS policy with no write policies.

## What Changes

- Replace the `/tasks` placeholder with a real staff experience: a searchable task list, a create form (`/tasks/new`) with title, due date, description, and file attachments, and a task detail view (`/tasks/[groupId]/[taskId]`).
- Teachers create tasks for their **assigned** groups; admins for **any** group. Task rows record the creating staff member (`teacher_id`).
- Staff can edit and delete their tasks via a per-row actions menu (kebab) on the list.
- Parents see tasks in the existing feed as task cards, scoped to the group of the **currently selected child** — a parent with children in different groups only sees tasks for the selected child's group. Tapping a card opens the task detail.
- Enable the currently disabled "Tareas" chip in the feed filters so parents can filter the feed to tasks.
- Harden `tasks` RLS: drop the open read policy; scope SELECT to staff and to guardians of children in the task's group; add INSERT/UPDATE/DELETE policies for staff (teachers limited to their assigned groups, admins unrestricted).
- Reuse the existing S3 presigned-URL attachment infrastructure (`upload-attachment-url` / `sign-attachment-urls` edge functions) for task attachments.
- Everything is gated behind the existing `admin_options_tasks` PostHog feature flag: staff pages via `FeatureFlagRoleGate`, parent-facing feed cards and filter chip via the flag hook.

Out of scope (per wireframe TODO): adding links to a task description; push notifications on task creation.

## Capabilities

### New Capabilities

- `group-tasks-management`: Staff (teacher/admin) creation, listing, search, editing, and deletion of tasks scoped to groups, including database-level access rules (RLS) for the `tasks` table.
- `feed-tasks`: Parent-facing task visibility — task cards in the feed scoped to the selected child's group, the tasks feed filter, and read-only task detail for parents.

### Modified Capabilities

- `plus-button-actions`: The "Placeholder screens for new staff actions" requirement changes — Tasks is no longer a placeholder; its destination becomes the real tasks list screen.

## Impact

- **Routes**: `src/app/tasks/page.tsx` (rewritten), new `src/app/tasks/new/page.tsx`, new `src/app/tasks/[groupId]/[taskId]/page.tsx`.
- **Components**: new `src/components/tasks/*`; `src/components/feed/FeedGroup.tsx`, `FeedFilters.tsx` (task cards + filter); reuses `FeatureFlagRoleGate`, `NavigationBar`, attachment picker patterns.
- **Data layer**: new `src/queries/tasks/*` query functions and `src/hooks/UseTask*` React Query hooks following the established query → hook → component pattern; existing `groupTasksAtom` in `src/lib/store/feed.ts`.
- **Database**: new migration for `tasks` RLS policies (no schema change — table already exists); regenerate `database.types.ts` only if schema changes turn out to be needed.
- **i18n**: new keys in `messages/es.json` (tasks list, form, detail, feed card).
- **Feature flag**: `admin_options_tasks` (existing, PostHog).
- **Edge functions**: none new — reuse `upload-attachment-url` and `sign-attachment-urls`.
