## MODIFIED Requirements

### Requirement: SECURITY DEFINER helper functions are not publicly executable

`SECURITY DEFINER` functions that are not intended as public RPC endpoints SHALL have `EXECUTE` revoked from `anon` and `authenticated` where possible. This applies to `handle_new_user_registration()` and `update_updated_at_column()`. The RLS helper functions `is_admin(uuid)` and `is_staff(uuid)` SHALL use `SECURITY INVOKER`, because they only read `public.profiles` and authenticated callers can read that table under its RLS policy. They SHALL remain executable by `authenticated` (and `service_role`) so RLS policy and attendance RPC evaluation works, and SHALL remain non-executable by `anon` and `PUBLIC`.

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
