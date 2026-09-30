## Why

Admin users cannot reliably list all students or register attendance because the `database-hardening` change revoked `EXECUTE` on the `SECURITY DEFINER` helpers `is_admin(uuid)` and `is_staff(uuid)` from `PUBLIC` (granting only to `service_role`), under the incorrect assumption that the helper runs in the policy's definer context. In Postgres, `SECURITY DEFINER` changes the privilege context inside the function body but does not grant the caller `EXECUTE`. Since RLS policies and the attendance RPCs (`clock_in_children`, `clock_out_children`) run as the querying `authenticated` user, calls to these helpers can fail with `permission denied for function` and return PostgREST 403 errors.

The live access policies also do not enforce the intended attendance scope: the current `children` and `groups` SELECT policies are unconditional, and staff attendance policies do not check a teacher's group assignment. The group picker filters teachers in the client, but that filter can be bypassed with direct API requests.

Admin management routes also render their screens to users without the admin role. RLS protects the underlying data, but the UI should not expose admin screens to unauthenticated users or non-admin roles.

## What Changes

- **New migration** granting `EXECUTE` on `public.is_admin(uuid)` and `public.is_staff(uuid)` to the `authenticated` role (restoring policy/RPC evaluation while keeping the helpers non-executable by `anon`).
- **Follow-up migration** changing `is_admin` and `is_staff` to `SECURITY INVOKER`. Authenticated callers retain the `EXECUTE` needed for RLS, while helper calls no longer bypass the caller's RLS or trigger the authenticated SECURITY DEFINER advisor warning.
- **RLS scope correction**: admins can read all groups, children, and attendance; teachers can read groups assigned to them and children/attendance associated with those groups. Attendance writes are limited to admins and teachers assigned to a group containing the child. These boundaries are enforced by RLS, not only by the attendance UI.
- **Admin route authorization**: guard the shared `/admin` route layout server-side, redirecting unauthenticated users to `/login` and authenticated non-admin users to `/feed`.
- Replace unconditional public reads of child and group data with authenticated, role-scoped policies. Preserve guardian access to their own children and related groups; parents remain unable to access attendance, and anonymous users cannot read child records.
- **Spec correction**: the `database-hardening` requirement is amended — `is_admin`/`is_staff` are invoker-rights helpers, executable by `authenticated` for policy evaluation and non-executable by `anon`; `handle_new_user_registration` and `update_updated_at_column` stay revoked from both `anon` and `authenticated`.
- Keep `clock_in_children`/`clock_out_children` as invoker-rights functions so the new attendance RLS restrictions are applied to their writes.
- No attendance UI redesign; the current client-side group filter remains a convenience, not a security control.

## Capabilities

### New Capabilities

(none)

### Modified Capabilities

- `database-hardening`: `is_admin(uuid)` and `is_staff(uuid)` SHALL be `SECURITY INVOKER`, executable by `authenticated` for RLS policy evaluation, and non-executable by `anon`/`PUBLIC`. Internal SECURITY DEFINER helpers remain non-executable by `anon`/`authenticated`; the scenario asserting "the helper runs in the policy's definer context" is corrected.
- `attendance-logging`: database access SHALL enforce the role-scoped group, child, and attendance rules described above, including when a caller bypasses the UI and queries Supabase directly.
- `admin-route-authorization`: routes under `/admin` SHALL render only for authenticated users whose profile role is `admin`.

## Impact

- **Database**: the RLS-policy migration plus a follow-up migration for helper execution mode and grants. Both are applied to the linked remote project.
- **Application**: the shared `/admin` layout performs a server-side role check before rendering admin pages.
- **Affected behavior after fix**: admins retain school-wide access; teachers are restricted to their assigned groups and associated children/attendance; guardian access to their own children is preserved; anonymous child reads and parent attendance access are denied.
- **Security posture**: `anon` cannot execute the helpers; authenticated helper calls run with caller privileges and obey profile RLS. The hardening intent is preserved without accepted SECURITY DEFINER findings for these helpers.
- **Verification**: direct API/RLS checks for admin, assigned teacher, unassigned teacher, guardian, and anonymous access; server-rendered admin route checks; e2e permission tests (`e2e/specs/permissions.spec.ts`) and attendance flows.
