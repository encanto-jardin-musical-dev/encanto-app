## Why

The messages contacts list (`/messages`) uses a bespoke `UserListItem` component built on HeroUI's `<User>` that renders a compact initials-avatar + role subtitle, visually inconsistent with the admin entity lists (children, teachers, parents, groups) which all use `EntityListItemLink` — a row with a round photo avatar, bold name, and muted subtitle separated by a bottom divider. Users experience a jarring visual context switch when moving between the admin area and messaging. Unifying the style gives the app a cohesive look and reuses the already-proven shared component.

## What Changes

- Replace `UserListItem` (HeroUI `<User>` + initials avatar) with a new `ContactListItem` component built on the shared `EntityListItemLink`, matching the admin list row style: round photo avatar (signed URL), bold name, muted role subtitle, divider separator.
- Remove the `bg-default-100 rounded-lg p-2` card background from each row — the divider-separated style replaces it.
- Keep `setReceiver` click behaviour (populates `receiverAtom` for the conversation header optimistic display).
- No changes to data fetching, routing, or the `UserContact` type.

## Capabilities

### New Capabilities

_(none — this is a pure UI refactor of an existing screen)_

### Modified Capabilities

- `messages-contacts-list`: The visual presentation of the contacts list changes to match the admin entity list style. No functional or data requirements change.

## Impact

- **Modified**: `src/components/common/UserListItem.tsx` — rewrite render using `EntityListItemLink`; keep `setReceiver` logic.
- **No change**: `MessagesContactsList.tsx`, `UseGetUserContactsQuery.ts`, routing, data layer, `UserContact` type, `receiverAtom`.
- **Visual only**: row background removed; divider separators added; avatar changes from HeroUI initials circle to round photo avatar with icon fallback; role label kept as subtitle.
