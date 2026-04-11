## 1. Profile-by-id query and hook

- [ ] 1.1 Create `src/queries/users/get-profile-by-id.ts` exporting `getProfileById(client, id)` that selects `id, first_name, last_name, role, avatar_url` from `profiles` and returns a single row (or `null`)
- [ ] 1.2 Create `src/hooks/UseGetProfileByIdQuery.ts` wrapping the query with a stable `queryKey` of `['user-profile', id]`, a `staleTime` of 5 minutes, and support for an optional `initialData` argument
- [ ] 1.3 Ensure `enabled` is `!!id` so the hook is a no-op when the URL param is missing

## 2. Messages route — derive participant from URL

- [ ] 2.1 In `src/app/messages/[senderID]/page.tsx`, pass `senderID` down to `MessagesUserData` and `MessageInput` as a prop (or use `useParams` inside the client components)
- [ ] 2.2 In `src/components/messages/MessagesUserData.tsx`, replace the `useAtomValue(receiverAtom)` read with `useGetProfileByIdQuery(senderID)`. Supply `receiverAtom` as `initialData` **only when** `atom.id === senderID`
- [ ] 2.3 Render a fallback label (e.g. translated "Usuario no disponible") when the query resolves to `null`
- [ ] 2.4 In `src/components/messages/MessageInput.tsx`, stop reading `receiver?.id` from `receiverAtom`. Use `senderID` from the URL (prop or `useParams`) as the authoritative `receiver_id` in the insert payload
- [ ] 2.5 Disable the input when the profile query returns `null`

## 3. Remove dead `senderAtom`

- [ ] 3.1 Delete `senderAtom` and its `MessageUser` references from `src/lib/store/messages.ts` (keep `receiverAtom`)
- [ ] 3.2 Remove the `setSender(...)` call and the `senderAtom` import in `src/components/feed/MessageFeedCard.tsx`, plus the `setSender` entry in the `useCallback` dependency array
- [ ] 3.3 Run `grep -rn senderAtom src` and confirm zero hits

## 4. Verification

- [ ] 4.1 `npm run lint` passes with no new warnings
- [ ] 4.2 Manual: navigate from `/feed` → click a message card → verify header renders instantly (no flash) and send works
- [ ] 4.3 Manual: while on `/messages/<id>`, hard reload → verify header still shows the participant and send still works
- [ ] 4.4 Manual: open a new tab, paste `/messages/<id>` → verify header + send both work
- [ ] 4.5 Manual: trigger a push notification click that opens `/messages/<id>` in a fresh tab → verify header + send
- [ ] 4.6 Manual: visit `/messages/<invalid-uuid>` → verify fallback label appears and input is disabled
