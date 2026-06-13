## 1. Route restructure (`/admin-options` → `/admin`)

- [x] 1.1 Move `src/app/admin-options/` to `src/app/admin/` (keep `page.tsx` dashboard intact).
- [x] 1.2 Update tile routes in `src/components/admin/AdminShortcuts.tsx` to `/admin/{groups,children,teachers,parents}`.
- [x] 1.3 Update the admin action route in `src/components/common/ActionButton.tsx` from `/admin-options` to `/admin`.
- [x] 1.4 Grep for any remaining `/admin-options` references and update them; confirm `pnpm build` lists `/admin` routes.

## 2. Localization

- [x] 2.1 Add an `AdminChildren` namespace to `messages/es.json` with: list (`title`, `searchPlaceholder`, `empty`, `parentLabel`), form (`newTitle`, `editTitle`, field labels + placeholders for id/idType, names, lastNames, gender, birthDay, address, groups, and `save`), gender + document-type option labels, detail (`groupsTitle`, `parentsTitle`, identity labels), and toasts (`createSuccess`, `createError`, `updateSuccess`, `updateError`).

## 3. Data layer — queries

- [x] 3.1 Create `src/queries/children/get-children-page.ts` exporting `getChildrenPage(client, { search, offset, pageSize: 20 })` selecting `children` ordered by `last_name, first_name, id`, filtered with `ilike` on name when `search` is set, using `range()` for 20/page; return rows + parent name (join `child_guardians`→`profiles`).
- [x] 3.2 Create `src/queries/children/get-child-by-id.ts` returning a child with related groups (`child_groups`→`groups`) and guardians (`child_guardians`→`profiles`, with email if available).
- [x] 3.3 Create `src/queries/children/create-child.ts` inserting a `children` row (avatar_url null when no image), and linking `child_groups` only when one or more groups are selected.
- [x] 3.4 Create `src/queries/children/update-child.ts` updating a `children` row and reconciling `child_groups` (add/remove diff), including removing all links when none are selected.
- [x] 3.5 Reuse/confirm `getAllGroups` (`src/queries/users/get-all-groups.ts`) for the groups multi-select options.

## 4. Data layer — hooks

- [x] 4.1 Create `src/hooks/UseChildrenListQuery.ts` using `useInfiniteQuery` with query key `['children-list', search]`, `pageSize` 20, `getNextPageParam` based on returned page length, mirroring `UseGetMessagesQuery.ts`.
- [x] 4.2 Create `src/hooks/UseChildByIdQuery.ts` (`useQuery`, key `['child', childID]`).
- [x] 4.3 Create `src/hooks/UseCreateChildMutation.ts` (`useMutation`); on success invalidate `['children-list']`.
- [x] 4.4 Create `src/hooks/UseUpdateChildMutation.ts` (`useMutation`); on success invalidate `['children-list']` and `['child', childID]`.

## 5. Contextual action button

- [x] 5.1 Create `src/components/admin/AdminActionButton.tsx` (`"use client"`) — a floating HeroUI button taking a variant (`add | save | edit`) or an `icon` + `onPress`, with an accessible label from i18n; styled consistently with the existing FAB.

## 6. Children components

- [x] 6.1 Create `src/components/admin/children/ChildrenSearchBar.tsx` (debounced search input wired to the list query term).
- [x] 6.2 Create `src/components/admin/children/ChildListItem.tsx` (avatar + name + parent name row, links to detail).
- [x] 6.3 Create `src/components/admin/children/ChildrenList.tsx` consuming `UseChildrenListQuery`, rendering rows, an IntersectionObserver sentinel to call `fetchNextPage`, and a localized empty state.
- [x] 6.4 Create `src/components/admin/children/ChildForm.tsx` (`"use client"`) — controlled HeroUI inputs. Required: `Select` for document type + gender (enum-backed), `Input` for document number/names/last names/address, date input for birth date. Optional: avatar control (persists null when empty for v1) and a multi-select `Select` for groups (submission must succeed with none selected). No parents/guardians fields. Exposes a submit handler for the Save action button; required-field validation must NOT block on avatar or groups.
- [x] 6.5 Create `src/components/admin/children/ChildGroupsSection.tsx` and `ChildParentsSection.tsx` for the detail screen (groups cards; parent cards with name + email).
- [x] 6.6 Create `src/components/admin/children/ChildDetail.tsx` composing identity fields + groups section + parents section.

## 7. Screens (routes)

- [x] 7.1 Create `src/app/admin/children/page.tsx` — `NavigationBar` (back to `/admin`), localized title, `ChildrenSearchBar` + `ChildrenList`, and `AdminActionButton` variant `add` → `/admin/children/new`.
- [x] 7.2 Create `src/app/admin/children/new/page.tsx` — localized "Add Children" title, `ChildForm`, `AdminActionButton` variant `save` → submit; on success use `UseCreateChildMutation`, show success toast, navigate; on error show error toast.
- [x] 7.3 Create `src/app/admin/children/[childID]/page.tsx` — `ChildDetail` via `UseChildByIdQuery`, `AdminActionButton` variant `edit` → `/admin/children/[childID]/edit`.
- [x] 7.4 Create `src/app/admin/children/[childID]/edit/page.tsx` — `ChildForm` prefilled via `UseChildByIdQuery`, `AdminActionButton` variant `save` → submit; on success use `UseUpdateChildMutation`, show success toast; on error show error toast.

## 8. Toasts

- [x] 8.1 Wire `addToast` (HeroUI) for create success/error and edit success/error using the `AdminChildren` toast keys.

## 9. Verification

- [x] 9.1 Run `pnpm lint` and resolve issues in new files.
- [x] 9.2 Run `pnpm build` to confirm type-check, build, and that `/admin`, `/admin/children`, `/admin/children/new`, `/admin/children/[childID]`, `/admin/children/[childID]/edit` are present.
- [x] 9.3 Confirm RLS: an admin session can read the children list, create, and update; verify `child_groups` writes are permitted (add a policy if missing).
- [ ] 9.4 Manually verify: list loads 20/page with infinite scroll and alphabetical order; search filters; Add creates a child with **only required fields** (no avatar, no groups) → success toast; Add also works with optional groups selected; detail shows identity, groups (possibly empty), parents (possibly empty); Edit updates and can remove all groups (success toast); the action button changes per screen (Add → Save → Edit); all copy is in Spanish from the catalog.
