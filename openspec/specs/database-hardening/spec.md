# Spec: Database Hardening

## Purpose

Ensure the Supabase Postgres database follows performance and security best practices: RLS policies evaluate auth calls efficiently, there is at most one permissive policy per role/action, foreign keys are indexed, SECURITY DEFINER helper functions are not publicly executable, and auth/database configuration follows Supabase's production recommendations.

## Requirements

### Requirement: RLS policies evaluate auth calls once per query

Row Level Security policies SHALL invoke `auth.<function>()` / `current_setting()` (directly or via helper functions like `is_staff`/`is_admin`) through a scalar subquery form (e.g. `(select auth.uid())`) so the value is evaluated once per query rather than once per row. The access semantics of each policy SHALL remain unchanged by this rewrite.

#### Scenario: Policies pass the auth_rls_initplan linter
- **WHEN** the Supabase performance advisor `auth_rls_initplan` is run after the change
- **THEN** it reports zero findings for `public` tables and the `message-attachments` storage policies

#### Scenario: Access semantics are preserved
- **WHEN** a policy that previously used `auth.uid()` is rewritten to `(select auth.uid())`
- **THEN** the same rows are visible/mutable to the same roles as before the rewrite

### Requirement: Single permissive policy per role and action

For each table, role, and action (SELECT/INSERT/UPDATE/DELETE), there SHALL be at most one permissive RLS policy, with any previously overlapping predicates combined via OR into a single policy that preserves the original combined access.

#### Scenario: No multiple-permissive-policy findings
- **WHEN** the Supabase advisor `multiple_permissive_policies` is run after the change
- **THEN** it reports zero findings for `child_groups`, `child_guardians`, `messages`, and `profiles`

#### Scenario: Combined policy preserves access
- **WHEN** two permissive SELECT policies are merged into one for a role
- **THEN** a row is visible to that role if and only if it was visible under either original policy

### Requirement: Foreign keys have covering indexes

Every foreign key column on the in-scope tables SHALL have a covering btree index to support joins and cascade operations.

#### Scenario: No unindexed foreign key findings
- **WHEN** the Supabase advisor `unindexed_foreign_keys` is run after the change
- **THEN** it reports zero findings for `attendance.recorded_by`, `daily_reports.group_id`, `daily_reports.teacher_id`, `messages.group_id`, `messages.receiver_id`, and `tasks.teacher_id`

### Requirement: SECURITY DEFINER helper functions are not publicly executable

`SECURITY DEFINER` functions that are not intended as public RPC endpoints SHALL have `EXECUTE` revoked from `anon` and `authenticated` where possible. This applies to `handle_new_user_registration()` and `update_updated_at_column()`. The RLS helper functions `is_admin(uuid)` and `is_staff(uuid)` SHALL use `SECURITY INVOKER`, because they only read `public.profiles` and authenticated callers can read that table under its RLS policy. They SHALL remain executable by `authenticated` (and `service_role`) so RLS policy and attendance RPC evaluation works, and SHALL remain non-executable by `anon` and `PUBLIC`. Internal `SECURITY DEFINER` helpers SHALL remain revoked from `anon` and `authenticated`.

#### Scenario: No executable-definer-function findings for anon
- **WHEN** the Supabase security advisor `anon_security_definer_function_executable` is run after the change
- **THEN** it reports zero findings for `handle_new_user_registration`, `update_updated_at_column`, `is_admin`, and `is_staff`

#### Scenario: Authenticated helpers remain executable for policy evaluation
- **WHEN** an `authenticated` user triggers evaluation of a policy using `is_staff((select auth.uid()))` or `is_admin((select auth.uid()))`
- **THEN** the policy authorizes correctly (the caller holds `EXECUTE` on the helper)

#### Scenario: Direct RPC call by anon is rejected
- **WHEN** an `anon` caller invokes `/rest/v1/rpc/is_staff` (or `is_admin`, or the other listed functions) directly
- **THEN** the call is rejected due to missing EXECUTE privilege

#### Scenario: Direct RPC call by authenticated to internal helpers is rejected

- **WHEN** an `authenticated` caller invokes `/rest/v1/rpc/handle_new_user_registration` or `/rest/v1/rpc/update_updated_at_column` directly
- **THEN** the call is rejected due to missing EXECUTE privilege

#### Scenario: No authenticated advisor findings for RLS helpers

- **WHEN** the Supabase security advisor `authenticated_security_definer_function_executable` is run after the change
- **THEN** it reports no findings for `is_admin`, `is_staff`, `handle_new_user_registration`, or `update_updated_at_column`

#### Scenario: Invoker helpers preserve policy behavior

- **WHEN** authenticated RLS policies call `is_admin((select auth.uid()))` or `is_staff((select auth.uid()))`
- **THEN** the helpers return the caller's role result using the caller's profile visibility and existing admin/staff policy behavior is preserved

### Requirement: Auth and database configuration follow production recommendations

The project's auth and database configuration SHALL meet Supabase production security recommendations: email OTP expiry under one hour, leaked-password (HaveIBeenPwned) protection enabled, and the Postgres version kept current with available security patches. These are operator-applied dashboard/config actions, documented for manual execution rather than SQL migration.

#### Scenario: Configuration advisories cleared after operator action
- **WHEN** an operator sets OTP expiry < 1 hour, enables leaked-password protection, and upgrades Postgres
- **THEN** the `auth_otp_long_expiry`, `auth_leaked_password_protection`, and `vulnerable_postgres_version` advisories no longer report findings
