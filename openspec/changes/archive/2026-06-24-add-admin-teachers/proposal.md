## Why

Admins can already manage children and groups, and groups can be assigned multiple teachers via `group_teachers` — but there is currently no way to create, view, edit, or delete the teacher profiles themselves. The `/admin/teachers` shortcut already exists in the admin home and the `admin-create-user` edge function is already deployed, yet no client UI consumes them, so the loop is incomplete. This change adds the teacher management module so admins can maintain the roster of teachers that groups depend on.

## What Changes

- Add a **Teachers list** screen at `/admin/teachers` with alphabetical ordering, lazy pagination (20 per page), search by name, and a FAB to add a teacher. Each row shows avatar, name, and role.
- Add an **Add Teacher** screen at `/admin/teachers/new` to create a teacher. Required fields: identity document (type + number), names, last names, role, and email. Phone and avatar are optional; groups assignment is optional. Creation goes through the existing `admin-create-user` edge function (auth invite + `profiles` insert), then assigns selected groups via `group_teachers`.
- Add a **Teacher detail** screen at `/admin/teachers/[teacherID]` showing identity header (name, document, email, phone, role) and the groups the teacher belongs to, with an edit FAB.
- Add a **Edit Teacher** screen at `/admin/teachers/[teacherID]/edit` reusing the teacher form, plus a delete action with a confirmation modal.
- Add the data layer: React Query hooks (`UseTeachersListQuery`, `UseTeacherByIdQuery`, `UseCreateTeacherMutation`, `UseUpdateTeacherMutation`, `UseDeleteTeacherMutation`) and queries under `src/queries/teachers/` operating on `profiles` filtered by `role = 'teacher'`, reusing `reconcileLinks` for `group_teachers`.
- Add teacher avatar storage (a `teacherAvatarStorage` bucket binding + `uploadTeacherAvatar` shim) mirroring the child avatar pattern.
- Add `AdminTeachers` i18n strings under `messages/es.json`.
- Reuse existing shared admin UI (`AdminSearchBar`, `EntityListItemLink`, `EntityMultiSelect`, `ImagePicker`, `ConfirmDeleteModal`, `EntityChipSection`, `AdminActionButton`, `NavigationBar`) — no new generic components introduced.

## Capabilities

### New Capabilities
- `admin-teachers-management`: Admin CRUD for teacher profiles — list with search and lazy loading, create (via admin-create-user edge function with email invite), detail with group memberships, edit, and delete; teacher group assignment reconciled through `group_teachers`.

### Modified Capabilities
<!-- No existing spec requirements change. The teacher form reuses admin-shared-ui behaviors as-is, and group-teachers behavior is unchanged. -->

## Impact

- **New routes**: `src/app/admin/teachers/{page,new/page,[teacherID]/page,[teacherID]/edit/page}.tsx`.
- **New components**: `src/components/admin/teachers/` (`TeachersList`, `TeacherListItem`, `TeachersSearchBar`, `TeacherForm`, `TeacherDetail`, `TeacherGroupsSection`, `ConfirmDeleteTeacherModal`).
- **New hooks**: `src/hooks/UseTeachers*` (list, by-id, create, update, delete mutations, resend-invite mutation).
- **New queries**: `src/queries/teachers/` (`get-teachers-page`, `get-teacher-by-id`, `create-teacher`, `update-teacher`, `delete-teacher`, `resend-teacher-invite`).
- **Storage**: new `teacher-avatars` bucket binding in `src/utils/imageStorage.ts` + `src/utils/uploadTeacherAvatar.ts`; bucket must exist in Supabase.
- **Edge functions**: client invokes the existing `admin-create-user` function (admin-only, invite email + `profiles` row, returns the created profile) and a new `admin-resend-invite` function (admin-only, re-sends the invite email to a pending teacher via `inviteUserByEmail`). Both use `inviteUserByEmail` with `redirectTo: <origin>/auth/callback`. Duplicate-email on create returns `EMAIL_ALREADY_REGISTERED` (HTTP 409) surfaced as a distinct localized toast.
- **Data**: reads/writes `profiles` (role `teacher`) and `group_teachers`; no schema migration required (tables already exist).
- **i18n**: new `AdminTeachers` namespace in `messages/es.json`.
- **Already in place**: `/admin/teachers` shortcut tile, `teachers` tile label, `getProfilesByRole(client, 'teacher')`, `admin-create-user` edge function.
