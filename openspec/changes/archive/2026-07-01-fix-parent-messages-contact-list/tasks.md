## 1. Database migration

- [x] 1.1 Create migration `supabase/migrations/<timestamp>_fix_get_profiles_by_guardian_group_teachers.sql` that `create or replace function public.get_profiles_by_guardian()` per design.md, unioning unconditional `admin` profiles with `teacher` profiles joined through `group_teachers` → `child_groups` → `child_guardians` scoped to `auth.uid()`.
- [x] 1.2 Run `supabase db reset` locally (or apply the migration to a local/dev instance) to confirm the function compiles and no longer references the dropped `groups.teacher_id` column.

## 2. Verification

- [x] 2.1 Manually verify via SQL (`select * from get_profiles_by_guardian()` as a parent test user) that the result includes all admins and only the teachers of the parent's children's groups.
- [x] 2.2 Verify a parent with no linked children still receives all admin profiles and zero teacher profiles.
- [x] 2.3 Verify a parent with children in two different groups receives the union of both groups' teachers with no duplicate rows.
- [x] 2.4 Verify no `parent`-role profiles appear in the result for any test parent.
- [x] 2.5 Smoke-test the Messages contacts list (`/messages`) as a parent user in the running app to confirm the fix is visible end-to-end. Verified via RPC as parent Jorge Ossa (2 children's groups): result set is exactly Encanto Admin, Encanto Jardín, Jose Saldarriaga (admins) + George Ossa, Laura Perdomo, Stefania Velasquez (teachers of his children's groups) — matches expected contact list for the UI to render. Live browser walkthrough not performed (requires magic-link login credentials not available to the agent); this RPC-level check confirms the exact data the component will fetch and display.

## 3. Type sync

- [x] 3.1 Regenerate `src/types/database.types.ts` via `supabase gen types typescript --local > src/types/database.types.ts` and confirm no unexpected diff beyond the function's internal definition (return shape is unchanged).
