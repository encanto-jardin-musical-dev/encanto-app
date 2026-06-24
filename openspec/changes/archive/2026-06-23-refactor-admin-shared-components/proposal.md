## Why

The admin Children and Groups modules grew in parallel and now contain large amounts of copy-pasted UI and query logic — the guardians/teachers multi-select, the image picker, the confirm-delete modal, the search bar, the infinite-scroll list, the storage upload helpers, and the link-reconciliation algorithm each exist in two (sometimes three) near-identical copies. This duplication causes drift (e.g. the teacher multi-select already filters orphans differently than the groups one) and means every future entity admin (e.g. teachers, events) restarts from copy-paste. Consolidating now, while only two consumers exist, is the cheapest moment to establish reusable building blocks.

## What Changes

- Extract reusable **UI components** shared by the Children and Groups admin flows:
  - `EntityMultiSelect` — generic multi-select for assigning a set of entities (replaces the bespoke guardians selector in `ChildForm` and teachers selector in `GroupForm`), including consistent orphan-id purging.
  - `ImagePicker` (+ `useImagePicker` hook) — circular/square avatar-or-image picker with the tri-state `File | null | undefined` model and blob-URL cleanup.
  - `ConfirmDeleteModal` — generic delete confirmation modal.
  - `EntityAvatarChip` + `EntityChipSection` — the "avatar circle + name" chip and its wrap-grid section shell used across detail views.
  - `EntityListItemLink` — the list-row link with avatar + title (+ optional subtitle).
- Extract reusable **query/utilities** shared by both modules:
  - `reconcileLinks` helper — the "fetch existing → diff add/remove → insert/delete" join-table reconciliation used for `child_groups`, `child_guardians`, and `group_teachers`.
  - `createImageStorage(bucket, fileLabel)` factory — collapses the near-identical `uploadChildAvatar` / `uploadGroupImage` utilities (validation, upload, signed-URL helpers).
  - `getProfilesByRole(client, role, options)` — collapses `get-available-parents` / `get-available-teachers`.
- Refactor `ChildForm`, `GroupForm`, `ChildDetail`, `GroupDetail`, the children/groups list + search components, the create/update queries, and the storage utilities to consume the shared abstractions.
- **No behavior change**: this is an internal refactor. All existing admin flows (create/edit/delete child and group, multi-teacher assignment, guardian assignment, avatar/image upload, search, infinite scroll) must behave exactly as before.

## Capabilities

### New Capabilities
- `admin-shared-ui`: A library of reusable admin UI components, query helpers, and storage utilities that back the Children and Groups admin modules (and future entity admins), defined by the behavioral contracts each abstraction must preserve.

### Modified Capabilities
<!-- None. This is a behavior-preserving refactor: the requirements of admin-children-management and admin-groups remain unchanged. The shared building blocks are captured as a new admin-shared-ui capability rather than as deltas to existing specs. -->

## Impact

- **Components**: new `src/components/admin/shared/` (or `src/components/common/`) — `EntityMultiSelect`, `ImagePicker`, `ConfirmDeleteModal`, `EntityAvatarChip`, `EntityChipSection`, `EntityListItemLink`; refactor `ChildForm`, `GroupForm`, `ChildDetail`, `GroupDetail`, `ChildParentsSection`, `ChildGroupsSection`, `ChildrenList`/`GroupsList`, `ChildrenSearchBar`/`GroupsSearchBar`, `ChildListItem`/`GroupListItem`, `ConfirmDeleteChildModal`/`ConfirmDeleteGroupModal`.
- **Hooks**: new `useImagePicker`.
- **Queries**: new `src/queries/shared/reconcile-links.ts`, `getProfilesByRole`; refactor `create-child`, `update-child`, `create-group`, `update-group`, `get-available-parents`, `get-available-teachers`.
- **Utils**: new `src/utils/imageStorage.ts` factory; refactor `uploadChildAvatar.ts`, `uploadGroupImage.ts` to thin wrappers (or remove).
- **i18n**: shared components accept namespace/labels via props so existing `AdminChildren` / `AdminGroups` message keys keep working; no key removals.
- **Tests**: no test framework configured — verification is via `pnpm lint`, `pnpm build`, and manual regression of both admin flows.
- **Risk**: purely internal; main risk is behavioral drift during extraction (mitigated by per-component refactor + manual regression checklist).
