## 0. Edge Function Invite Redirect

- [x] 0.1 In `supabase/functions/admin-create-user/index.ts`, pass `{ redirectTo: <origin>/auth/callback }` to `inviteUserByEmail` so the invite magic link routes through the app's `/auth/callback` handler; the origin is resolved from the request `Origin` header (falls back to `SITE_URL` env var)
- [x] 0.2 Redeploy the `admin-create-user` edge function and verify an invite email is delivered and its link lands on `/auth/callback`
- [x] 0.3 Create `supabase/functions/admin-resend-invite/index.ts` (reuse `_shared` `createServiceClient`, `getAuthenticatedUser`, `cors`): accept `{ teacherId }`, verify caller is admin, load the `profiles` row and confirm `role = 'teacher'`, then call `auth.admin.getUserById(teacherId)` to resolve the teacher's email and confirmation state
- [x] 0.4 In `admin-resend-invite`, if `getUserById` shows the user is already confirmed (`confirmed_at`/`last_sign_in_at` set), return an "already active" result (no email); otherwise call `auth.admin.inviteUserByEmail(email, { redirectTo: <origin>/auth/callback })` to re-send the invite email; deploy the function
- [x] 0.5 Confirm invite email delivery: `inviteUserByEmail` sends the email automatically via the hosted email provider; verified that the magic link in the email routes to `/auth/callback`

## 1. Storage & Avatar Plumbing

- [x] 1.1 Provision a private `teacher-avatars` Supabase storage bucket with admin read/write policies (mirror `children-avatars`); verify in the Supabase dashboard
- [x] 1.2 Add `teacherAvatarStorage = createImageStorage({ bucket: 'teacher-avatars', fileLabel: 'avatar' })` to `src/utils/imageStorage.ts`
- [x] 1.3 Create `src/utils/uploadTeacherAvatar.ts` mirroring `uploadChildAvatar.ts` (`uploadTeacherAvatar`, `getTeacherAvatarSignedUrl(s)`, `AvatarValidationError`)

## 2. Query Layer (`src/queries/teachers/`)

- [x] 2.1 Create `get-teachers-page.ts`: select `profiles` where `role = 'teacher'`, ordered by `last_name, first_name`, `.range(offset, offset+19)`, `.or('first_name.ilike.%term%,last_name.ilike.%term%')` for search, resolve avatar signed URLs; export `TeacherListRow` type
- [x] 2.2 Create `get-teacher-by-id.ts`: select the profile `.eq('id', id).eq('role','teacher')` with embedded `group_teachers -> groups`, resolve avatar signed URL; export `TeacherDetail` type
- [x] 2.3 Create `create-teacher.ts`: invoke `admin-create-user` edge function via `supabase.functions.invoke` with `{ email, role: 'teacher', first_name, last_name, document_type, document_number, phone }`; the function sends the invite email and returns the created profile; return the profile id; export `CreateTeacherParams`
- [x] 2.4 Extend create flow to assign groups: after invoke, use `reconcileLinks` on `group_teachers` (`parentColumn: 'teacher_id'`, `childColumn: 'group_id'`) for selected `groupIds`
- [x] 2.5 Create `update-teacher.ts`: `update(profiles).eq('id', id)` for editable fields (no email), then `reconcileLinks` on `group_teachers`; export `UpdateTeacherParams`
- [x] 2.6 Create `delete-teacher.ts`: `from('profiles').delete().eq('id', id)` with explicit error handling
- [x] 2.7 Create `resend-teacher-invite.ts`: invoke `admin-resend-invite` via `supabase.functions.invoke` with `{ teacherId }`; return a result distinguishing "sent" vs. "already active"; export the result type

## 3. React Query Hooks (`src/hooks/`)

- [x] 3.1 Create `UseTeachersListQuery.ts` (infinite query, page size 20, query key `['teachers-list', search]`)
- [x] 3.2 Create `UseTeacherByIdQuery.ts` (`['teacher', teacherID]`, enabled when id present)
- [x] 3.3 Create `UseCreateTeacherMutation.ts` (invalidate `['teachers-list']` on success)
- [x] 3.4 Create `UseUpdateTeacherMutation.ts` (invalidate `['teachers-list']` and `['teacher', id]`)
- [x] 3.5 Create `UseDeleteTeacherMutation.ts` (invalidate `['teachers-list']`, remove `['teacher', id]`)
- [x] 3.6 Create `UseResendTeacherInviteMutation.ts` wrapping `resend-teacher-invite` (no cache invalidation; surfaces sent/already-active result to the caller)

## 4. Components (`src/components/admin/teachers/`)

- [x] 4.1 Create `TeachersSearchBar.tsx` wrapping the shared `AdminSearchBar` (debounced, clearable)
- [x] 4.2 Create `TeacherListItem.tsx` using shared `EntityListItemLink` (avatar, name, role subtitle)
- [x] 4.3 Create `TeachersList.tsx` using `UseTeachersListQuery` + infinite-scroll sentinel, flatten pages, render items, empty state
- [x] 4.4 Create `TeacherForm.tsx` (forwardRef + `useImperativeHandle` exposing `submit()`/`getValues()`): fields document type (adult subset `cc/passport/international_id/other`) + number, names, last names, role (Select), groups (`EntityMultiSelect`), email (create-only, required), phone (optional), avatar (`ImagePicker`/`useImagePicker`); manual validation; load group options via `getAllGroups`
- [x] 4.5 Make `TeacherForm` hide/disable the email field in edit mode and support `defaultValues`
- [x] 4.6 Create `TeacherGroupsSection.tsx` using shared `EntityChipSection` + `EntityAvatarChip`
- [x] 4.7 Create `TeacherDetail.tsx` using `UseTeacherByIdQuery`: loading/empty states, identity header (avatar, name, document, email, phone, role), `TeacherGroupsSection`
- [x] 4.8a Add a "Resend invitation" action to `TeacherDetail.tsx` (HeroUI `Button`) wired to `UseResendTeacherInviteMutation`, showing a localized success toast when sent, an informational toast when the teacher is already active, and an error toast on failure
- [x] 4.8 Create `ConfirmDeleteTeacherModal.tsx` wrapping shared `ConfirmDeleteModal` with resolved i18n labels

## 5. Routes (`src/app/admin/teachers/`)

- [x] 5.1 Create `page.tsx` (list): `NavigationBar` (back to `/admin`), `TeachersSearchBar`, `TeachersList`, `AdminActionButton variant="add"` routing to `/admin/teachers/new` (pass `namespace="AdminTeachers"`)
- [x] 5.2 Create `new/page.tsx` (create): owns `formRef`, runs validation, uploads avatar after create (using returned profile id), calls `UseCreateTeacherMutation`, success/error toasts, navigates to detail
- [x] 5.3 Create `[teacherID]/page.tsx` (detail): `TeacherDetail` + `AdminActionButton variant="edit"` routing to `/edit`
- [x] 5.4 Create `[teacherID]/edit/page.tsx` (edit): reuse `TeacherForm` with mapped `defaultValues`, avatar tri-state handling, `UseUpdateTeacherMutation`, plus `TrashIcon` in `NavigationBar` rightElement opening `ConfirmDeleteTeacherModal` wired to `UseDeleteTeacherMutation`

## 6. Internationalization

- [x] 6.1 Add an `AdminTeachers` namespace to `messages/es.json` (list title, search placeholder, add/edit/detail titles, field labels, role/document labels, toasts, empty states, delete confirmation strings, resend-invitation label + sent/already-active/error toasts) mirroring the `AdminChildren` block
- [x] 6.2 Verify the existing `/admin/teachers` shortcut tile and `teachers` tile label resolve and navigate correctly

## 7. Verification

- [x] 7.1 Run `pnpm lint` and resolve any issues; ensure strict TypeScript (no `any`) and generated DB types are used
- [x] 7.2 Manual: list loads alphabetically, paginates on scroll, search filters, empty state shows
- [x] 7.3 Manual: create a teacher with only required fields and one with avatar + groups; verify the invitation email is received, its link reaches `/auth/callback`, avatar is saved to the profile, and success toasts + navigation to detail occur; verify a duplicate email shows the localized "already registered" toast
- [x] 7.4 Manual: detail shows identity + group memberships; edit updates fields/groups/avatar (incl. removal); email not editable
- [x] 7.5 Manual: delete with confirmation removes the teacher and navigates to the list; cancel and failure paths behave per spec
- [x] 7.5a Manual: "Resend invitation" re-sends the email for a pending teacher (success toast) and reports "already active" for a teacher who has logged in; non-admin callers are rejected by the function
- [x] 7.6 Run `openspec validate add-admin-teachers --strict`
