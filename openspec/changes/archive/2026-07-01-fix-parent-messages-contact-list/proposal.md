## Why

Parents on the Messages contacts list currently see every teacher and admin in the system instead of only the staff connected to their own children's groups. The scoping RPC `get_profiles_by_guardian()` references `groups.teacher_id`, a column dropped by the `group_teachers` join-table migration, so the call fails and the query silently returns nothing useful client-side — while the underlying `profiles` table RLS policy (`SELECT` with `qual = true`) allows any authenticated user to read every profile regardless of the RPC. Parents should only be able to message teachers tied to their children's groups, plus all admins (admins are org-wide staff, not group-scoped).

## What Changes

- Rewrite the `get_profiles_by_guardian()` database function to join through `group_teachers` (the current teacher↔group table) instead of the dropped `groups.teacher_id` column, scoping returned teachers to the calling parent's children's groups.
- Include all `admin` role profiles unconditionally in the function's result set (admins are not group-scoped).
- Exclude other parents from the result set — the contacts list is for reaching staff, not other guardians.
- Add a migration file for `get_profiles_by_guardian()` so it is version-controlled (it currently only exists live in the Supabase project, with no matching migration).

Out of scope (flagged, not fixed here): the `profiles` table RLS `SELECT` policy is unconditionally `true` for any authenticated user, so any query bypassing this RPC (including the existing plain `profiles` select used by admin/teacher contact browsing) still returns every profile. Tightening that policy touches admin and teacher read paths well beyond the parent contacts bug and needs its own change with explicit sign-off on which roles retain broad `profiles` access.

## Capabilities

### New Capabilities
- `messages-contact-scoping`: Defines which profiles a parent is authorized to see and message — their children's group teachers plus all admins, excluding other parents and unrelated teachers.

### Modified Capabilities
(none — `messages-contacts-list` and `messages-role-filter` govern UI/display and remain unaffected; this change only affects which rows are returned to parents, not admins/teachers whose contact scope is unchanged)

## Impact

- **Database**: New migration rewriting `public.get_profiles_by_guardian()`.
- **Code**: No client-side code changes expected — `src/queries/messages/get-parent-user-contacts.ts` and `src/hooks/UseGetUserContactsQuery.ts` already call the RPC correctly; the fix is entirely in the database layer.
- **Types**: `src/types/database.types.ts` will need regeneration (`get_profiles_by_guardian` signature/columns) after the migration lands.
- **Risk**: Low — the function is only called from the parent contacts path; rewriting it to use the current `group_teachers` table restores intended scoping without touching other roles' queries.
