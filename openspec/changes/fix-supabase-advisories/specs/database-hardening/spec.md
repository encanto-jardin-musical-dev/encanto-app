## ADDED Requirements

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

`SECURITY DEFINER` functions that are not intended as public RPC endpoints SHALL have `EXECUTE` revoked from the `anon` and `authenticated` roles. This applies to `handle_new_user_registration()`, `update_updated_at_column()`, `is_admin(uuid)`, and `is_staff(uuid)`. Their use inside RLS policies and triggers SHALL continue to work.

#### Scenario: No executable-definer-function findings
- **WHEN** the Supabase security advisors `anon_security_definer_function_executable` and `authenticated_security_definer_function_executable` are run after the change
- **THEN** they report zero findings for `handle_new_user_registration`, `update_updated_at_column`, `is_admin`, and `is_staff`

#### Scenario: RLS helpers still function
- **WHEN** a policy using `is_staff((select auth.uid()))` is evaluated after EXECUTE is revoked from `anon`/`authenticated`
- **THEN** the policy continues to authorize correctly (the helper runs in the policy's definer context)

#### Scenario: Direct RPC call is rejected
- **WHEN** an `anon` or `authenticated` caller invokes `/rest/v1/rpc/is_staff` (or the other listed functions) directly
- **THEN** the call is rejected due to missing EXECUTE privilege

### Requirement: Auth and database configuration follow production recommendations

The project's auth and database configuration SHALL meet Supabase production security recommendations: email OTP expiry under one hour, leaked-password (HaveIBeenPwned) protection enabled, and the Postgres version kept current with available security patches. These are operator-applied dashboard/config actions, documented for manual execution rather than SQL migration.

#### Scenario: Configuration advisories cleared after operator action
- **WHEN** an operator sets OTP expiry < 1 hour, enables leaked-password protection, and upgrades Postgres
- **THEN** the `auth_otp_long_expiry`, `auth_leaked_password_protection`, and `vulnerable_postgres_version` advisories no longer report findings
