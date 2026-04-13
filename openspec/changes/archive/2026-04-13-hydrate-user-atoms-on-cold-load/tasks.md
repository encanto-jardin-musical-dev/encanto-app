## 1. UserHydrator component

- [x] 1.1 Create `src/components/providers/UserHydrator.tsx` as a `'use client'` component that renders `null`
- [x] 1.2 On mount, call `createClient().auth.getUser()` and read the returned `user.id` / `user.user_metadata.role` (or re-fetch the profile row for canonical values)
- [x] 1.3 Fetch the profile row (`id, first_name, last_name, role, avatar_url`) via `getProfileById(client, user.id)` and write `userIdAtom`, `userRoleAtom`, `userFirstNameAtom`, `userLastNameAtom`, and `userAvatarAtom`
- [x] 1.4 Based on role, fetch and populate `userSelectOptionsAtom` using the same query functions `FeedUser` uses today (`useUserChildrenQuery`, `useUserGroupsQuery`, `useUserAllGroupsQuery`)
- [x] 1.5 Call `posthog.identify(user.id)` once the id is known
- [x] 1.6 Guard all writes behind `if (!user || error) return;` so unauthenticated routes (e.g. `/login`) do not clobber atoms

## 2. Wire into the provider tree

- [x] 2.1 Import and render `<UserHydrator />` inside `src/app/providers.tsx`, nested inside `<JotaiProvider>` and before `{children}`
- [x] 2.2 Verify `UserHydrator` does not re-run on every route change (it mounts once with the provider tree)

## 3. Remove duplicated hydration from `FeedUser`

- [x] 3.1 Delete the `setUserId` / `setUserRole` / `posthog.identify` `useEffect` in `src/components/feed/FeedUser.tsx`
- [x] 3.2 Delete the `getSelectOptions` `useCallback` + `useEffect` that writes to `userSelectOptionsAtom`; `FeedUser` instead reads `userSelectOptionsAtom` directly
- [x] 3.3 Decide whether `FeedUser` still needs the `user: UserProfile` prop. If `userAtom` is sufficient for the header and avatar, drop the prop and update `src/app/feed/@user/page.tsx` (or equivalent) accordingly
- [x] 3.4 Keep the `groupContextSelectedAtom` default-selection `useEffect` in `FeedUser` (per design Decision 4)

## 4. Audit other readers

- [x] 4.1 Grep for `userIdAtom`, `userRoleAtom`, `userAtom` and confirm each reader tolerates the brief hydration gap (most already gate via `enabled: !!user.id`)
- [x] 4.2 Confirm `PushNotificationProvider` still functions — it may read the user id before the hydrator resolves

## 5. Verification

- [x] 5.1 `npm run lint` passes with no new warnings
- [x] 5.2 Manual: cold load `/feed` → header, avatar, select all render as before
- [x] 5.3 Manual: cold load `/messages` → contacts list renders (no spurious "No contacts found")
- [x] 5.4 Manual: cold load `/messages/<id>` → header renders, `isOwnMessage` styling is correct, sending a reply succeeds
- [x] 5.5 Manual: while on `/messages/<id>`, receive a real-time incoming message → it appears and is auto-marked read
- [x] 5.6 Manual: click a push notification that deep-links to `/messages/<id>` in a fresh tab → header + send both work, PostHog session shows the authenticated user id
- [x] 5.7 Manual: sign out → sign back in → atoms re-hydrate on the next authenticated route
- [x] 5.8 Re-run the deferred scenarios from `persist-message-thread-participants` (its 4.3 / 4.4 / 4.5) and confirm they now pass
