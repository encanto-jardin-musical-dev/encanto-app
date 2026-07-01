## Why

When a parent is logged in, the Feed's child selector (`FeedUser.tsx`) lists every child in the school, not just the children the parent is a guardian of, because `UserHydrator.tsx` fetches children without scoping by `guardian_id` and the underlying RLS policy on `child_guardians` allows any authenticated user to read all rows. A parent can select another family's child, point the Feed at that child's group, and view or post into a group they have no relationship to. This is a data-exposure bug that needs fixing now.

## What Changes

- Fix `UserHydrator.tsx` to pass the logged-in parent's `userID` to `useUserChildrenQuery`, so `getUserChildren` applies its existing `guardian_id` filter.
- **BREAKING (data access)**: Tighten the `authenticated_select_child_guardians` and corresponding `child_groups` RLS SELECT policies so parents can only read `child_guardians`/`child_groups` rows where they are the guardian; teachers/admins retain broader access via an `EXISTS` check against `profiles.role` (mirroring the pattern in `20260416120000_admin_entity_management_rls.sql`), so this fix removes a real over-permissive grant rather than adding a new restriction. This is the server-side enforcement backstop for the client-side fix above.
- No change to the selector's single-select behavior — it is already single-select by design (`FeedUser.tsx` has no `selectionMode="multiple"`, and `getGroupContextValue` only persists the first selected key). This is confirmed in scope as "already correct," not modified.
- No change to per-group Feed message scoping (`FeedGroup.tsx` / `getFeedUserMessages`) — it already re-fetches and scopes to exactly the selected group when the selector changes. Confirmed in scope as "already correct."
- Out of scope: Admin/teacher seeing all profiles in `/messages` contacts across all groups is intentional, documented behavior per the shipped `messages-role-filter` spec (admin oversight). This proposal does not touch `getUserContacts`, `MessagesContactsList.tsx`, or `/messages` route scoping.

## Capabilities

### New Capabilities
- `feed-child-selector`: Defines that a parent's Feed child selector must only ever list children the parent is a guardian of (scoped both client-side and via RLS), must remain single-select, and that switching the selected child must scope Feed messages to that child's group only.

### Modified Capabilities
(none — no existing spec currently covers the Feed child selector or `child_guardians` access scoping)

## Impact

- `src/components/providers/UserHydrator.tsx` — pass `userID` to `useUserChildrenQuery` for parent role.
- `src/queries/users/get-user-children.ts` — no logic change; the existing `guardian_id` filter starts being exercised once `userID` is passed.
- `supabase/migrations/` — new migration tightening `authenticated_select_child_guardians` (and the related `child_groups` SELECT policy) to scope by `guardian_id = auth.uid()` for parents, with an `EXISTS`-based allowance for teacher/admin roles.
- `src/types/database.types.ts` — regenerate if migration changes any function signatures (not expected here, policy-only change).
- No changes to `FeedUser.tsx`, `FeedGroup.tsx`, `getFeedUserMessages`, or `/messages` route/contacts code.
