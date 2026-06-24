## 1. Implementation

- [x] 1.1 Rewrite `src/components/common/UserListItem.tsx`: wrap `EntityListItemLink variant="card"` in a `<div onClick={handleContactClick}>`, pass `imageUrl={avatar_url}`, `fallbackIcon={UserCircleIcon}`, `title={fullName}`, `href={/messages/${id}}`; build the `subtitle` from a role icon (`AcademicCapIcon`/`ShieldCheckIcon`/`UserIcon`) + a localized role label (`t.has(\`role.${role}\`) ? t(...) : role`); remove HeroUI `<User>`
- [x] 1.2 Add `MessagesContacts.role` translations (`teacher` → "Maestro", `admin` → "Administrador", `parent` → "Acudiente") to `messages/es.json`
- [x] 1.3 Update `src/components/messages/MessagesContactsList.tsx`: render rows in a `flex flex-col gap-3` card list; switch to a `grid grid-rows-[auto_1fr]` layout so the search bar is fixed and the list scrolls
- [x] 1.4 Replace the flag-gated `SearchBar` with an always-on `AdminSearchBar` (placeholder "Buscar contacto"); add client-side case-insensitive full-name filtering of `contacts`; show empty-state message when no matches
- [x] 1.5 Add an opt-in `variant` prop (`"divider"` default | `"card"`) to `src/components/common/EntityListItemLink.tsx`; in `"card"` mode wrap the row in `bg-default-100 rounded-lg p-2` with no bottom divider, keeping avatar/title/subtitle
- [x] 1.6 Pass `variant="card"` to `EntityListItemLink` in `ChildListItem`, `TeacherListItem`, `ParentListItem`, `GroupListItem`; add `gap-3` to the row container in `ChildrenList`, `TeachersList`, `ParentsList`, `GroupsList` so cards are spaced
- [x] 1.7 Pin the search bar on the admin list screens: in `src/app/admin/{children,teachers,parents,groups}/page.tsx`, change the search+list wrapper to a `grid grid-rows-[auto_1fr] gap-3 min-h-0 overflow-hidden`, keep the search bar in the fixed `auto` row, and move the list into its own `overflow-y-auto min-h-0` scroll region so only the rows scroll
- [x] 1.8 Add `src/app/admin/layout.tsx` wrapping admin pages in a bounded full-height container (`<main className="flex h-screen flex-1">` → full-height `section`, no extra padding) so the header (`NavigationBar`) and search bar stay pinned while only the list scrolls

## 2. Verification

- [x] 2.1 Manual: contacts list renders rows in card style (`bg-default-100` card per row, gap-separated), matching the admin teachers list
- [x] 2.2 Manual: contacts with avatars show photos; contacts without avatars show `UserCircleIcon` fallback
- [x] 2.3 Manual: each contact row shows the localized role label with its role icon (cap/shield/person); an unknown role falls back to the raw value with the person icon
- [x] 2.4 Manual: tapping a row navigates to the conversation and the header shows the correct name and avatar instantly (no flicker)
- [x] 2.5 Manual: typing in the search bar filters contacts by name; no matches shows empty state
- [x] 2.6 Manual: on each admin list (children, teachers, parents, groups), scrolling a long list keeps the header (`NavigationBar`) and search bar fixed and visible
- [x] 2.7 Manual: admin list rows render in card style (`bg-default-100` card per row, gap-separated, no divider)
- [x] 2.8 Run `pnpm lint` — no new errors (still 14 pre-existing problems, 0 new)
- [x] 2.9 Run `npx tsc --noEmit` — passes with exit code 0
