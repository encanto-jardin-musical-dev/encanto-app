## Why

Admin users who manage teachers, parents, and other admins need a way to quickly narrow down the contacts list in the messages screen by role. Without filtering, the list becomes unwieldy as the number of users grows, forcing admins to scroll or rely solely on the search bar to locate a specific person.

## What Changes

- Add a row of toggleable role-filter chips (Admin, Teacher, Parent) above the contacts list, visible only to admin users.
- When one or more role filters are active, the contacts list fetches and renders only contacts whose role matches the active filters.
- Filters are independent toggles: activating multiple roles shows contacts from all selected roles; deactivating all filters restores the full list.
- The existing name search continues to work on top of whatever role filter is active.
- The query hook is extended to accept an optional `role` filter parameter so filtering happens at the data layer, not via client-side array slicing.

## Capabilities

### New Capabilities

- `messages-role-filter`: Toggleable role-filter chips for the messages contacts list, available to admin users only. Each chip maps to a `UserRoles` value; when active it restricts the contacts query to that role.

### Modified Capabilities

- `messages-contacts-list`: The contacts list now accepts an active-role filter that is applied at query time (not as a post-fetch client filter), and the search bar continues to work in combination with any active role filter.

## Impact

- `src/components/messages/MessagesContactsList.tsx` — add role filter chip UI and wire active-role state.
- `src/hooks/UseGetUserContactsQuery.ts` — accept an optional `roleFilter` param and pass it to the query function; update the query key to include the filter value so React Query caches each role separately.
- `src/queries/messages/get-user-contacts.ts` — add an optional `.eq('role', roleFilter)` clause when a role filter is provided.
- `messages/es.json` — add translation keys for the filter chip labels under `MessagesContacts.filter`.
- No new dependencies, no breaking API changes, no schema migrations required.
