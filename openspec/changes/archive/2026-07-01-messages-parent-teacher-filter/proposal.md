## Why

Now that a parent's Messages contacts list correctly shows only their children's group teachers plus admins (`fix-parent-messages-contact-list`), a parent with multiple children in different groups still sees all of those teachers mixed together with no way to narrow the list to a specific child's teachers. Mirroring the Feed's existing child-selector pattern lets parents quickly find the right teacher when they have more than one child enrolled.

## What Changes

- Add a child-filter control to the Messages contacts list, visible only to parents with more than one child (or more generally, more than one distinct children's group).
- Selecting a child scopes the contacts list to admins (always shown) plus only the teachers of that child's group(s); no selection (or a "clear" action) restores the full list of all their children's group teachers.
- Add an optional `p_child_id uuid default null` parameter to the `get_profiles_by_guardian()` database function so the child scoping happens server-side, consistent with how the existing role filter (`messages-role-filter`) is applied server-side via query params rather than client-side filtering.
- Reuse the existing `useUserChildrenQuery` data source (already used by the Feed child selector) to populate the filter options — no new query function needed for fetching the parent's children.

## Capabilities

### New Capabilities
- `messages-parent-child-filter`: Defines the child-filter control on the parent's Messages contacts list — visibility rules, single-select behavior, and how it scopes the teacher list to the selected child's group.

### Modified Capabilities
- `messages-contact-scoping`: The `get_profiles_by_guardian()` requirement gains an optional child-scoping parameter; when provided, the teacher branch of the result is further restricted to the given child's group(s) instead of the union of all the parent's children's groups. Admins remain unconditionally included regardless of the parameter.

## Impact

- **Database**: New migration adding `p_child_id uuid default null` parameter to `public.get_profiles_by_guardian()`; default (no arg) behavior unchanged from the current fix.
- **Code**: `src/queries/messages/get-parent-user-contacts.ts` gains an optional `childId` argument passed to the RPC call; `src/hooks/UseGetUserContactsQuery.ts` passes it through and includes it in the query key; `src/components/messages/MessagesContactsList.tsx` gains a child-filter UI block (HeroUI `Select`, mirroring `src/components/feed/FeedUser.tsx`) gated to parents with multiple children's groups.
- **Types**: `src/types/database.types.ts` regeneration after the migration (new optional arg on the RPC).
- **Risk**: Low — additive, backward-compatible RPC parameter; existing no-arg callers (if any remain) keep current behavior.
