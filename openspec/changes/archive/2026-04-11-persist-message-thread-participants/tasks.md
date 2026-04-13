## 1. Profile-by-id query and hook

- [x] 1.1 Create `src/queries/users/get-profile-by-id.ts` exporting `getProfileById(client, id)` that selects `id, first_name, last_name, role, avatar_url` from `profiles` and returns a single row (or `null`)
- [x] 1.2 Create `src/hooks/UseGetProfileByIdQuery.ts` wrapping the query with a stable `queryKey` of `['user-profile', id]`, a `staleTime` of 5 minutes, and support for an optional `initialData` argument
- [x] 1.3 Ensure `enabled` is `!!id` so the hook is a no-op when the URL param is missing

## 2. Messages route — derive participant from URL

- [x] 2.1 In `src/app/messages/[senderID]/page.tsx`, pass `senderID` down to `MessagesUserData` and `MessageInput` as a prop (or use `useParams` inside the client components)
- [x] 2.2 In `src/components/messages/MessagesUserData.tsx`, replace the `useAtomValue(receiverAtom)` read with `useGetProfileByIdQuery(senderID)`. Supply `receiverAtom` as `initialData` **only when** `atom.id === senderID`
- [x] 2.3 Render a fallback label (e.g. translated "Usuario no disponible") when the query resolves to `null`
- [x] 2.4 In `src/components/messages/MessageInput.tsx`, stop reading `receiver?.id` from `receiverAtom`. Use `senderID` from the URL (prop or `useParams`) as the authoritative `receiver_id` in the insert payload
- [x] 2.5 Disable the input when the profile query returns `null`

## 3. Remove dead `senderAtom`

- [x] 3.1 Delete `senderAtom` and its `MessageUser` references from `src/lib/store/messages.ts` (keep `receiverAtom`)
- [x] 3.2 Remove the `setSender(...)` call and the `senderAtom` import in `src/components/feed/MessageFeedCard.tsx`, plus the `setSender` entry in the `useCallback` dependency array
- [x] 3.3 Run `grep -rn senderAtom src` and confirm zero hits

## 4. Verification

This change is scoped to the **other participant** display. The send-path and realtime
scenarios (4.3 hard reload, 4.4 paste-in-new-tab, 4.5 push click) also depend on the
current user being hydrated, which is tracked separately in the
`hydrate-user-atoms-on-cold-load` change. The manual scenarios below are narrowed
accordingly; the broader cold-load send verification lives in 5.x of that change.

- [x] 4.1 `npm run lint` passes with no new warnings
- [x] 4.2 Manual: navigate from `/feed` → click a message card → verify header renders instantly (no flash) and send works
- [x] 4.3 Manual: while on `/messages/<id>`, hard reload → verify the **header still shows the participant** (send verification deferred to `hydrate-user-atoms-on-cold-load` 5.4)
- [x] 4.4 Manual: open a new tab, paste `/messages/<id>` → verify the **header renders** (send verification deferred to `hydrate-user-atoms-on-cold-load` 5.4)
- [x] 4.5 Manual: trigger a push notification click that opens `/messages/<id>` in a fresh tab → verify the **header renders** (send verification deferred to `hydrate-user-atoms-on-cold-load` 5.6)
- [x] 4.6 Manual: visit `/messages/<invalid-uuid>` → verify fallback label appears and input is disabled
