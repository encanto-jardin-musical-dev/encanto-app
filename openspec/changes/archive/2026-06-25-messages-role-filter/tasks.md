## 1. Query Layer — Role Filter Support

- [x] 1.1 Update `getUserContacts` in `src/queries/messages/get-user-contacts.ts` to accept an optional `roleFilter?: UserRoles` param and append `.eq('role', roleFilter)` to the query when it is provided
- [x] 1.2 Update `useUserContactsQuery` in `src/hooks/UseGetUserContactsQuery.ts` to read `params.roleFilter` and include it in the `queryKey` array (e.g., `["user-contacts", userID, roleFilter ?? "all"]`) so each role has its own cache entry
- [x] 1.3 Thread `params.roleFilter` through to the `getUserContacts` call inside `queryFn` (only for the non-parent branch; the parent RPC branch is unaffected)

## 2. i18n — Filter Chip Labels

- [x] 2.1 Add `filter` object under `MessagesContacts` in `messages/es.json` with keys `admin`, `teacher`, and `parent` using the localized labels (`Administrador`, `Maestro`, `Acudiente`)

## 3. Role Filter Chips Component

- [x] 3.1 Define a `ROLE_FILTER_OPTIONS` constant (array of `{ role: UserRoles; labelKey: string }`) covering admin, teacher, and parent — place it as a module-level constant in `MessagesContactsList.tsx` (or a shared file if reused)
- [x] 3.2 Add `activeRole` state (`useState<UserRoles | null>(null)`) to `MessagesContactsList`
- [x] 3.3 Implement toggle logic: if the tapped chip's role equals `activeRole`, set to `null`; otherwise set to the new role
- [x] 3.4 Render the filter chips row using HeroUI `Chip` components, iterating `ROLE_FILTER_OPTIONS`; apply a visual selected state when `chip.role === activeRole`; wrap the row in a conditional that only renders when `user.role === USER_ROLES.ADMIN`; place the chip row **below** the search bar
- [x] 3.7 Show an `XMarkIcon` (16px solid) via `endContent` on the active chip to signal it can be dismissed; inactive chips have no end icon

## 3b. Loading State

- [x] 3.5 Extract a `ContactsListSkeleton` component that renders 6 placeholder card rows (round avatar + two text lines) matching the `UserListItem` card shape using HeroUI `Skeleton`
- [x] 3.6 Replace the `isPending` early-return with an inline `{isPending ? <ContactsListSkeleton /> : ...}` inside the list container so the search bar and filter chips remain visible during loading

## 4. Wire Filter into Query & Search

- [x] 4.1 Pass `params: { ..., roleFilter: activeRole ?? undefined }` to `useUserContactsQuery` so the query refetches whenever `activeRole` changes
- [x] 4.2 Verify that the existing `filteredContacts` `useMemo` (name search) still operates on the role-filtered `contacts` array returned by the query — no changes needed to the memo itself, but confirm it references the updated `contacts` data

## 5. Manual Verification

- [x] 5.1 As admin: confirm chips appear below the search bar; tapping Teacher shows only teachers; tapping Teacher again restores the full list
- [x] 5.2 Confirm chips do NOT appear when logged in as a teacher or parent
- [x] 5.3 Confirm name search still works while a role filter is active (combined filtering)
- [x] 5.4 Confirm switching between role chips does not leave stale data (correct cache key per role)
- [x] 5.5 Run `pnpm lint` with no new errors
