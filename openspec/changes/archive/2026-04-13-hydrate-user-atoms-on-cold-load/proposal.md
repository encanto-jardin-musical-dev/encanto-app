## Why

The current-user Jotai atoms (`userIdAtom`, `userRoleAtom`, `userSelectOptionsAtom`, etc. in `src/lib/store/user.ts`) are hydrated in exactly one place: `src/components/feed/FeedUser.tsx`. That component only mounts when the user is on `/feed`.

As a result, any cold load of a route that does **not** pass through `/feed` first — reload on `/messages/<id>`, push-notification click, shared/bookmarked URL, direct navigation — leaves those atoms at their defaults:

```
userIdAtom   = ''
userRoleAtom = 'parent'
userAtom     = { id: '', role: 'parent', ... }
```

This surfaced during verification of `persist-message-thread-participants` (4.3): after reloading `/messages/<id>` the following cascade fails because `userIdAtom` is empty —

- `MessagesList.isOwnMessage = msg.sender_id === ''` → every message is treated as incoming, so the auto-mark-as-read effect fires on the current user's own messages.
- `MessagesList` realtime filters use `filter: receiver_id=eq.${userID}` → the subscription filter is invalid and read-status updates never arrive.
- `MessageInput` builds its insert with `sender_id: ''` → send is broken / RLS would reject.
- Navigating back to `/messages` renders `MessagesContactsList`, whose query is gated on `enabled: !!user.id && !!user.role` → query never runs → `"No contacts found"` appears immediately.
- The `MessageFeedCard` unread badge never clears because read-state logic downstream is driven by broken atoms.

The root cause is a single architectural bug: **current-user state lives in atoms that are only populated by a feed-scoped component.** Every route ought to see a hydrated user on mount.

## What Changes

- Introduce a client-side `UserHydrator` component that runs once at the app level, fetches the authenticated user's profile via the Supabase browser client, and populates `userIdAtom`, `userRoleAtom`, `userFirstNameAtom`, `userLastNameAtom`, `userAvatarAtom`, and `userSelectOptionsAtom` (role-appropriate: parent children, teacher groups, admin all-groups).
- Mount `UserHydrator` inside `src/app/providers.tsx` so it is active on every authenticated route (feed, messages, anywhere else).
- Remove the duplicated hydration logic from `FeedUser.tsx`. `FeedUser` continues to render the header/select but no longer writes to the atoms — it reads from them like every other consumer.
- Keep the `groupContextSelectedAtom` defaulting behavior in `FeedUser` (or move it to `UserHydrator`) — document which component owns it.
- No route/middleware changes. No database changes. No API changes.

## Capabilities

### Modified Capabilities

- `messaging` — strengthens the guarantees added in `persist-message-thread-participants`: sending a reply from a cold-loaded `/messages/<id>` SHALL succeed because the current user is hydrated.

### New Capabilities

- `user-session` — a new spec describing how the current-user atoms are hydrated once per authenticated session, independent of which route the user lands on first.

## Impact

- **Code**: `src/app/providers.tsx` (mount `UserHydrator`), `src/components/providers/UserHydrator.tsx` (new), `src/components/feed/FeedUser.tsx` (remove atom writes), and verification across every route that reads `userIdAtom` / `userRoleAtom` / `userAtom`.
- **No schema changes.**
- **Risk**: Medium. The hydration order changes for `/feed` — `FeedUser` previously both populated atoms and read derived data. The new order is "hydrator writes → every component reads." Needs a careful audit of init-order assumptions (e.g. `userSelectOptionsAtom` + `groupContextSelectedAtom` initialization).
- **Unblocks**: the deferred verification scenarios in `persist-message-thread-participants` (4.3 send, 4.4 paste, 4.5 push-click, cross-session read-state) — they should all pass once this change lands.
