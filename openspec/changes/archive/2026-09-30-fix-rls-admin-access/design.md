## Context

The `database-hardening` change (archived) revoked `EXECUTE` on the `SECURITY DEFINER` helpers `is_admin(uuid)` and `is_staff(uuid)` from `PUBLIC`, granting only to `service_role` (baseline migration, lines 1019–1025). The intent was to satisfy the Supabase security advisors `anon_security_definer_function_executable` / `authenticated_security_definer_function_executable`.

This broke policy/RPC evaluation: RLS policies and the attendance RPCs (`clock_in_children`, `clock_out_children`) run as the querying `authenticated` user. Postgres requires the caller to hold `EXECUTE` on any function invoked from a policy or RPC body — `SECURITY DEFINER` only changes the privilege context inside the function body. Calls can fail with `permission denied for function` and return PostgREST 403 errors. The live policies also grant broader read access than the attendance feature requires: `children` and `groups` have unconditional SELECT policies, and attendance policies authorize all staff without checking teacher-to-group assignment. The UI group filter is not an authorization boundary.

- Admin cannot list all students (`getChildrenPage` embeds `child_guardians`, whose SELECT policy calls `is_staff`).
- Attendance registration 403s (`clock_in_children`/`clock_out_children` call `is_staff`; `attendance` SELECT/INSERT/UPDATE policies call `is_staff`).

## Goals / Non-Goals

**Goals:**
- Restore RLS policy and RPC evaluation for `authenticated` users (fix all 403s).
- Keep the hardening intent: `anon` must not be able to execute the helpers; direct RPC probing of `is_admin`/`is_staff` by `anon` stays rejected.
- Eliminate authenticated SECURITY DEFINER advisor findings for the RLS helpers without removing the `EXECUTE` privileges needed by policies.
- Enforce school-wide group, child, and attendance access for admins, and assigned-group-only access for teachers at the database layer.
- Keep guardian access to their own children and related groups where the existing product requires it; deny anonymous child reads and parent attendance access.
- Prevent unauthenticated and non-admin users from rendering routes under `/admin`, while preserving admins' access.
- Correct the `database-hardening` spec, which codified an incorrect Postgres assumption.

**Non-Goals:**
- No attendance UI redesign; the current client-side group filter remains a convenience, not a security control.
- No change to attendance row modeling or historical attendance behavior.

## Decisions

### Decision 1: Grant `EXECUTE` to `authenticated` (not `PUBLIC`)

```sql
GRANT EXECUTE ON FUNCTION public.is_admin(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_staff(uuid) TO authenticated;
```

**Why not `GRANT TO PUBLIC`**: that would re-expose the helpers to `anon`, re-triggering the `anon_security_definer_function_executable` advisor finding and letting anonymous callers probe role membership. Granting only to `authenticated` keeps the advisors clean for `anon` while restoring policy evaluation.

**Why not inline the role checks into each policy** (avoiding helpers entirely): it would duplicate the `profiles.role` lookup across ~30 policies, reintroduce the `auth_rls_initplan` linter risk the helpers were introduced to solve, and increase drift risk. The helpers exist precisely to centralize this.

### Decision 2: Make the RLS helpers invoker-rights

`is_admin(uuid)` and `is_staff(uuid)` only read `public.profiles`. The remote database grants `SELECT` on `profiles` to `authenticated` and has an authenticated SELECT policy with `USING (true)`, so the helpers can read the role row as the caller. Alter both functions to `SECURITY INVOKER` and retain `EXECUTE` for `authenticated` and `service_role`, while keeping `anon` and `PUBLIC` revoked.

This preserves their use inside RLS policies but removes the privilege escalation: helper execution now obeys the caller's table privileges and RLS. It also removes the `authenticated_security_definer_function_executable` finding without hiding legitimate caller access behind a service-role bypass.

### Decision 3: Keep attendance RPCs invoker-rights

`clock_in_children`/`clock_out_children` SHALL continue to run as the caller so their attendance writes are subject to the same RLS assignment checks as direct table writes. The helper grants from Decision 1 allow their `is_staff` guard and policy evaluation to run for authenticated callers.

**Alternative rejected**: making either RPC `SECURITY DEFINER` would bypass ordinary RLS enforcement when the function owner has `BYPASSRLS`. That would require duplicating and maintaining the group-assignment checks inside the RPC body.

### Decision 4: Enforce teacher assignment through the group relationship

Policies on `groups` SHALL allow admins to read every group and teachers to read only groups with a `group_teachers` row for `auth.uid()`. Policies on `child_groups` and `children` SHALL allow admins to read all rows and teachers to read children linked through `child_groups` to at least one of their assigned groups. Required guardian reads SHALL remain limited to each guardian's own linked children and related group data. Anonymous users SHALL NOT read child records.

Attendance rows are keyed by `child_id`, not `group_id`. A teacher may read, insert, or update a child's attendance only when that child has a `child_groups` association to at least one group assigned to that teacher. Admins may read and write attendance across all groups. The predicate SHALL be enforced by SELECT/INSERT/UPDATE RLS policies, including `WITH CHECK` for writes; no DELETE access is added. Because the RPCs remain invoker-rights, their writes are subject to these same policies.

### Decision 5: Amend the specs, not the advisors' scope

The `database-hardening` spec asserted that helpers run in the policy's definer context — incorrect. It is amended so `is_admin`/`is_staff` are invoker-rights but remain executable by `authenticated` for policy evaluation, while truly internal helpers (`handle_new_user_registration`, `update_updated_at_column`) remain revoked from `anon` and `authenticated`. The authenticated SECURITY DEFINER advisor should no longer report these RLS helpers.

The `attendance-logging` delta spec SHALL replace the prior "teacher writes any child" requirement with the assigned-group rule, and SHALL state that RLS enforces the group-picker and attendance boundaries independently of client filters.

### Decision 6: Enforce admin route access in the server layout

The shared `/admin` layout SHALL verify the authenticated Supabase user and their `profiles.role` on the server before rendering any child route. Unauthenticated users are redirected to `/login`; authenticated users whose role is absent, unreadable, or not `admin` are redirected to `/feed`. The role lookup uses the caller's authenticated Supabase client and fails closed on query errors. RLS remains the independent data-access boundary.

## Risks / Trade-offs

- [Invoker helper cannot read the user's profile] → The linked database grants `SELECT` on `profiles` to `authenticated` and its SELECT RLS policy allows authenticated reads; confirm this remains true when policies change.
- [Authenticated callers can invoke the helpers directly] → Invoker execution cannot bypass table grants or RLS, and the helper reveals only the role-existence result already readable from `profiles` under the current policy. Anonymous execution remains revoked.
- [Teacher access checks depend on group/child joins] → Use the existing `group_teachers` and `child_groups` relationships and their indexes; preserve the authenticated guardian path separately to avoid widening guardian access.
- [Attendance rows have no `group_id`] → Authorize a row through its child's membership in at least one group assigned to the teacher; admins retain access to teacherless groups and all children.
- [Migration not applied to remote] → The fix is a migration; it must be pushed (`supabase db push`) or applied via the dashboard SQL editor. Tasks include a verification step against the live database.
- [Regression risk for guardian and staff flows] → Verify admin, assigned teacher, unassigned teacher, guardian, and anonymous access directly through the database/API and run the e2e permission suite.

## Migration Plan

1. Add `supabase/migrations/<timestamp>_fix_rls_admin_access.sql` with helper grants and replacement RLS policies for groups, child-group links, children, and attendance.
2. Add a follow-up migration altering `is_admin` and `is_staff` to `SECURITY INVOKER`; retain authenticated execution, keep anon execution revoked, and keep attendance RPCs invoker-rights.
3. Apply both migrations to the remote project and record their versions.
4. Verify admin and assigned-teacher access, guardian scope, anonymous denial, and confirm the advisor no longer reports SECURITY DEFINER findings for the RLS helpers.
5. Add a server-side role guard to the shared `/admin` layout and verify authenticated admin, non-admin, and anonymous route behavior.
6. Rollback with reverse migrations restoring the prior helper mode, grants, and policies if required; remove the route guard only if the product requirement is reverted.

## Open Questions

(none)
