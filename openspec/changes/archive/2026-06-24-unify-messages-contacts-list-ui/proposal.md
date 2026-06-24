## Why

The messages contacts list (`/messages`) uses a bespoke `UserListItem` component built on HeroUI's `<User>` that renders a compact initials-avatar + role subtitle, visually inconsistent with the admin entity lists (children, teachers, parents, groups) which all use `EntityListItemLink` — a row with a round photo avatar, bold name, and muted subtitle separated by a bottom divider. Users experience a jarring visual context switch when moving between the admin area and messaging. Unifying the style gives the app a cohesive look and reuses the already-proven shared component.

## What Changes

- Replace `UserListItem`'s HeroUI `<User>` + initials avatar with the shared `EntityListItemLink` in `variant="card"`, matching the admin list card row style: round photo avatar (signed URL, `UserCircleIcon` fallback), bold name, role subtitle, each row in a `bg-default-100 rounded-lg p-2` card.
- Render the messages contacts list rows in the card style with `gap-3` spacing between them (matching the admin teachers list look the user requested), instead of a flush divider style.
- Show the contact's role as a localized label (new `MessagesContacts.role` translations) preceded by a role-specific icon (academic cap for teacher, shield for admin, person for parent), falling back to the raw role string for unknown roles — replacing the raw, untranslated role text.
- Add an always-visible `AdminSearchBar` above the list that filters contacts by full name on the client, replacing the flag-gated non-functional `SearchBar`.
- Keep `setReceiver` click behaviour (populates `receiverAtom` for the conversation header optimistic display).
- No changes to data fetching, routing, or the `UserContact` type.
- Add an admin route layout (`src/app/admin/layout.tsx`) that wraps every admin page in a bounded full-height (`h-screen`) container, mirroring the messages route layout. This gives the admin pages' `h-full` grids a definite height so the header (`NavigationBar`) and search bar stay pinned while only the list scrolls — fixing the previously scrolling header.
- Render the admin entity list rows (children, teachers, parents, groups) in a card style — each row wrapped in a `bg-default-100 rounded-lg p-2` background, separated by `gap-3`, with no divider — keeping the round photo avatar and existing subtitles.

## Capabilities

### New Capabilities

_(none — this is a pure UI refactor of existing screens)_

### Modified Capabilities

- `messages-contacts-list`: The contacts list renders rows in the unified card style (`bg-default-100` card per row, gap-separated), shows a localized role subtitle with a role icon, and adds a client-side full-name search bar.
- `admin-entity-list`: A new admin route layout provides a bounded full-height container so the header and search bar stay fixed at the top while only the rows scroll, and the rows render in a card style (`bg-default-100` card per row, gap-separated, no divider).

## Impact

- **Modified**: `src/components/common/UserListItem.tsx` — rewrite render using `EntityListItemLink` in `variant="card"`; add localized role subtitle with role icon; keep `setReceiver` logic.
- **Modified**: `src/components/common/EntityListItemLink.tsx` — add an opt-in `variant` prop (`"divider"` default | `"card"`); `"card"` wraps the row in `bg-default-100 rounded-lg p-2` with no divider.
- **Modified**: `src/components/messages/MessagesContactsList.tsx` — add always-on `AdminSearchBar` with client-side full-name filtering, `gap-3` between cards, switch layout to fixed search + scrollable list.
- **Modified**: `messages/es.json` — add `MessagesContacts.role` translations (`teacher`/`admin`/`parent`).
- **Added**: `src/app/admin/layout.tsx` — bounded full-height (`h-screen`) admin route layout so the header and search bar stay pinned while the list scrolls.
- **Modified**: `src/components/admin/{children,teachers,parents,groups}/*ListItem.tsx` — pass `variant="card"` to `EntityListItemLink`.
- **Modified**: `src/components/admin/{children,teachers,parents,groups}/*List.tsx` — add `gap-3` to the row container so cards are spaced.
- **Modified**: `src/app/admin/{children,teachers,parents,groups}/page.tsx` — change the search+list wrapper to a `grid grid-rows-[auto_1fr]` so the search bar row is fixed and only the list row scrolls.
- **No change**: `UseGetUserContactsQuery.ts`, routing, data layer, `UserContact` type, `receiverAtom`, the per-list query hooks and search-bar components.
