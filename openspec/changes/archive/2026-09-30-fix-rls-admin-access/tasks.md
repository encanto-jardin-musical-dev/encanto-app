## 1. Migration

- [x] 1.1 Create migration `supabase/migrations/20260929195600_fix_rls_admin_access.sql` granting `EXECUTE` on `public.is_admin(uuid)` and `public.is_staff(uuid)` to `authenticated`, while leaving both unavailable to `anon`
- [x] 1.2 Replace unconditional SELECT policies on `groups` and `children` with role-scoped policies: admins can read all; teachers can read assigned groups and children in those groups; preserve guardian access to their own linked children and prevent anonymous child reads
- [x] 1.3 Restrict `child_groups` reads to admins, teachers assigned to the linked group, and guardians linked to the child
- [x] 1.4 Restrict attendance SELECT/INSERT/UPDATE to admins or teachers assigned to a group containing the attendance child; include the assignment predicate in write checks and do not add DELETE access
- [x] 1.5 Keep `clock_in_children` and `clock_out_children` invoker-rights so their writes remain subject to attendance RLS
- [x] 1.6 Create a follow-up migration changing `public.is_admin(uuid)` and `public.is_staff(uuid)` to `SECURITY INVOKER`, retaining `EXECUTE` for `authenticated`/`service_role` and keeping it revoked from `anon`/`PUBLIC`

## 2. Apply to Database

- [x] 2.1 Apply the migration to the linked project with `supabase db query --linked --file` because `supabase db push` is blocked by pre-existing history drift; record this migration version with `supabase migration repair`
- [x] 2.2 Verify as `anon` with a remote role simulation: direct `is_staff` execution is rejected and child/group/attendance reads are denied
- [x] 2.3 Apply the invoker-mode migration to the linked project with the approved CLI path and record its version
- [x] 2.4 Verify the authenticated SECURITY DEFINER advisor no longer reports either RLS helper, and repeat admin/teacher policy probes

## 3. Verification

- [x] 3.1 As admin: load `/admin/children` — full student list renders (query with `child_guardians` embed succeeds, no 403)
- [x] 3.2 As admin: open `/attendance`, verify every group is available (including teacherless groups), and clock children in/out successfully
- [x] 3.3 As teacher: verify only assigned groups and their children/attendance are visible and writable
- [x] 3.4 As teacher: use direct role-simulated queries against the remote database with an unassigned group ID and unrelated child ID; verify reads return no protected rows and writes are rejected
- [x] 3.5 Verify guardian access remains limited to linked children, parents cannot access attendance, and anonymous users cannot read children or attendance
- [x] 3.6 Run the e2e permission suite (`e2e/specs/permissions.spec.ts`) and confirm no regressions

## 4. Admin Route Authorization

- [x] 4.1 Add a server-side admin-role guard to the shared `/admin` layout: redirect unauthenticated users to `/login`, non-admin or unverified users to `/feed`, and allow admins.
- [x] 4.2 Cover unauthenticated and non-admin route denial plus admin route access in the e2e permission/admin specs.
