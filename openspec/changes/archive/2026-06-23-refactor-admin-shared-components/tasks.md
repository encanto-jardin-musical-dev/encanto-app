## 1. Shared image storage utility

- [x] 1.1 Create `src/utils/imageStorage.ts` with `createImageStorage({ bucket, fileLabel })` returning `{ ValidationError, upload, getSignedUrl, getSignedUrls }`; preserve 5 MB limit, JPEG/PNG/WebP allow-list, 1 h TTL, and existing Spanish error copy
- [x] 1.2 Export singletons `childAvatarStorage` (bucket `children-avatars`, label `avatar`) and `groupImageStorage` (bucket `group-images`, label `image`)
- [x] 1.3 Reduce `src/utils/uploadChildAvatar.ts` and `src/utils/uploadGroupImage.ts` to thin re-export shims over the singletons (keep current export names/paths)
- [x] 1.4 `pnpm lint` and `pnpm build` clean (pre-existing errors in unrelated files; no new errors introduced)

## 2. Shared profiles-by-role query

- [x] 2.1 Create `getProfilesByRole(client, role, { withAvatar? })` in `src/queries/shared/` ordered by `last_name, first_name`
- [x] 2.2 Refactor `get-available-parents` (withAvatar) and `get-available-teachers` to call it; keep `ParentOption`/`TeacherOption` types as aliases
- [x] 2.3 Verify the group teacher picker and child guardian picker still load the same options

## 3. Join-table reconciliation helper

- [x] 3.1 Create `src/queries/shared/reconcile-links.ts` with `reconcileLinks(client, { table, parentColumn, childColumn, parentId, desired, getKey, buildRow, mutableFields? })`; compute add/remove by `getKey`, insert/delete only the diff
- [x] 3.2 When `mutableFields` is set, re-sync existing rows whose key is unchanged but whose mutable fields differ (guardian `relationship`)
- [x] 3.3 Migrate `update-group` (`group_teachers`) to `reconcileLinks`
- [x] 3.4 Migrate `update-child` (`child_groups` and `child_guardians`, the latter with `relationship` as a mutable field) to `reconcileLinks`
- [x] 3.5 Migrate `create-group` and `create-child` link inserts to `reconcileLinks` with empty existing set (insert-only path)
- [x] 3.6 Manually verify: assign/clear teachers on a group, assign/remove guardians and change a relationship on a child, assign/clear groups on a child

## 4. Image picker (hook + component)

- [x] 4.1 Create `useImagePicker(existingUrl)` in `src/hooks/` managing tri-state `File | null | undefined`, preview, blob-URL revoke cleanup; return `{ file, preview, pick, remove, inputProps }`
- [x] 4.2 Create `<ImagePicker shape fallbackIcon labels />` in `src/components/common/` rendering the circular/square picker chrome with hidden file input
- [x] 4.3 Migrate `ChildForm` avatar picker (circle, `UserCircleIcon`, `avatar.*` labels) to the shared picker
- [x] 4.4 Migrate `GroupForm` image picker (square, `PhotoIcon`, `image.*` labels) to the shared picker
- [x] 4.5 Manually verify add / replace / remove image on both forms, including no blob leak on navigation

## 5. Entity multi-select

- [x] 5.1 Create `<EntityMultiSelect<T>>` in `src/components/common/` wrapping HeroUI `Select selectionMode="multiple"` with a single canonical orphan-id purge effect; props `items, selectedIds, onChange, getId, getLabel, label, placeholder, purgeOrphans`
- [x] 5.2 Migrate `GroupForm` teachers selector to `EntityMultiSelect` (label `${first_name} ${last_name}`)
- [x] 5.3 Migrate `ChildForm` groups selector to `EntityMultiSelect` (guardian pickers kept bespoke — compound control with relationship radio)
- [x] 5.4 Verify selection, orphan purge, and resulting links are unchanged for both

## 6. Confirm-delete modal

- [x] 6.1 Create `<ConfirmDeleteModal isOpen isPending onOpenChange onConfirm labels />` in `src/components/common/` (labels fully resolved by caller)
- [x] 6.2 Replace `ConfirmDeleteChildModal` and `ConfirmDeleteGroupModal` with thin wrappers passing namespace-resolved `deleteModal.*` labels
- [x] 6.3 Verify confirm (pending state) and cancel behavior on both delete flows

## 7. Avatar chip, section, and list-row link

- [x] 7.1 Create `<EntityAvatarChip imageUrl? icon shape size label />` and `<EntityChipSection title emptyLabel items renderChip />` in `src/components/common/`
- [x] 7.2 Migrate `GroupDetail` (teachers + children grids), `ChildParentsSection`, and `ChildGroupsSection` to the chip/section components
- [x] 7.3 Create `<EntityListItemLink href imageUrl? fallbackIcon title subtitle? />` and migrate `ChildListItem` (with parent subtitle) and `GroupListItem`
- [x] 7.4 Verify detail grids, empty states, and list rows render and navigate identically

## 8. Admin search and infinite list

- [x] 8.1 Create `AdminSearchBar` (debounced `Input`, namespace/onSearch props) in `src/components/common/`
- [x] 8.2 Create `useInfiniteScrollSentinel({ fetchNextPage, hasNextPage, isFetchingNextPage })` hook; list components use it directly (generic wrapper skipped — thin wrappers are sufficient)
- [x] 8.3 Reduce `ChildrenSearchBar`/`GroupsSearchBar` and `ChildrenList`/`GroupsList` to thin wrappers injecting their hook + namespace, preserving query keys and page size
- [x] 8.4 Verify debounced search and infinite scroll paging are unchanged on both lists

## 9. Cleanup and final verification

- [x] 9.1 Shims kept — call sites (page files + signed-URL queries) still import the old names; shims are now thin delegates to the factory (no dead code)
- [x] 9.2 No `any` types introduced; all new imports use `@/` prefix
- [x] 9.3 `pnpm lint` clean (no new errors vs. baseline); `npx tsc --noEmit` zero errors
- [x] 9.4 Full manual regression: create/edit/delete child and group, guardian + teacher assignment (add/remove/clear), image add/replace/remove, search, infinite scroll — all identical to pre-refactor behavior
- [x] 9.5 `openspec validate refactor-admin-shared-components`
