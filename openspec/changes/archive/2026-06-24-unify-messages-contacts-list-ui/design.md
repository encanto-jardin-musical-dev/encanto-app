## Context

The messages contacts list is the only screen outside the admin area that renders user rows. It currently uses `UserListItem` — a bespoke component built on HeroUI's `<User>` composite that renders an initials-only avatar circle, a compact name + role subtitle, and a `bg-default-100 rounded-lg p-2` card-per-row background. Every other entity list in the app (children, teachers, parents, groups) uses `EntityListItemLink` — a row with a round photo avatar (with icon fallback), bold name, muted subtitle, and a bottom-divider separator. The visual inconsistency is visible at a glance when comparing the two screens.

`EntityListItemLink` already supports everything needed:
- `imageUrl` (signed URL or null) → renders `<img>` or falls back to `fallbackIcon`
- `title` (bold name)
- `subtitle` (any ReactNode — role label fits here)
- `href` (Next.js `<Link>`)

The only thing `UserListItem` does that `EntityListItemLink` does not is the Jotai `setReceiver` side-effect on click. This needs to be preserved.

## Goals / Non-Goals

**Goals:**
- Make the messages contacts list look identical in style to the admin entity lists.
- Reuse `EntityListItemLink` rather than reimplementing its visual logic.
- Preserve the `setReceiver(receiverAtom)` click side-effect that pre-populates the conversation header with the contact's name and avatar URL.
- Keep `avatar_url` flowing correctly (it is already a signed URL by the time it reaches `UserListItem`, resolved by `useUserContactsQuery`).

**Non-Goals:**
- No changes to data fetching, `UseGetUserContactsQuery`, `UserContact` type, or `MessagesContactsList`.
- No new shared components — `EntityListItemLink` already covers the need.
- No changes to the `UserCircleIcon` fallback icon choice (same icon used across all profile-less person entities).
- No routing changes.
- No changes to the conversation screen or any other part of the messages feature.

## Decisions

### 1. Rewrite `UserListItem` in-place rather than creating a new component

`UserListItem` sits in `src/components/common/` and is only consumed by `MessagesContactsList`. Rewriting it in-place keeps the import path stable (no change needed in `MessagesContactsList`) and avoids leaving a dead component behind.

- **Alternative considered:** Create a new `ContactListItem` in `src/components/messages/` and update the import in `MessagesContactsList`. Rejected — adds a file with no reuse benefit and requires two changes instead of one.

### 2. Wrap `EntityListItemLink` inside a `<div>` with an `onClick` for the `setReceiver` side-effect

`EntityListItemLink` renders its own `<Link>` internally and does not expose an `onClick` prop. Rather than forking the shared component, `UserListItem` wraps it in a `<div onClick={handleContactClick}>` — the inner `<Link>` still handles navigation, and the outer `onClick` fires `setReceiver` on the same interaction.

- **Alternative considered:** Add an `onClick` prop to `EntityListItemLink`. Rejected — it is a generic shared component; adding messaging-domain side-effect props pollutes it. The wrapper pattern is the correct boundary.

### 3. Localized role label with a role icon as subtitle

The `subtitle` prop of `EntityListItemLink` accepts `ReactNode`. The contact's role is rendered as a localized label from the new `MessagesContacts.role` namespace (`teacher` → "Maestro", `admin` → "Administrador", `parent` → "Acudiente"), preceded by a role-specific icon (`AcademicCapIcon` for teacher, `ShieldCheckIcon` for admin, `UserIcon` for parent), mirroring the teachers list subtitle pattern. Because `role` is a free-form string, the label uses `t.has()` to guard against missing keys and falls back to the raw role value (with the default person icon) for unknown roles.

- **Alternative considered:** Reuse the existing `AcademicCapIcon` for every contact (as the teachers list does). Rejected — the contacts list contains mixed roles, so a graduation cap on an admin or parent would be misleading.

### 4. `UserCircleIcon` as avatar fallback

All person-entity rows in the admin area use `UserCircleIcon` from `@heroicons/react/24/outline` as their avatar fallback. Using the same icon here maintains visual consistency for contacts without a photo. (This is distinct from the role icon in the subtitle, which is role-specific.)

### 5. Card row style + functional search bar in `MessagesContactsList`

The target design (the admin teachers list) uses the card row style, not the flush divider style. To match it:

- Render rows with `EntityListItemLink variant="card"` (the `bg-default-100 rounded-lg p-2` card) and space them with `gap-3` in the list container, matching the admin entity lists.
- Replace the flag-gated `SearchBar` with the shared `AdminSearchBar` (always visible) and filter `contacts` client-side by full name (case-insensitive). The contacts query already returns the full list, so client filtering is sufficient and avoids data-layer changes.
- Use a `grid grid-rows-[auto_1fr]` layout (like the teachers page) so the search bar stays fixed while the rows scroll.

- **Alternative considered:** Server-side search via the contacts query. Rejected — the contact set is small and already fully loaded; client filtering is simpler and needs no query/data changes.

### 6. Bounded full-height admin layout to pin the header

The admin list pages already used `grid grid-rows-[auto_1fr] h-full` with the `NavigationBar` and search bar in fixed rows, but the header still scrolled because the admin route group had **no layout** — pages fell through to the root layout, which imposes no height constraint, so `h-full` resolved to content height and the whole page scrolled.

The fix mirrors the messages route: add `src/app/admin/layout.tsx` wrapping pages in `<main className="flex h-screen flex-1">` so the page grid has a definite height and only the list region scrolls. The layout adds no padding because each admin page already applies its own `p-4`.

- **Alternative considered:** Make each admin page's outer container `h-screen` individually. Rejected — a single shared route layout is DRY, fixes every admin page (lists, detail, new, edit) at once, and matches the established messages-route pattern.

## Risks / Trade-offs

- **`onClick` fires on every click inside the row, not just the link** → The `setReceiver` side-effect is idempotent (setting the atom to the same value repeatedly is harmless), so this is acceptable.
- **`EntityListItemLink` uses `<img>` (eslint-disable comment already present)** → No new lint issues introduced.
- **Admin layout uses `h-screen`** → Consistent with the messages/feed route layouts already in the codebase; affects all admin pages, all of which use the `h-full` grid pattern and benefit from a bounded parent.

## Migration Plan

1. Rewrite `src/components/common/UserListItem.tsx` to wrap `EntityListItemLink` in `variant="card"` with a localized role subtitle and role icon.
2. Update `src/components/messages/MessagesContactsList.tsx`: add `AdminSearchBar` with client-side name filtering, `gap-3` between cards, fixed-search/scrollable-list layout.
3. Add `MessagesContacts.role` translations to `messages/es.json`.
4. Add `src/app/admin/layout.tsx` for the bounded full-height admin container.
5. Pass `variant="card"` and add `gap-3` to the admin list components.
6. **Rollback:** Revert the listed files and delete `src/app/admin/layout.tsx`. No data or schema changes.
