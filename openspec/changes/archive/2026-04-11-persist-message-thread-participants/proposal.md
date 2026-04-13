## Why

The `/messages/[senderID]` route depends on two Jotai atoms — `senderAtom` and `receiverAtom` — that only get populated when the user navigates from `MessageFeedCard` (in `/feed`) or clicks a `UserListItem`. On a page reload, or when a user opens a push-notification link that routes directly to `/messages/<id>`, both atoms are empty. The result is:

- `MessagesUserData` renders `"undefined undefined"` in the header instead of the other participant's name.
- `MessageInput` reads `receiver?.id` and can no longer send a reply (it falls back to `undefined` for `receiver_id` in the insert payload).

This breaks the push-notification click flow introduced in PR #90 and makes deep-linking to any conversation unreliable. The URL already contains the only identity we need (`senderID` param) — the page should derive the other participant's profile from it rather than relying on transient in-memory state set by an upstream route.

## What Changes

- Derive the thread's "other participant" (currently called `receiver`) from the `senderID` URL param on `/messages/[senderID]` via a new React Query hook, instead of relying on `receiverAtom` being pre-populated by the feed.
- Add a new query `getProfileById(id)` in `src/queries/users/` and a matching `useGetProfileByIdQuery` hook.
- Update `MessagesUserData.tsx` to read from the query (via props or the hook directly) rather than `receiverAtom`.
- Update `MessageInput.tsx` to read `receiver.id` from the URL param (authoritative) and fall back to the profile query for display data. The send payload only needs `receiver_id` which equals the URL param.
- Keep `receiverAtom` as an **optimistic hydration layer** only — feed/contact list still set it so the header renders instantly on navigation without waiting for the query — but the page no longer _depends_ on it.
- Remove `senderAtom` entirely. The current user is already available via `userIdAtom` / `userRoleAtom` + the authenticated session; `senderAtom` is redundant and not read by any component on the messages route (verified: only `MessageFeedCard` writes it, nothing reads it).

## Capabilities

### New Capabilities

- `messaging`: A new spec describing how 1:1 message threads resolve participant identity from URL params so conversations are deep-linkable and reload-safe.

### Modified Capabilities

_(none — this is the first `messaging` spec)_

## Impact

- **Code**: `src/app/messages/[senderID]/page.tsx`, `src/components/messages/MessagesUserData.tsx`, `src/components/messages/MessageInput.tsx`, `src/lib/store/messages.ts` (remove `senderAtom`), `src/components/feed/MessageFeedCard.tsx` (stop writing `senderAtom`), `src/queries/users/get-profile-by-id.ts` (new), `src/hooks/UseGetProfileByIdQuery.ts` (new).
- **No schema changes.**
- **No API/edge function changes.**
- **Risk**: Low. The fix adds a fetch on the messages page but the profile is small and cacheable. The push-notification deep-link flow becomes reliable.
