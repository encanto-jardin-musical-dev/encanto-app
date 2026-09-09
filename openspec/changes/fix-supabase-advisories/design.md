## Context

The Supabase advisors report pre-existing, project-wide findings on the production database:

- **Performance:** `auth_rls_initplan` (37), `multiple_permissive_policies` (4), `unindexed_foreign_keys` (6).
- **Security:** `anon_security_definer_function_executable` (4), `authenticated_security_definer_function_executable` (4), plus three config-only findings (`auth_otp_long_expiry`, `auth_leaked_password_protection`, `vulnerable_postgres_version`).

Ground truth was captured directly from the live database (`pg_policies`, `pg_proc`, `pg_index`, `information_schema.routine_privileges`) and by re-running both advisor sets. This design documents the SQL-applicable fixes and the operator-only actions.

Current state confirmed:
- Most `public` table policies call bare `auth.uid()` / `is_staff(auth.uid())` / `is_admin(auth.uid())`. A few (`messages` SELECT/UPDATE, `profiles` "Users can update their own FCM token") already use `(select auth.uid())` but still trip the multiple-permissive-policy linter.
- Duplicate permissive policies exist on `child_groups` SELECT, `child_guardians` SELECT, `messages` SELECT, `profiles` UPDATE.
- Six FK columns have no covering index leading with the FK column: `attendance.recorded_by`, `daily_reports.group_id`, `daily_reports.teacher_id`, `messages.group_id`, `messages.receiver_id`, `tasks.teacher_id`. (Existing `idx_messages_sender_receiver (sender_id, receiver_id)` and `idx_tasks_group_due (group_id, due_date)` do not satisfy the linter for `receiver_id` / `group_id` respectively — the linter still flags `messages_receiver_id_fkey` and does NOT flag `tasks_group_id_fkey`; the six flagged FKs are exactly the columns listed.)
- All four `SECURITY DEFINER` functions grant `EXECUTE` to `anon` and `authenticated`; `handle_new_user_registration` and `update_updated_at_column` additionally grant to `PUBLIC`. `is_admin`/`is_staff` are `STABLE SECURITY DEFINER` SQL helpers used only inside RLS. The two trigger functions return `trigger` and are only invoked by triggers.

## Goals / Non-Goals

**Goals:**
- Eliminate `auth_rls_initplan`, `multiple_permissive_policies`, and `unindexed_foreign_keys` findings via idempotent, behavior-preserving migrations.
- Revoke `EXECUTE` on the four non-public `SECURITY DEFINER` functions from `anon`/`authenticated` (and `PUBLIC` where granted) to clear both definer-function security advisories, while keeping RLS and triggers working.
- Document the three operator-only actions (OTP expiry, leaked-password protection, Postgres upgrade).

**Non-Goals:**
- No product/feature or application-code changes (client or edge functions).
- No schema changes beyond adding indexes.
- No auto-applying dashboard settings or the Postgres upgrade.
- Not switching functions to `SECURITY INVOKER` (would break RLS helper semantics); we revoke EXECUTE instead.

## Decisions

**1. Rewrite `auth.<fn>()` to `(select auth.<fn>())` inside policies.**
Replace `auth.uid()` → `(select auth.uid())`, `is_staff(auth.uid())` → `is_staff((select auth.uid()))`, and `is_admin(auth.uid())` → `is_admin((select auth.uid()))` in every flagged policy's `USING`/`WITH CHECK`. This makes the auth call a one-time InitPlan scalar rather than a per-row call. Access semantics are identical because the scalar value is unchanged. Alternative considered: caching via a wrapper function — rejected as unnecessary and higher-risk than the documented Supabase pattern.

**2. Recreate policies via `DROP POLICY IF EXISTS` + `CREATE POLICY`.**
Postgres has no in-place predicate edit, and `CREATE OR REPLACE POLICY` does not exist. Each migration drops the named policy if present and recreates it with the corrected predicate and identical role/command, making the migration idempotent and re-runnable.

**3. Consolidate multiple permissive policies with OR-combined predicates.**
- `child_groups` SELECT: merge `authenticated_select_child_groups` (`is_admin(...) OR EXISTS guardian`) and `staff_select_child_groups` (`is_staff(...)`) into one policy `(is_staff((select auth.uid())) OR is_admin((select auth.uid())) OR EXISTS guardian)`. Since `is_staff` already includes admin, this preserves the exact union.
- `child_guardians` SELECT: merge `Enable read access for authenticated users and teachers` (`guardian = uid OR profiles.role = 'teacher'`) and `authenticated_select_child_guardians` (`guardian = uid OR is_admin(uid)`) into one policy `((select auth.uid()) = guardian_id OR is_staff((select auth.uid())))`. `is_staff` = teacher OR admin, which is exactly the union of "teacher" and "admin"; the shared `guardian = uid` term is preserved. This keeps the union identical while using the maintained helper.
- `messages` SELECT: merge `Allow users to select their messages` (`uid = sender OR uid = receiver`) and `Enable users to view their own data only` (`uid = receiver`) into one policy `((select auth.uid()) = sender_id OR (select auth.uid()) = receiver_id)` — the second is a subset of the first, so the union is the first.
- `profiles` UPDATE: merge `Users can update their own FCM token` (`uid = id`) and `admin_update_profiles_staff_or_parent` (`is_admin(uid) AND role IN (teacher,parent)`) into one policy with `USING`/`WITH CHECK` = `((select auth.uid()) = id OR (is_admin((select auth.uid())) AND role IN ('teacher','parent')))`. Both original `WITH CHECK` clauses are OR-combined identically.

**4. Add six single-column btree FK covering indexes.**
`CREATE INDEX IF NOT EXISTS` on exactly the six flagged columns. Chosen names: `idx_attendance_recorded_by`, `idx_daily_reports_group_id`, `idx_daily_reports_teacher_id`, `idx_messages_group_id`, `idx_messages_receiver_id`, `idx_tasks_teacher_id`. Plain (non-concurrent) index creation is acceptable in a migration; tables are small. `IF NOT EXISTS` makes it idempotent.

**5. Revoke EXECUTE on non-public SECURITY DEFINER functions.**
`REVOKE EXECUTE ON FUNCTION ... FROM anon, authenticated;` for all four, plus `FROM PUBLIC` for `handle_new_user_registration()` and `update_updated_at_column()` (which currently carry a PUBLIC grant). RLS policies invoke `is_admin`/`is_staff` in the policy's evaluation context (definer), and triggers invoke the trigger functions as table owner — neither path depends on the caller's EXECUTE privilege, so authorization and triggers continue to work. Direct `/rest/v1/rpc/...` calls by anon/authenticated will be rejected. Alternative considered: `SECURITY INVOKER` — rejected because `is_admin`/`is_staff` must read `profiles` regardless of caller RLS.

**6. Config-only items documented, not migrated.**
OTP expiry < 1h, leaked-password protection, and the Postgres upgrade are dashboard/platform actions with no SQL equivalent. Documented in tasks as manual operator steps.

## Risks / Trade-offs

- **[RLS rewrite changes production authorization]** → Each rewrite is a mechanical `auth.x()` → `(select auth.x())` substitution that preserves the scalar value; verified by re-running `auth_rls_initplan` (expect 0) and spot-checking representative policies against the captured baseline.
- **[Policy consolidation could broaden/narrow access]** → Highest-care item. Each merge is an exact OR of the original predicates (or recognizes a subset/`is_staff`-equivalence). Verified by re-running `multiple_permissive_policies` (expect 0 on the four tables) and comparing merged predicates to the recorded originals.
- **[Revoking EXECUTE breaks RLS/trigger]** → Does not: SECURITY DEFINER and trigger execution do not require caller EXECUTE. Verified by re-running both definer-function advisors (expect 0) and confirming reads/writes still authorize.
- **[Index creation locks]** → Tables are small; plain `CREATE INDEX IF NOT EXISTS` is fast. If a table were large, switch to `CREATE INDEX CONCURRENTLY` outside a transaction.
- **[Migration re-run]** → All statements are idempotent (`DROP ... IF EXISTS` + `CREATE`, `CREATE INDEX IF NOT EXISTS`, `REVOKE` is naturally idempotent).

## Migration Plan

Deliver as focused, idempotent migrations (grouped by concern), applied via `apply_migration`:
1. FK covering indexes (lowest risk).
2. RLS `(select auth.…)` rewrites for policies that are NOT being consolidated.
3. Policy consolidations for `child_groups`, `child_guardians`, `messages`, `profiles` (these also apply the `(select …)` rewrite).
4. `REVOKE EXECUTE` on the four functions.

After each apply, re-run the relevant advisor. Rollback: policies can be restored from the recorded baseline predicates; indexes dropped with `DROP INDEX`; grants restored with `GRANT EXECUTE`. Config actions performed last by an operator.

## Open Questions

- None blocking. The Postgres upgrade window (brief downtime) is an operator scheduling decision, not a code concern.
