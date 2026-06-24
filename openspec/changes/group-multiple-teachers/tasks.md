## 1. Database migration

- [x] 1.1 Create migration `supabase migration new add_group_teachers_join_table`
- [x] 1.2 Create `group_teachers` table: `id uuid pk default gen_random_uuid()`, `group_id uuid not null references groups(id) on delete cascade`, `teacher_id uuid not null references profiles(id) on delete cascade`, `created_at timestamptz default now()`, unique `(group_id, teacher_id)`, indexes on `group_id` and `teacher_id`
- [x] 1.3 Enable RLS and add policies: admin INSERT/UPDATE/DELETE via `is_admin(auth.uid())`, authenticated SELECT (mirror `child_groups` policies)
- [x] 1.4 Backfill: `insert into group_teachers (group_id, teacher_id) select id, teacher_id from groups where teacher_id is not null`
- [x] 1.5 Drop the column: `alter table groups drop column teacher_id`

## 2. Types

- [x] 2.1 Regenerate `src/types/database.types.ts` (`supabase gen types typescript --local`); confirm `group_teachers` present and `groups.teacher_id` removed

## 3. Teacher-side group resolution

- [x] 3.1 Update `src/queries/users/get-user-groups.ts` to resolve groups via `group_teachers` filtered by `teacher_id`, returning flat group rows
- [x] 3.2 Verify `UseGetUserGroupsQuery` return shape is unchanged and `UserHydrator` (lines ~96–106) still maps correctly; adjust mapping only if necessary

## 4. Admin groups flow (multi-teacher)

- [x] 4.1 `GroupForm`: replace single teacher `Select` with a multi-select returning `teacherIds: string[]`; pre-fill from existing links in edit mode
- [x] 4.2 `create-group`: after inserting the group, bulk-insert `group_teachers` links for selected teachers
- [x] 4.3 `update-group`: diff existing vs. selected teacher links and insert/delete the difference (mirror `child_groups` reconciliation in `update-child.ts`)
- [x] 4.4 `get-group-by-id`: select assigned teachers via `group_teachers(profiles(...))`
- [x] 4.5 `GroupDetail`: render the list of assigned teachers; show a no-teachers fallback

## 5. i18n

- [x] 5.1 Update `AdminGroups` keys for plural teachers (form label/placeholder, detail `teachersTitle`, `noTeachers`)

## 6. Verification

- [x] 6.1 Run `pnpm lint`
- [ ] 6.2 Manually verify: create group with 2 teachers → detail shows both → edit to add/remove → detail updates
- [ ] 6.3 Verify a teacher assigned via `group_teachers` still sees the group in the feed (UserHydrator path)
- [ ] 6.4 Confirm RLS: non-admin cannot write `group_teachers`
