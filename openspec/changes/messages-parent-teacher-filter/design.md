## Context

`get_profiles_by_guardian()` (fixed and archived in `2026-07-01-fix-parent-messages-contact-list`) already unions all admins with the teachers of every group any of the parent's children belong to, scoped via `auth.uid()`. `MessagesContactsList.tsx` renders that list with a search bar and, for admins only, role-filter chips (`ROLE_FILTER_OPTIONS`) that pass a `roleFilter` param into `useUserContactsQuery` → `getUserContacts` (the non-parent path). The parent path (`getParentUserContacts`) currently calls the RPC with no arguments and has no equivalent per-child narrowing.

Separately, the Feed already solves "let a parent pick one of their children" — `UserHydrator.tsx` fetches the parent's children via `useUserChildrenQuery` and builds `{ key: group_id, label: "First Last" }` options into `userSelectOptionsAtom`, which `FeedUser.tsx` renders as a HeroUI `Select`. That atom is deliberately Feed-scoped (it drives `groupContextSelectedAtom`, which re-scopes Feed messages) — reusing it as-is for Messages would incorrectly couple child selection between two unrelated pages (switching the filter in Messages would also flip the Feed's group context, and vice versa).

## Goals / Non-Goals

**Goals:**
- Let a parent with more than one child narrow the Messages contacts list to just one child's group teachers.
- Keep admins unconditionally visible regardless of the child filter (consistent with `messages-contact-scoping`).
- Reuse existing data-fetching (`useUserChildrenQuery`) rather than introducing a new query.
- Keep the filter's state local to `MessagesContactsList`, independent of the Feed's `groupContextSelectedAtom`.

**Non-Goals:**
- Changing the Feed child selector or its atoms.
- Supporting multi-select (picking more than one child at a time) — single-select only, matching the Feed pattern and the existing role-filter chips' single-active-filter behavior.
- Any change to the admin/teacher contacts path (`getUserContacts`, role-filter chips) — those are unaffected.
- Handling children with zero or multiple groups specially beyond "include teachers of whichever groups this child belongs to" (a child in 2 groups shows teachers from both when selected).

## Decisions

**1. Scope by `child_id`, not `group_id`, at the RPC layer.**
Add `p_child_id uuid default null` to `get_profiles_by_guardian()`. When null (current default), behavior is unchanged — union of all admins + all teachers across all the parent's children's groups. When provided, the teacher branch is further restricted to groups that specific child belongs to (via `child_groups`), still re-validated against `child_guardians` for `auth.uid()` so a parent can't pass another family's `child_id` to see their teachers.
- *Alternative considered*: filter by `group_id` instead of `child_id`. Rejected — the UI's natural unit of selection is "which of my children," and a child could belong to more than one group; `child_id` composes correctly with that case without the client needing to know about groups at all.
- *Alternative considered*: filter client-side by adding `group_id`/`child_id` to each contact row and filtering in `MessagesContactsList`. Rejected — would require widening `UserContact`/the RPC's return shape for all callers just to support one filter, and duplicates scoping logic that already lives correctly in SQL.

**2. New optional hook/query parameter, not a new query function.**
`getParentUserContacts(client, childId?: string)` gains an optional second argument, passed straight to `client.rpc("get_profiles_by_guardian", { p_child_id: childId ?? null })`. `useUserContactsQuery` passes `params.childFilter` through and includes it in the query key (`["user-contacts", userID, roleFilter, childFilter]`) so switching children invalidates the cache correctly, mirroring how `roleFilter` is already threaded through.

**3. Local filter UI in `MessagesContactsList`, not the shared Feed atom.**
Add a `useUserChildrenQuery({ params: { userID: user.id }, options: { enabled: isParent } })` call directly in `MessagesContactsList`, map the result to `{ key: child.id, label: "First Last" }` options (independent of the Feed's group-keyed options), and hold the selection in local `useState<string | null>` (`selectedChildId`), following the same toggle-to-clear interaction the role chips already use. Render as HeroUI `Chip`s (matching the existing role-filter chip pattern in this same component) rather than a `Select` (Feed's pattern) — both are valid HeroUI patterns already in the codebase; chips keep this component visually consistent with its own existing role-filter row rather than mixing two different control styles in one component.
- *Alternative considered*: reuse `userSelectOptionsAtom`/`groupContextSelectedAtom` directly. Rejected per Context above — cross-page coupling.

**4. Filter is gated on "more than one child," not "is a parent."**
A parent with exactly one child has nothing to filter — showing a single-option filter is noise. `MessagesContactsList` computes `hasMultipleChildren = (children?.length ?? 0) > 1` and only renders the child-filter chip row when true, symmetric with how the role-filter row is gated on `isAdmin`.

## Risks / Trade-offs

- [Risk] A parent could theoretically pass an arbitrary `child_id` via a crafted client call. → Mitigation: the SQL function re-validates the child belongs to the calling parent via `child_guardians.guardian_id = auth.uid()` before using it to scope groups — an unrelated `child_id` simply yields zero teacher rows (still gets admins), not another family's data.
- [Risk] Two independent "pick a child" UIs (Feed's `Select`, Messages' new `Chip` row) with different data shapes could drift if the children-fetching query changes shape. → Mitigation: both already share the same underlying `useUserChildrenQuery`/`getUserChildren` query function; only the option-mapping and selection-storage differ, which is intentional per Decision 3.
- [Risk] Query key growth (`roleFilter` + `childFilter`) could produce redundant cache entries when both a role and child filter are toggled in the same session. → Mitigation: acceptable — role filter is admin-only and child filter is parent-only, so in practice only one of the two is ever non-null for a given user.

## Migration Plan

1. Add migration `supabase/migrations/<timestamp>_add_child_filter_to_get_profiles_by_guardian.sql` that `create or replace function public.get_profiles_by_guardian(p_child_id uuid default null)` with the additional scoping predicate.
2. Apply via the Supabase MCP `apply_migration` tool against the linked project (no local Docker stack available, consistent with how the prior change was verified).
3. Regenerate `src/types/database.types.ts` — this time the RPC's `Args` type changes from `never` to `{ p_child_id?: string }`, so `getParentUserContacts`'s call site must pass the arg using the new generated signature.
4. Rollback: a corrective migration restoring the previous no-arg version if needed; since the new parameter defaults to `null` (matching old behavior), this change is backward-compatible and low-risk to roll forward instead of back if only the UI needs adjustment.

## Open Questions

None — filter granularity (child vs. group) and change scope (new change, not extending the prior one) were confirmed with the user.
