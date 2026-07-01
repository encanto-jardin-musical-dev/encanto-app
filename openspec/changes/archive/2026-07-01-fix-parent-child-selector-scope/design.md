## Context

The Feed child selector (`FeedUser.tsx`) is populated by `userSelectOptionsAtom`, which `UserHydrator.tsx` fills by calling `useUserChildrenQuery({ params: {} })` for parent users — note `params` has no `userID`. `getUserChildren` (`src/queries/users/get-user-children.ts`) only applies its `.eq('guardian_id', userID)` filter when `userID` is truthy, so today it is silently skipped and the query returns every row of `child_guardians` joined to `children`. The only thing currently limiting the result set is RLS, and the `authenticated_select_child_guardians` policy (and `child_groups`'s sibling policy) is `using (true)` — added in migration `20260613000000_add_select_policies_child_guardians_child_groups.sql` purely to unblock nested Supabase JS selects, with no guardian scoping ever added back.

Other call sites already do this correctly: `MessageFeedCard.tsx` passes `userID: sender_id` into the same query function. Admin pages (`get-parents-page.ts`, `get-children-page.ts`, `get-child-by-id.ts`, `get-parent-by-id.ts`) intentionally read `child_guardians` unscoped, because admins manage all parents/children — these must keep working after the RLS change.

## Goals / Non-Goals

**Goals:**
- A parent only ever sees, in the Feed child selector, the children they are a guardian of.
- The restriction holds even if a client bypasses `UserHydrator`/`getUserChildren` (i.e., enforced at the RLS layer, not just app code).
- Admin and teacher workflows that read `child_guardians`/`child_groups` broadly (admin children/parents management pages) continue to work unchanged.
- Switching the selected child continues to scope the Feed to that child's group only (already correct — verify with a regression check, no code change expected).

**Non-Goals:**
- Changing the selector to multi-select — it must remain single-select.
- Changing `/messages` 1:1 contacts/role-filter scoping for admins — that is documented, intended behavior (`messages-role-filter` spec) and out of scope.
- Introducing teacher-specific RLS scoping on `child_guardians` — no current code path requires teachers to read this table directly (they use `group_teachers`/`child_groups` by `group_id`), so no teacher clause is added unless a future need arises.

## Decisions

1. **Client-side fix: pass `userID` into `useUserChildrenQuery` from `UserHydrator.tsx`.**
   Use the already-available authenticated user id (the same id used elsewhere in `UserHydrator` to branch on role) so `getUserChildren`'s existing `guardian_id` filter activates. No change needed in `getUserChildren` itself — the filter logic already exists and is correct, it's just never invoked with a value today.
   *Alternative considered*: add a new query function exclusively for "my children." Rejected — `getUserChildren` already supports this via its optional `userID` param; adding a second function would duplicate logic for no benefit.

2. **Server-side fix: scope `authenticated_select_child_guardians` to `guardian_id = auth.uid() OR public.is_admin(auth.uid())`.**
   Apply the same pattern to the `child_groups` SELECT policy via an `EXISTS` against `child_guardians` for the calling guardian, OR `is_admin(auth.uid())`. This reuses the existing `public.is_admin(uuid)` helper (`20260416120000_admin_entity_management_rls.sql`) rather than inventing new role-check logic, keeping admin children/parents management pages working unchanged.
   *Alternative considered*: leave RLS as `using (true)` and rely solely on the client-side fix. Rejected — the client fix alone is bypassable by anyone calling the Supabase REST/JS API directly with their own session; the codebase already establishes the convention of `is_admin()`-gated policies for sensitive scoping elsewhere, so this fix is consistent with that convention, not a new pattern.
   *Alternative considered*: also add a teacher-scoped `EXISTS` clause (via `group_teachers`/`child_groups`) so teachers can read guardian links for their own students. Deferred — no current query path needs it; adding unused scope increases the policy's complexity and attack surface for no functional gain today.

3. **No change to `child_groups`' existing `EXISTS`-based parent path** beyond mirroring the same `guardian_id`/`is_admin()` logic — `child_groups` rows are reachable via `children.child_groups` in the nested select, so its SELECT policy must allow exactly the same set of children a guardian-scoped `child_guardians` policy would allow, otherwise the nested query silently returns empty `child_groups` arrays for legitimately-owned children (matching the original bug the `using (true)` policy was added to fix).

## Risks / Trade-offs

- [Risk] Tightening `child_groups`/`child_guardians` SELECT RLS could break an as-yet-undiscovered query path that relies on broad read access (e.g., a teacher-facing feature). → Mitigation: grep all call sites of both tables before applying the migration (already done for `child_guardians`; do the same for `child_groups` during implementation) and manually smoke-test admin children/parents management pages plus the parent Feed selector and teacher Feed group-selector after the migration.
- [Risk] If `UserHydrator.tsx`'s authenticated user id is read from a stale/unhydrated atom at the moment `useUserChildrenQuery` fires, `userID` could be `undefined` on first render, causing a flash of "all children" before re-fetching. → Mitigation: gate the query with React Query's `enabled: !!userID` (already used elsewhere in the query/hook pattern) so it does not fire until the id is available.
- [Trade-off] This fix does not add teacher-scoped RLS for `child_guardians`. If a future feature needs teachers to see their students' guardians directly from this table, that policy will need to be added then — acceptable since no such need exists today and speculative permissions are avoided.

## Migration Plan

1. Ship the new migration tightening `authenticated_select_child_guardians` and `child_groups`'s SELECT policy (idempotent `drop policy if exists` / `create policy`, matching existing migration style).
2. Regenerate `src/types/database.types.ts` only if `supabase gen types` output changes (policy-only changes typically do not affect generated types, but run it to confirm).
3. Ship the `UserHydrator.tsx` client fix in the same change/PR so client and server scoping land together — landing the RLS change alone (without the client fix) would already fix the visible bug; landing the client fix alone (without RLS) would leave the API-level hole open. Order within the same deploy does not matter since both are additive restrictions, not breaking removals of used functionality.
4. Rollback: revert the migration (recreate the `using (true)` policies) and revert the `UserHydrator.tsx` change independently if either causes a regression — they are not interdependent for rollback purposes.

## Open Questions

None — scope and approach confirmed against actual code/RLS/migration history during investigation.

## Implementation Note (discovered during apply)

The live database had an **untracked policy** on `child_groups` — `"Enable read access for all users"` (`qual: true`) — created outside of migration history (Supabase Studio default-named policy), not present in any file under `supabase/migrations/`. Because Postgres ORs multiple permissive SELECT policies together, this policy silently defeated the new guardian/admin-scoped `authenticated_select_child_groups` policy: RLS simulation showed a parent still seeing all 33 `child_groups` rows instead of just their own children's. A follow-up migration (`drop_legacy_open_select_policy_child_groups`) dropped it. `child_guardians` also has a pre-existing untracked policy, `"Enable read access for authenticated users and teachers"` (`auth.uid() = guardian_id OR caller role = 'teacher'`), which does not conflict with parent-scoping (already restricts to the caller's own guardian rows) but does grant any teacher unscoped read access to all `child_guardians` rows — left in place since no code path currently depends on it and removing it is outside the scope of this fix; flagged here for future cleanup.

## Implementation Note 2 (discovered from live user report after apply)

After deploying the client fix, the parent reported the Feed selector initially showing "No hay hij@s asignados" (no children assigned) and losing its list entirely after switching. Root cause: `useUserChildrenQuery` (`src/hooks/UseGetUserChildrenQuery.ts`) built its React Query `queryKey` as the static literal `['user-children']` whenever any `userID` param was passed — it never included the actual id/groupID values. `MessageFeedCard.tsx` already called this hook per Feed message with `userID: sender_id` (a different sender per card) using that same generic key. Before this change, `UserHydrator.tsx` called the hook with `params: {}`, landing on the distinct key `['parent-user-children']`, so the collision was latent. Once `UserHydrator` started passing `userID: localUserId` (this change's task 2.1), its query shared a cache entry with every `MessageFeedCard` instance; whichever resolved last (often a narrower per-sender/per-group fetch, sometimes empty) silently overwrote the shared cache entry, so the selector's data flickered or emptied out depending on render order. Fixed by keying on the actual values: `['user-children', params.userID, params.groupID ?? null]`, giving each caller its own cache slot.
