# Tasks — Add Group Tasks

## 1. Database (RLS migration)

- [x] 1.1 Verify nothing else depends on the open `tasks` SELECT policy (grep for `from("tasks")` / `from('tasks')`), then create migration `supabase migration new tasks_rls`
- [x] 1.2 In the migration: drop `"Enable read access for all users"`; add SELECT policy (`is_staff(auth.uid())` OR guardian of a child in the task's group via `child_guardians` ⋈ `child_groups`); add INSERT policy (`is_admin` OR teacher assigned via `group_teachers`, WITH CHECK `teacher_id = auth.uid()` for teachers); add UPDATE and DELETE policies (`is_admin` OR assigned teacher)
- [x] 1.3 Apply the migration to the remote project and verify policies with a `pg_policy` query (staff read/write, guardian read own group only, anonymous denied)

## 2. Data layer (queries + hooks)

- [x] 2.1 Create `src/queries/tasks/get-group-tasks.ts` (tasks by `group_id`, `created_at` DESC) and `src/queries/tasks/get-staff-tasks.ts` (optional `teacherId` param mirroring `getAttendanceGroups`; joins `groups(name)`)
- [x] 2.2 Create `src/queries/tasks/get-task-by-id.ts` (task + group name + author profile), `create-task.ts`, `update-task.ts`, `delete-task.ts` — all using `Database['public']['Tables']['tasks']` types and explicit error handling
- [x] 2.3 Create hooks `UseGroupTasksQuery`, `UseStaffTasksQuery`, `UseTaskByIdQuery` (query keys `['tasks', 'group', groupId]`, `['tasks', 'staff', userId]`, `['tasks', 'detail', taskId]`, `enabled` guards) and `UseCreateTaskMutation`, `UseUpdateTaskMutation`, `UseDeleteTaskMutation` (invalidate `['tasks']` on success)

## 3. Staff tasks screens

- [x] 3.1 Add all new i18n keys to `messages/es.json` under a `TasksPage` namespace (list, search placeholder, empty state, kebab actions, form labels/validation, detail labels, delete confirmation, feed card "Ver más")
- [x] 3.2 Rewrite `src/app/tasks/page.tsx` as thin server page (`NavigationBar` + `FeatureFlagRoleGate` flag `admin_options_tasks`, roles teacher/admin) rendering new `src/components/tasks/TaskList.tsx`
- [x] 3.3 Build `TaskList`: `UseStaffTasksQuery` (teacher passes own id, admin omits), client-side title search input, empty state, FAB linking to `/tasks/new`
- [x] 3.4 Build `TaskListItem` with kebab (HeroUI Dropdown): view → detail route, edit → edit mode, delete → confirmation modal + `UseDeleteTaskMutation`
- [x] 3.5 Build `src/components/tasks/TaskForm.tsx` (create/edit via props): required title, group `Select` scoped by role (reuse attendance-groups pattern), `DatePicker` due date, description textarea with counter, "Add files" using the existing `upload-attachment-url` presigned flow and `Attachment[]` shape
- [x] 3.6 Create `src/app/tasks/new/page.tsx` (staff-gated) rendering `TaskForm` in create mode; on success navigate back to `/tasks`
- [x] 3.7 Create `src/app/tasks/[groupId]/[taskId]/page.tsx` gated by flag with roles parent+teacher+admin, rendering `TaskDetail`: full content, attachments via `UseAttachmentUrlsQuery`, edit/delete actions for staff only, `notFound()` when the task isn't visible

## 4. Parent feed integration

- [x] 4.1 Add `feedFilterAtom` (`'all' | 'messages' | 'tasks'`) to `src/lib/store/feed.ts` and make `FeedFilters` stateful: chips drive the atom, "Tareas" enabled only when `admin_options_tasks` is true, "Reportes" stays disabled
- [x] 4.2 Build `src/components/feed/TaskFeedCard.tsx` per wireframe (title, description snippet, due date, relative time, "Ver más" → `/tasks/[groupId]/[taskId]`) using HeroUI + i18n keys
- [x] 4.3 Extend `FeedGroup`: run `UseGroupTasksQuery(contextGroupValue)` gated by the flag, store in `groupTasksAtom`, merge tasks + messages sorted by `created_at` DESC via a small pure `mergeFeedItems` helper, and apply `feedFilterAtom`
- [x] 4.4 Verify child-switch behavior: selecting a different child re-scopes task cards to that child's group (existing `contextGroupValue` wiring)

## 5. Verification

- [x] 5.1 `pnpm lint` and `pnpm build` pass
- [x] 5.2 Manual pass with flag on: teacher creates/edits/deletes a task for an assigned group (and cannot pick an unassigned group); admin sees all groups; parent feed shows the task only under the matching child, filter chip works, detail opens read-only
- [x] 5.3 Manual pass with flag off: `/tasks*` routes render not-found, feed shows no task cards, "Tareas" chip disabled
