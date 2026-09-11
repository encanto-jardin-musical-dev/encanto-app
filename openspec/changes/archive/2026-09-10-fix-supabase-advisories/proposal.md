# Fix Supabase advisory warnings

## Why

The Supabase advisors report 47 performance findings and 11 security findings on the project database. These are pre-existing, project-wide issues (not introduced by the attachment-storage migration) that degrade query performance at scale and widen the security surface. Addressing them improves RLS query performance, tightens function/API exposure, and brings auth/DB config in line with Supabase production recommendations.

References: [performance linter](https://supabase.com/docs/guides/database/database-linter), [security linter](https://supabase.com/docs/guides/database/database-linter).

## What Changes

- **RLS auth re-evaluation (`auth_rls_initplan`, 37):** Rewrite RLS policies so per-row `auth.<fn>()` / `current_setting()` calls become one-time scalar subqueries — `auth.uid()` → `(select auth.uid())`, `is_staff(auth.uid())` → `is_staff((select auth.uid()))`, `is_admin(auth.uid())` likewise. Behavior-preserving; applies across `attendance`, `child_groups`, `child_guardians`, `children`, `daily_reports`, `device_push_tokens`, `group_teachers`, `groups`, `messages`, `profiles`, `tasks`, and the `message-attachments` storage policies.
- **Multiple permissive policies (`multiple_permissive_policies`, 4):** Consolidate overlapping same-role/same-action policies on `child_groups` (SELECT), `child_guardians` (SELECT), `messages` (SELECT), and `profiles` (UPDATE) into a single policy per role/action with OR-combined predicates, preserving exact access semantics.
- **Unindexed foreign keys (`unindexed_foreign_keys`, 6):** Add covering btree indexes for `attendance.recorded_by`, `daily_reports.group_id`, `daily_reports.teacher_id`, `messages.group_id`, `messages.receiver_id`, `tasks.teacher_id`.
- **Public/authenticated EXECUTE on SECURITY DEFINER functions (`*_security_definer_function_executable`, 8):** `REVOKE EXECUTE ... FROM anon, authenticated` on `handle_new_user_registration()`, `update_updated_at_column()` (trigger functions, never meant to be called via REST), and `is_admin(uuid)` / `is_staff(uuid)` (used only inside RLS/definer context, not as public RPC). Verify RLS policies still work after revocation.
- **Auth/DB configuration (`auth_otp_long_expiry`, `auth_leaked_password_protection`, `vulnerable_postgres_version`, 3):** Documented as manual dashboard actions (cannot be applied via SQL migration): set email OTP expiry < 1 hour, enable leaked-password (HaveIBeenPwned) protection, and upgrade Postgres to apply security patches.

## Capabilities

### New Capabilities
- `database-hardening`: Enforceable database security/performance invariants derived from the Supabase advisors — RLS policies evaluate auth calls once per query, at most one permissive policy per role/action, foreign keys have covering indexes, non-public `SECURITY DEFINER` helpers are not executable by `anon`/`authenticated`, and auth/DB config follows production recommendations.

### Modified Capabilities
<!-- No functional product capability changes. RLS rewrites, policy consolidation, FK indexes, and EXECUTE revocations preserve existing access semantics; captured as the new database-hardening capability plus migrations. -->

## Impact

- **Database:** RLS policy rewrites/consolidation across ~12 tables + storage policies; 6 new indexes; 4 `REVOKE EXECUTE` statements. Delivered as idempotent migrations.
- **Behavior:** No intended change to who can read/write what — all edits preserve access semantics; verified by re-running the advisors and spot-checking representative policies.
- **Risk:** RLS changes touch production authorization. Each migration is reviewed before apply; policy consolidation is the highest-care item (must not broaden or narrow access). FK indexes and the `(select auth.…)` rewrite are low risk.
- **Out of band (dashboard, not in migrations):** OTP expiry, leaked-password protection, and the Postgres version upgrade (brief downtime) must be applied by an operator in the Supabase dashboard.
- **Scope:** Independent of the attachment-storage migration; lives on its own branch/change.

## Non-Goals

- No product/feature changes; no schema changes beyond adding indexes.
- No change to application code (client or edge functions) except where an RLS predicate rename would require it (not expected).
- Not auto-applying dashboard-only settings or the Postgres upgrade.
