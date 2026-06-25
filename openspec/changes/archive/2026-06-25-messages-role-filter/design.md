## Context

The messages contacts list (`MessagesContactsList`) currently fetches all users (excluding the current user) via `useUserContactsQuery`, which dispatches to `getUserContacts` (all profiles) or `getParentUserContacts` (RPC for parents). Client-side filtering is limited to name search. Admin users need to narrow down contacts by role to efficiently find the right person in larger organizations.

The feature must be admin-only (non-admin users see everyone relevant to them based on their own role), DRY (no duplicate filter logic), and follow the Open/Closed principle so adding a new role chip in the future requires no structural changes.

## Goals / Non-Goals

**Goals:**
- Render a set of toggleable role-filter chips in `MessagesContactsList`, visible only when `user.role === "admin"`.
- Apply the role filter at the **query layer** (Supabase `.eq('role', value)`) so only matching records are fetched — not via post-fetch client-side slicing.
- Update `useUserContactsQuery` query key to include the active role filter, ensuring React Query caches each filtered result independently.
- Keep name search working on top of the active role filter (client-side, same as today).
- Add i18n keys for chip labels.

**Non-Goals:**
- Multi-select role filtering (only one role active at a time; toggling the same chip deactivates it).
- Persisting the selected role filter across sessions or navigation.
- Changing the filter UX for non-admin users.
- Modifying `getParentUserContacts` (parents only see their guardian-linked teachers; role filtering doesn't apply to them).

## Decisions

### Decision 1: Filter at query layer, not client-side

**Choice**: Pass `roleFilter` to `getUserContacts` and add `.eq('role', roleFilter)` when present.

**Rationale**: Client-side filtering on a potentially large list wastes bandwidth and memory. Filtering at the Supabase query level is cheap, correct, and means the cached data per role is smaller. React Query's `queryKey` includes the filter so each role gets its own cache entry — switching tabs is instant after the first fetch.

**Alternative considered**: Filter the already-fetched `contacts` array in the component. Rejected because it sends unnecessary data over the wire and does not scale.

### Decision 2: Single active role at a time (toggle, not multi-select)

**Choice**: `activeRole` is `UserRoles | null` — selecting the same chip deactivates it; selecting a different chip replaces the active one.

**Rationale**: The use case is "show me only teachers" — admins rarely need to see two roles simultaneously. A single-selection model is simpler UI, simpler state (`useState<UserRoles | null>`), and cleaner query key. Multi-select can be added later as an ADDED requirement without touching existing logic.

**Alternative considered**: Multi-select with a `Set<UserRoles>`. Rejected as over-engineering for the current need; DRY principle favors the simplest model.

### Decision 3: Role chip config as a static constant

**Choice**: Define `ROLE_FILTER_OPTIONS: Array<{ role: UserRoles; labelKey: string }>` as a module-level constant in the component file (or a shared constants file if reused).

**Rationale**: Avoids inline duplication of role strings in JSX. Adding a new role requires one entry in the array — no structural changes (Open/Closed). Follows the same pattern as the existing `ROLE_ICONS` map in `UserListItem`.

### Decision 4: Chips use HeroUI `Chip` with `isSelected`/`onClick` semantics

**Choice**: Render each filter chip as a HeroUI `Chip` (or `Button` styled as chip) with a visual selected state driven by `activeRole === chip.role`.

**Rationale**: Consistent with the existing HeroUI-first design system. No new dependencies.

### Decision 7: Active chip shows an XMarkIcon via `endContent`

**Choice**: Render `XMarkIcon` (16px solid from `@heroicons/react/16/solid`) as the `endContent` prop of the active HeroUI `Chip`; inactive chips have no `endContent`.

**Rationale**: The X icon gives a clear affordance that tapping the active chip will deactivate it — without needing a separate close button or tooltip. Using `endContent` keeps the chip self-contained and avoids any click-target overlap. The 16px heroicon variant fits the chip height without extra sizing work.

### Decision 6: Filter chips are placed below the search bar

**Choice**: Render the search bar first, with the role-filter chip row immediately beneath it.

**Rationale**: Search is the primary action and should have top prominence. Filters are secondary — they refine an already-scoped search — so placing them below follows a natural visual hierarchy (broad → narrow). This also keeps the chip row close to the list it filters, making the relationship more intuitive.

### Decision 5: Admin-only visibility via `userAtom`

**Choice**: Read `user.role` from `userAtom` (already in scope in `MessagesContactsList`) and render the filter row only when `user.role === USER_ROLES.ADMIN`.

**Rationale**: The atom is already consumed in the component; no prop drilling or context changes needed. Single Responsibility — the component controls its own visibility logic based on the role it already has.

## Risks / Trade-offs

- **Cache granularity**: Each `(userID, roleFilter)` combination gets its own React Query cache entry. If an admin cycles through all roles, up to 4 entries are cached (null + 3 roles). This is acceptable — entries share the same `staleTime` and are evicted normally.  
  → Mitigation: No action needed; memory impact is negligible.

- **`getParentUserContacts` untouched**: Parent users call an RPC that joins guardian relationships — role filtering doesn't make sense there. The hook's existing branch for `USER_ROLES.PARENT` bypasses `getUserContacts` entirely, so the new `roleFilter` param is simply ignored in that branch.  
  → Mitigation: Document in hook JSDoc that `roleFilter` only applies to non-parent callers.

- **No loading state between chip switches**: Switching role chips triggers a new query. If the new role's data is not cached, a brief loading state appears.  
  → Mitigation: `ContactsListSkeleton` renders 6 placeholder card rows during `isPending`, keeping the search bar and chips visible and interactive so the layout never jumps.

## Migration Plan

1. Update `getUserContacts` query function — additive change, fully backward-compatible.
2. Update `useUserContactsQuery` hook to thread `roleFilter` through params and query key.
3. Update `MessagesContactsList` to hold `activeRole` state and render chips.
4. Add i18n keys.
5. No database migrations, no API breaking changes, no feature flags required.
6. Rollback: revert the four files; no data is mutated.
