## 1. Foreign key covering indexes

- [x] 1.1 Add btree indexes `idx_attendance_recorded_by`, `idx_daily_reports_group_id`, `idx_daily_reports_teacher_id`, `idx_messages_group_id`, `idx_messages_receiver_id`, `idx_tasks_teacher_id` via one idempotent migration (`CREATE INDEX IF NOT EXISTS`)
- [x] 1.2 Re-run the `unindexed_foreign_keys` advisor and confirm 0 findings for the six columns

## 2. RLS auth re-evaluation rewrite (non-consolidated policies)

- [x] 2.1 Rewrite `attendance` policies (`staff_insert_attendance`, `staff_select_attendance`, `staff_update_attendance`) to use `is_staff((select auth.uid()))`
- [x] 2.2 Rewrite `children` policies (`admin_insert_children`, `admin_update_children`, `admin_delete_children`) to use `is_admin((select auth.uid()))`
- [x] 2.3 Rewrite `groups` policies (`admin_insert_groups`, `admin_update_groups`, `admin_delete_groups`) to use `is_admin((select auth.uid()))`
- [x] 2.4 Rewrite `group_teachers` policies (`admin_insert_group_teachers`, `admin_update_group_teachers`, `admin_delete_group_teachers`) to use `is_admin((select auth.uid()))`
- [x] 2.5 Rewrite `child_groups` write policies (`admin_insert_child_groups`, `admin_update_child_groups`, `admin_delete_child_groups`) to use `is_admin((select auth.uid()))`
- [x] 2.6 Rewrite `child_guardians` write policies (`admin_insert_child_guardians`, `admin_update_child_guardians`, `admin_delete_child_guardians`) to use `is_admin((select auth.uid()))`
- [x] 2.7 Rewrite `daily_reports` policies (`staff_or_guardian_select_daily_reports`, `staff_insert_daily_reports`, `staff_update_daily_reports`, `staff_delete_daily_reports`) replacing all `auth.uid()`/`is_staff`/`is_admin` calls with the `(select auth.uid())` form
- [x] 2.8 Rewrite `tasks` policies (`staff_or_guardian_select_tasks`, `staff_insert_tasks`, `staff_update_tasks`, `staff_delete_tasks`) replacing all `auth.uid()`/`is_staff`/`is_admin` calls with the `(select auth.uid())` form
- [x] 2.9 Rewrite `device_push_tokens` policies (select/insert/update/delete own tokens) to use `(select auth.uid())`
- [x] 2.10 Rewrite `profiles` admin policies (`admin_insert_profiles_staff_or_parent`, `admin_delete_profiles_staff_or_parent`) to use `is_admin((select auth.uid()))` (UPDATE handled in consolidation task 3.4)

## 3. Consolidate multiple permissive policies

- [x] 3.1 `child_groups` SELECT: drop `authenticated_select_child_groups` + `staff_select_child_groups`, create single policy `(is_staff((select auth.uid())) OR is_admin((select auth.uid())) OR EXISTS guardian)` preserving the union
- [x] 3.2 `child_guardians` SELECT: drop `Enable read access for authenticated users and teachers` + `authenticated_select_child_guardians`, create single policy `((select auth.uid()) = guardian_id OR is_staff((select auth.uid())))` preserving the union
- [x] 3.3 `messages` SELECT: drop `Allow users to select their messages` + `Enable users to view their own data only`, create single policy `((select auth.uid()) = sender_id OR (select auth.uid()) = receiver_id)`
- [x] 3.4 `profiles` UPDATE: drop `Users can update their own FCM token` + `admin_update_profiles_staff_or_parent`, create single policy with USING/WITH CHECK `((select auth.uid()) = id OR (is_admin((select auth.uid())) AND role IN ('teacher','parent')))`
- [x] 3.5 Re-run `auth_rls_initplan` and `multiple_permissive_policies` advisors and confirm 0 findings on all in-scope tables

## 4. Revoke EXECUTE on non-public SECURITY DEFINER functions

- [x] 4.1 `REVOKE EXECUTE` on `handle_new_user_registration()` and `update_updated_at_column()` from `PUBLIC`, `anon`, `authenticated`
- [x] 4.2 `REVOKE EXECUTE` on `is_admin(uuid)` and `is_staff(uuid)` from `anon`, `authenticated`
- [x] 4.3 Re-run `anon_security_definer_function_executable` and `authenticated_security_definer_function_executable` advisors and confirm 0 findings for the four functions
- [x] 4.4 Verify RLS still authorizes (an `is_staff`-gated read/write still works) after the revocations

## 5. Operator-only configuration (documented, not migrated)

- [x] 5.1 Document that an operator must set email OTP expiry < 1 hour in the Supabase dashboard (`auth_otp_long_expiry`)
- [x] 5.2 Document that an operator must enable leaked-password (HaveIBeenPwned) protection (`auth_leaked_password_protection`)
- [x] 5.3 Document that an operator must upgrade Postgres to apply security patches (`vulnerable_postgres_version`), noting brief downtime
