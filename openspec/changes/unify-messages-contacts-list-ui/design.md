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

### 3. Role label as subtitle

The `subtitle` prop of `EntityListItemLink` accepts `ReactNode`. Passing the raw `role` string (e.g. `"teacher"`, `"parent"`, `"admin"`) as-is matches what the current `<User description={role}>` renders. A translated label is desirable long-term but out of scope for this visual-parity change.

### 4. `UserCircleIcon` as fallback icon

All person-entity rows in the admin area use `UserCircleIcon` from `@heroicons/react/24/outline` as their fallback. Using the same icon here maintains visual consistency for contacts without a photo.

## Risks / Trade-offs

- **`onClick` fires on every click inside the row, not just the link** → The `setReceiver` side-effect is idempotent (setting the atom to the same value repeatedly is harmless), so this is acceptable.
- **`EntityListItemLink` uses `<img>` (eslint-disable comment already present)** → No new lint issues introduced.
- **`role` subtitle is not translated** → Acceptable for this change; a follow-up i18n pass can address it.

## Migration Plan

1. Rewrite `src/components/common/UserListItem.tsx` to wrap `EntityListItemLink`.
2. No other files need changes.
3. **Rollback:** Revert the single file. No data or schema changes.
