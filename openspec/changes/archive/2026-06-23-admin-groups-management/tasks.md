## 1. Storage & i18n setup

- [x] 1.1 Add a Supabase migration creating a private `group-images` bucket with admin-write / authenticated-read RLS (model on `20260613100000_create_children_avatars_bucket.sql`)
- [x] 1.2 Add `src/utils/uploadGroupImage.ts` with `uploadGroupImage`, `getGroupImageSignedUrl`, and `getGroupImageSignedUrls` (mirror `uploadChildAvatar.ts`)
- [x] 1.3 Add an `AdminGroups` namespace to `messages/es.json` (list: title/searchPlaceholder/empty; form: newTitle/editTitle/name/image/teacher/save/validation; detail: teacherTitle/childrenTitle/noTeacher/noChildren; toasts: create/update/delete success+error; actions: delete)

## 2. Query layer (`src/queries/groups/`)

- [x] 2.1 `get-groups-page.ts` — paginated `id, name, image_url` with `ilike` name search, ordered by name; resolve `image_url` to signed URLs (mirror `get-children-page.ts`)
- [x] 2.2 `get-group-by-id.ts` — group fields + joined teacher profile + member children via `child_groups(children(...))`, resolving image/avatar paths to signed URLs
- [x] 2.3 `get-available-teachers.ts` — `profiles` where `role = 'teacher'`, returning `{ id, first_name, last_name }` (mirror `get-available-parents.ts`)
- [x] 2.4 `create-group.ts` — insert `{ name, image_url, teacher_id }`, return new id
- [x] 2.5 `update-group.ts` — update `{ name, image_url?, teacher_id }` by id
- [x] 2.6 `delete-group.ts` — delete group by id

## 3. Hooks (`src/hooks/`)

- [x] 3.1 `UseGroupsListQuery.ts` — `useInfiniteQuery`, key `['groups-list', search]`, PAGE_SIZE 20
- [x] 3.2 `UseGroupByIdQuery.ts` — `useQuery`, key `['group', groupID]`, enabled on id
- [x] 3.3 `UseCreateGroupMutation.ts` — invalidate `['groups-list']`
- [x] 3.4 `UseUpdateGroupMutation.ts` — invalidate `['groups-list']` and `['group', id]`
- [x] 3.5 `UseDeleteGroupMutation.ts` — invalidate `['groups-list']`

## 4. Components (`src/components/admin/groups/`)

- [x] 4.1 `GroupsSearchBar.tsx` — debounced search input (mirror `ChildrenSearchBar`)
- [x] 4.2 `GroupListItem.tsx` — image/placeholder + name, links to `/admin/groups/{id}`
- [x] 4.3 `GroupsList.tsx` — infinite list with IntersectionObserver sentinel and empty state
- [x] 4.4 `GroupForm.tsx` + `GroupFormRef` — image picker, required name input, optional teacher `Select`; `submit()`/`getValues()` imperative handle (mirror `ChildForm` minus guardians)
- [x] 4.5 `GroupDetail.tsx` — image + name header, teacher section, children grid (read-only), no-teacher/no-children fallbacks
- [x] 4.6 `ConfirmDeleteGroupModal.tsx` — confirmation dialog (mirror `ConfirmDeleteChildModal`)

## 5. Routes (`src/app/admin/groups/`)

- [x] 5.1 `page.tsx` — list screen: `NavigationBar` (back `/admin`) + `GroupsSearchBar` + `GroupsList` + `AdminActionButton variant="add"` → `/admin/groups/new`
- [x] 5.2 `new/page.tsx` — create: `GroupForm` + save handler (upload image, create, navigate to detail) + `AdminActionButton variant="save"`
- [x] 5.3 `[groupID]/page.tsx` — detail: `GroupDetail` + `AdminActionButton variant="edit"` → edit route
- [x] 5.4 `[groupID]/edit/page.tsx` — edit: pre-filled `GroupForm` + save/delete handlers + `ConfirmDeleteGroupModal`

## 6. Verification

- [x] 6.1 Confirm `/admin/groups` shortcut on the Admin Options dashboard reaches the new list
- [x] 6.2 Run `pnpm lint` and resolve any issues
- [x] 6.3 Manually walk the flow: create (name only, and name+image+teacher) → list/search → detail → edit → delete
