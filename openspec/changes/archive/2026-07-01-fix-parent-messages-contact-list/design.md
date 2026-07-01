## Context

`get_profiles_by_guardian()` is the SECURITY DEFINER-style RPC (`plpgsql`, `search_path ''`) that `src/queries/messages/get-parent-user-contacts.ts` calls to populate the parent's Messages contacts list. Its live definition still joins through `groups.teacher_id`, a column the `group_teachers` join-table migration (`20260623200309_add_group_teachers_join_table.sql`) dropped. The call now fails with `42703 column "teacher_id" does not exist`; the client hook (`useUserContactsQuery` in `src/hooks/UseGetUserContactsQuery.ts`) has no error handling for this path, so `raw` resolves to `null`/`undefined` and the list silently renders empty or stale cached data — not "all admins and teachers" via this function itself. The "sees everyone" symptom the user is reporting is a starting bug report; the RPC's actual current behavior (throwing) means whatever they saw was likely a client fallback or an artifact of a previous working build. Either way, the RPC must be fixed to reflect the current schema, and the fix must be captured in a migration since this function currently only exists live in the Supabase project with no matching migration file — a gap the fix also closes.

## Goals / Non-Goals

**Goals:**
- Restore `get_profiles_by_guardian()` to return exactly: (a) all `admin` profiles, and (b) `teacher` profiles who teach at least one group that at least one of the calling parent's children belongs to.
- Version-control the function via a new migration.
- Exclude other `parent` profiles from the result (contacts list is for reaching staff).
- Keep the function's shape (`RETURNS SETOF profiles`, no args) so the client call site and generated types need no changes beyond regeneration.

**Non-Goals:**
- Changing `profiles` table RLS. It stays wide-open (`SELECT` `qual = true` for `authenticated`); tightening it affects the admin/teacher contacts path (`get-user-contacts.ts`, a plain `profiles` select) and is a separate change.
- Changing the non-parent contacts path (`getUserContacts`) — admins and teachers keep their existing full-directory browsing.
- Any UI/component changes — `MessagesContactsList.tsx` and the query/hook layer already call the RPC correctly.
- Handling parents with zero children/groups specially — the join naturally returns just the unconditional admin rows in that case, which is correct.

## Decisions

**1. Fix at the function level, not by changing what the client queries.**
The client-side query/hook pattern (`getParentUserContacts` → `useUserContactsQuery`) is already correct per `CLAUDE.md`'s query/hook/component pattern; the bug is entirely inside the SQL function body. Rewriting the function is the minimal, correctly-scoped fix.
- *Alternative considered*: move the scoping logic into the client (fetch `child_guardians` → `child_groups` → `group_teachers` as three round trips and union with an admin fetch). Rejected — more round trips, more client complexity, and duplicates logic Postgres can do in one query; also loses the benefit of a single RPC being usable from any surface (including a future server action).

**2. Admins are unconditionally included, not group-scoped.**
Per product decision, admins are org-wide staff — there's no `admin`-to-`group` join table in the schema, and adding one is out of scope for this bug fix. The rewritten function unions two `select` branches: `role = 'admin'` (unconditional) and `role = 'teacher'` (group-joined).
- *Alternative considered*: scope admins by group too, requiring a new `group_admins` table. Rejected per explicit product answer — bigger schema change, not needed to fix the reported bug.

**3. Rewrite as a single query using `group_teachers`, mirroring the `child_guardians` → `child_groups` join chain already used elsewhere.**
```sql
create or replace function public.get_profiles_by_guardian()
returns setof profiles
language plpgsql
set search_path to ''
as $function$
begin
  return query
  select p.*
  from public.profiles p
  where p.role = 'admin'
  union
  select p.*
  from public.profiles p
  where p.role = 'teacher'
    and p.id in (
      select gt.teacher_id
      from public.group_teachers gt
      where gt.group_id in (
        select cg.group_id
        from public.child_groups cg
        where cg.child_id in (
          select cgd.child_id
          from public.child_guardians cgd
          where cgd.guardian_id = (select auth.uid())
        )
      )
    );
end;
$function$;
```
This mirrors the join chain used by the existing `child_guardians`/`child_groups` RLS policies (`20260613000000_add_select_policies_child_guardians_child_groups.sql`, `20260630193821_scope_child_guardians_select_rls.sql`), keeping the pattern consistent across the codebase.
- *Alternative considered*: a single `select ... where role = 'admin' or (role = 'teacher' and id in (...))`. Functionally equivalent to the `union` form but the `union` keeps each branch independently readable; either is acceptable — `union` chosen for clarity since the two branches have unrelated filter logic.

## Risks / Trade-offs

- [Risk] Migration only fixes the live-diverged function; if the Supabase project has other undocumented functions in the same state, they won't be caught by this change. → Mitigation: out of scope here, but worth a follow-up audit (not tracked in this change's tasks).
- [Risk] A parent with no children (edge case, e.g. mid-onboarding) still sees all admins by design. → Mitigation: expected/desired behavior — a parent should always be able to reach an admin for support even before a child is linked.
- [Risk] `union` deduplicates by full row equality; if a profile could ever match both branches (e.g. a user with `role = 'admin'` who also happens to be a group's `teacher_id` entry), the two branches naturally coexist without duplicate rows since `role` values are mutually exclusive per profile. No mitigation needed.

## Migration Plan

1. Add migration `supabase/migrations/<timestamp>_fix_get_profiles_by_guardian_group_teachers.sql` that `create or replace function public.get_profiles_by_guardian()` with the query above.
2. Apply via `supabase db reset` locally to verify, then through the normal deploy pipeline (this repo's CI/CD applies migrations on merge — no manual production step documented beyond that).
3. Regenerate `src/types/database.types.ts` via `supabase gen types typescript --local > src/types/database.types.ts` (function signature/return shape is unchanged, but regeneration keeps generated types current per repo convention).
4. Rollback: a follow-up migration re-creating the function with the previous (broken) body would restore prior state, but since prior state was broken (throwing an error), rollback is only needed if the new query itself has a defect — in that case, ship a corrective migration rather than reverting to the known-broken version.

## Open Questions

None outstanding — admin-scoping behavior was confirmed with the user (all admins visible to all parents, no group-scoping for admins).
