## Context

`src/lib/store/messages.ts` defines:

```ts
export const senderAtom = atom<MessageUser>();
export const receiverAtom = atom<MessageUser>();
```

Both are initialized to `undefined`. They are **written** in three places:

- `src/components/feed/MessageFeedCard.tsx` (writes both on card click before routing to `/messages/<sender_id>`)
- `src/components/common/UserListItem.tsx` (writes `receiverAtom` on contact click)

And **read** in two places on the messages route:

- `src/components/messages/MessagesUserData.tsx` (header — title/avatar)
- `src/components/messages/MessageInput.tsx` (needs `receiver.id` to build the insert payload)

`senderAtom` is written but **never read** anywhere — it's dead state.

When the user:

1. Reloads `/messages/<id>` → the Jotai provider remounts → atoms are `undefined` → header shows "undefined undefined" and send is broken.
2. Clicks a push notification that deep-links to `/messages/<id>` (PR #90) → same thing, never went through `/feed` or contacts.
3. Pastes/shares a conversation URL → same.

The `senderID` URL param is already the authoritative identifier for the other participant. We should derive everything from it.

## Goals / Non-Goals

**Goals:**
- `/messages/<id>` works identically whether the user came from `/feed`, reloaded the page, or deep-linked from a push notification.
- Header name/avatar and message send payload both work on a cold load of `/messages/<id>`.
- Continue to support optimistic hydration from the feed so the header renders immediately without a visible loading state when navigating from an already-cached card.
- Delete dead state (`senderAtom`).

**Non-Goals:**
- Rewriting the feed state or contact list.
- Persisting `receiverAtom` to `localStorage` / `sessionStorage`. The URL is already the right storage layer.
- Handling group-thread routes — the bug is scoped to 1:1 threads at `/messages/[senderID]`.
- Changing how messages themselves are fetched (`useGetMessagesQuery` is unaffected).

## Decisions

### Decision 1: Derive the "other participant" from the URL via React Query

**Choice**: Add `getProfileById(client, id)` in `src/queries/users/get-profile-by-id.ts` that selects `id, first_name, last_name, role, avatar_url` from `profiles`. Wrap it in `useGetProfileByIdQuery(id)` in `src/hooks/`. Use that hook in `MessagesUserData` and `MessageInput`.

**Why**: The URL is the source of truth for which thread is open. Deriving display data from the URL means reloads, deep links, and push-notification clicks all work identically. React Query caches the profile so the fetch is one-time per session per user.

**Alternative considered**: Persist `receiverAtom` to `sessionStorage`. Rejected — it duplicates state, won't match the URL if the user pastes a different conversation link, and still needs a fetch for uncached profiles.

### Decision 2: Keep `receiverAtom` as optimistic hydration (`initialData`), not the source of truth

**Choice**: `useGetProfileByIdQuery(senderID)` accepts an optional `initialData` argument. On `/messages/[senderID]`, we call it with `initialData = receiverAtomValue` when the atom's `id` matches `senderID`. If it matches, the query renders instantly with no loading state; if it doesn't, the query fetches.

**Why**: Preserves the zero-flash experience when coming from the feed (the feed card already has the full profile in hand), without making the atom a hard dependency.

**Alternative considered**: Prefetch the profile in a server component. Rejected — the messages route is already client-heavy, and the atom hydration covers the "came from feed" case with no network round trip.

### Decision 3: Remove `senderAtom` entirely

**Choice**: Delete `senderAtom` from `src/lib/store/messages.ts`. Remove the `setSender(...)` call in `MessageFeedCard.tsx`.

**Why**: It is never read. The current user's identity is already available via `userIdAtom`, `userRoleAtom`, and the authenticated Supabase session. Keeping dead state is a maintenance hazard.

### Decision 4: `MessageInput` uses the URL param as the authoritative `receiver_id`

**Choice**: In `MessageInput.tsx`, stop reading `receiver?.id` from `receiverAtom`. Accept `receiverId: string` as a prop from the page (or read `useParams().senderID`). Keep the profile query only for any UI the input may need (none at the moment, so the prop is enough).

**Why**: The insert payload's `receiver_id` must match the URL. Reading it from the atom could produce a mismatch if the atom is stale. Reading it from the URL is trivially correct.

## Risks / Trade-offs

- **[Risk]** Adds a profile fetch on every fresh load of `/messages/<id>` → **Mitigation**: React Query caches with a reasonable `staleTime` (5 min). Profiles are tiny (~5 fields).
- **[Risk]** Deleting `senderAtom` could break imports elsewhere → **Mitigation**: Pre-commit grep confirmed only `MessageFeedCard` and the store file reference it. TypeScript compilation will surface anything missed.
- **[Risk]** Profile doesn't exist for the given `senderID` (stale URL, deleted user) → **Mitigation**: Query returns `null`; `MessagesUserData` shows a fallback ("Usuario no disponible"); `MessageInput` is disabled. Scenarios cover this.
- **[Risk]** RLS blocks reading the profile → **Mitigation**: `profiles` RLS already allows authenticated users to read other profiles (used today by `get-user-profiles` in feed). No new policy needed.

## Migration Plan

1. Add `get-profile-by-id.ts` query + `UseGetProfileByIdQuery.ts` hook.
2. Update `MessagesUserData.tsx` and `MessageInput.tsx` to read from the query.
3. Update `src/app/messages/[senderID]/page.tsx` if needed (pass `senderID` down to children).
4. Remove `senderAtom` from the store and the `setSender(...)` call in `MessageFeedCard.tsx`.
5. Manually verify: reload mid-thread, click push notification, paste URL into new tab.

**Rollback**: Revert the commit; the feed path still works because `receiverAtom` writes are preserved.
