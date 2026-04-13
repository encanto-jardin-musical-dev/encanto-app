## Context

`src/lib/store/user.ts` defines several atoms describing the current user:

```ts
export const userIdAtom              = atom('');
export const userRoleAtom            = atom<UserRole>('parent');
export const userFirstNameAtom       = atom('');
export const userLastNameAtom        = atom('');
export const userAvatarAtom          = atom('');
export const userSelectOptionsAtom   = atom<SelectOptions[]>([]);
export const userAtom                = atom((get) => ({ /* derived from the above */ }));
```

The only place these are **written** is `src/components/feed/FeedUser.tsx:41-47` (id/role) and `FeedUser.tsx:90-116` (select options). `FeedUser` is rendered only under `/feed`.

The atoms are **read** on every route:

- `src/components/messages/MessageInput.tsx` — `userIdAtom`, `userRoleAtom` for the insert payload
- `src/components/messages/MessagesList.tsx` — `userIdAtom` for `isOwnMessage` and realtime filters
- `src/components/messages/MessagesContactsList.tsx` — `userAtom` (gates the contacts query)
- `src/components/feed/*` — extensively
- `src/components/providers/PushNotificationProvider.tsx` — likely (verify during implementation)
- Navigation guards, avatar components, etc.

Consequence: any cold load that bypasses `/feed` sees empty user state. This has been a latent bug; `persist-message-thread-participants` exposed it by making `/messages/<id>` genuinely deep-linkable.

## Goals / Non-Goals

**Goals:**
- Every authenticated route has `userIdAtom`, `userRoleAtom`, and derived atoms populated on mount, regardless of entry point.
- `FeedUser` stops owning hydration — it becomes a pure consumer.
- Hydration runs exactly once per session (no duplicate fetches on navigation).
- No user-visible regression on `/feed` — the select, avatar, and group context continue to work.

**Non-Goals:**
- Redesigning the atom surface. Keep the existing atoms; only move *where* they are populated.
- Moving user state out of Jotai into React Query. That is a larger refactor; leave it for later.
- Server-side prefetching. Hydration runs client-side after the Supabase session is available.
- Fixing the feed `MessageFeedCard` unread-badge invalidation — separate concern.

## Decisions

### Decision 1: New `UserHydrator` client component mounted in `Providers`

**Choice**: Create `src/components/providers/UserHydrator.tsx`. It:

1. Reads the Supabase session via `createClient().auth.getUser()` (or `onAuthStateChange` to stay reactive to sign-in/sign-out).
2. On success, fetches the caller's `profiles` row (`id, first_name, last_name, role, avatar_url`) and the role-appropriate collections:
   - `parent` → children via existing `useUserChildrenQuery` / the underlying query function
   - `teacher` → groups via `useUserGroupsQuery`
   - `admin` → all groups via `useUserAllGroupsQuery`
3. Writes to `userIdAtom`, `userRoleAtom`, `userFirstNameAtom`, `userLastNameAtom`, `userAvatarAtom`, and `userSelectOptionsAtom` (same shapes `FeedUser` writes today).
4. Also calls `posthog.identify(id)` (moved from `FeedUser`).
5. Renders `null` — it's an effect-only component.

Mount it in `src/app/providers.tsx` inside `<JotaiProvider>` and above `{children}`, so every authenticated route sees the populated atoms.

**Why**: Keeps hydration in one place, avoids per-route duplication, and matches the existing provider composition pattern.

**Alternative considered**: Put hydration in a server component + pass user down via props. Rejected — it would require every consumer to accept a prop, which is a much larger refactor, and the atoms are already the shared contract.

### Decision 2: `FeedUser` becomes a consumer

**Choice**: Remove the `setUserId` / `setUserRole` writes from `FeedUser.useEffect`. Remove the `getSelectOptions` useEffect's write to `userSelectOptionsAtom` — that logic moves into `UserHydrator`. `FeedUser` reads `userAtom` / `userSelectOptionsAtom` like every other component.

**Why**: Eliminates the duplicated hydration source and the coupling between `/feed` and global state.

**Trade-off**: `FeedUser` no longer receives a `user: UserProfile` prop from the server component `/feed/page.tsx`. Either the page stops passing it and `FeedUser` reads from atoms, or the page keeps passing it for SSR rendering of the header avatar while atoms hydrate. Prefer the former for consistency — but verify the feed page renders without a flash.

### Decision 3: Use `getUser()` once, not subscribe to `onAuthStateChange`

**Choice**: In `UserHydrator`, call `supabase.auth.getUser()` in a single `useEffect` and write atoms on success. Do **not** subscribe to `onAuthStateChange`.

**Why**: The existing app already handles sign-out by routing to `/login`, at which point the provider tree unmounts. A subscription would add complexity (we'd need to clear the atoms on sign-out) without buying anything the current flow doesn't already handle.

**Alternative considered**: Subscribe to `onAuthStateChange`. Rejected — the existing middleware-based session refresh handles token rotation transparently; the hydrator just needs the user id/role once.

### Decision 4: Keep `groupContextSelectedAtom` default-selection logic in `FeedUser` (for now)

**Choice**: The `useEffect` that sets the initial group context based on `userSelectOptionsAtom[0]` stays in `FeedUser`. It's coupled to the `/feed` UI (the select is how the user changes groups) and is not required on the messages route.

**Why**: Minimizes blast radius. The messages route doesn't depend on `groupContextSelectedAtom` for 1:1 threads (only for teacher group messages, which enter through the feed anyway).

**Revisit**: If future work deep-links into a group thread, we'll need to move this logic into the hydrator or a route-specific initializer.

## Risks / Trade-offs

- **[Risk]** Hydration runs *after* the first paint → there is a brief window where `userAtom.id === ''` and gated queries are disabled. → **Mitigation**: most consumers already gate on `enabled: !!user.id`, so they just wait. Verify no component renders incorrect content during the gap.
- **[Risk]** Double hydration if `FeedUser` still writes atoms during the transition → **Mitigation**: do the `FeedUser` cleanup and the `UserHydrator` addition in the same commit.
- **[Risk]** `posthog.identify` moves — events emitted during the gap won't be tied to a user → **Mitigation**: identify inside `UserHydrator` as soon as `getUser()` resolves (same latency as today).
- **[Risk]** `useUserChildrenQuery` / `useUserGroupsQuery` hooks can't be called outside a React component. `UserHydrator` is a React component, so it can use them — but that means hydration depends on React Query's fetch lifecycle. → **Mitigation**: fine; that's how `FeedUser` does it today.

## Migration Plan

1. Create `src/components/providers/UserHydrator.tsx` mirroring the current `FeedUser` hydration effects (id/role/select options, posthog identify).
2. Mount `<UserHydrator />` inside `src/app/providers.tsx`, wrapped by `<JotaiProvider>`.
3. Delete the `setUserId` / `setUserRole` / `posthog.identify` effect in `FeedUser`. Delete the `getSelectOptions` effect. Verify `FeedUser` still reads what it needs from atoms.
4. Decide whether `feed/page.tsx` continues to pass `user: UserProfile` as a prop. If not, remove the prop and read from atoms — verify no flash.
5. Manually verify:
   - Cold load `/feed` — identical to today.
   - Cold load `/messages` — contacts list renders.
   - Cold load `/messages/<id>` — header renders, send works, `isOwnMessage` is correct, realtime read-state propagates.
   - Push-notification click → `/messages/<id>` — same as above.
   - Sign out → sign in → atoms re-hydrate.

**Rollback**: Revert the commit. `FeedUser` resumes its current role as the hydration source and cold-loaded non-feed routes go back to the broken behavior — but no data is lost.
