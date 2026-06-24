## 0. Edge Function Changes

- [x] 0.1 Verify `supabase/functions/admin-create-user/index.ts` accepts `role: 'parent'` end-to-end (it already declares `'teacher' | 'parent'`); confirm a parent invite email is delivered and its link lands on `/auth/callback`
- [x] 0.2 Verify `supabase/functions/admin-delete-user/index.ts` handles `role = 'parent'` (it already allows `teacher`/`parent` and refuses `admin`); confirm deleting a parent removes the auth user, cascades to `profiles`, and removes the parent's `child_guardians` links while leaving `children` rows intact
- [x] 0.3 Relax `supabase/functions/admin-resend-invite/index.ts`: change the target lookup from `.eq('role','teacher')` to allow `role IN ('teacher','parent')` (still refuse `admin`); accept the target id under a new `userId` field while keeping `teacherId` accepted for backward compatibility; keep the admin guard, `getUserById`, "already active" short-circuit, and `inviteUserByEmail` resend unchanged
- [x] 0.4 Redeploy `admin-resend-invite`; smoke-test that an existing teacher resend (sending `teacherId`) still works and a parent resend (sending `userId`) works

## 1. Storage, Buckets & Avatar Policies

- [x] 1.1 Provision a private `parent-avatars` Supabase storage bucket
- [x] 1.2 Add admin policies to `parent-avatars` (INSERT/UPDATE/DELETE gated by `is_admin(auth.uid())`) and an authenticated SELECT policy, mirroring `teacher-avatars`
- [x] 1.3 Add owner-by-path policies to `parent-avatars` allowing INSERT/UPDATE/DELETE when `bucket_id = 'parent-avatars' AND (storage.foldername(name))[1] = auth.uid()::text`
- [x] 1.4 Add the equivalent owner-by-path INSERT/UPDATE/DELETE policies to the existing `teacher-avatars` bucket (so teachers can edit their own avatar); leave the existing admin and authenticated-read policies intact
- [x] 1.5 Manually verify in Supabase: an admin can write any avatar; a teacher/parent can write only their own profile-id folder and is rejected on another user's folder
- [x] 1.6 Add `parentAvatarStorage = createImageStorage({ bucket: 'parent-avatars', fileLabel: 'avatar' })` to `src/utils/imageStorage.ts`
- [x] 1.7 Create `src/utils/uploadParentAvatar.ts` mirroring `uploadTeacherAvatar.ts` (`uploadParentAvatar`, `getParentAvatarSignedUrl(s)`, `AvatarValidationError`)

## 2. Query Layer (`src/queries/parents/`)

- [x] 2.1 Create `get-available-children.ts`: select `children` ordered by `last_name, first_name`, returning `{ id, first_name, last_name, avatar_url? }` options for the child pickers; export the option type
- [x] 2.2 Create `get-parents-page.ts`: select `profiles` where `role = 'parent'`, ordered by `last_name, first_name`, `.range(offset, offset+19)`, `.or('first_name.ilike.%term%,last_name.ilike.%term%')` for search, embed `child_guardians -> children` to derive linked child name(s), resolve avatar signed URLs; export `ParentListRow` type
- [x] 2.3 Create `get-parent-by-id.ts`: select the profile `.eq('id', id).eq('role','parent')` with embedded `child_guardians -> children` (child id, names, avatar, relationship), resolve avatar signed URLs; export `ParentDetail` type and a `ChildLinkEntry = { child_id, relationship }` shape for the form
- [x] 2.4 Create `create-parent.ts`: invoke `admin-create-user` via `supabase.functions.invoke` with `{ email, role: 'parent', first_name, last_name, document_type, document_number, phone }`; parse `EMAIL_ALREADY_REGISTERED` from the error context; return the created profile id; export `CreateParentParams` (including `children?: ChildLinkEntry[]`)
- [x] 2.5 Extend the create flow: after invoke, use `reconcileLinks` on `child_guardians` (`parentColumn: 'guardian_id'`, `childColumn: 'child_id'`, `getKey: (e) => e.child_id`, `buildRow: ({ child_id, relationship }) => ({ guardian_id: parentId, child_id, relationship })`)
- [x] 2.6 Create `update-parent.ts`: `update(profiles).eq('id', id).eq('role','parent')` for editable fields (no email), then `reconcileLinks` on `child_guardians` with the per-row relationship; export `UpdateParentParams` (`children: ChildLinkEntry[]`)
- [x] 2.7 Create `delete-parent.ts`: invoke `admin-delete-user` via `supabase.functions.invoke` with `{ userId: parentId }` (cascade handles `child_guardians`); explicit error handling
- [x] 2.8 Create `resend-parent-invite.ts`: invoke `admin-resend-invite` via `supabase.functions.invoke` with `{ userId: parentId }`; return a result distinguishing "sent" vs. "already active"; export the result type

## 3. React Query Hooks (`src/hooks/`)

- [x] 3.1 Create `UseParentsListQuery.ts` (infinite query, page size 20, query key `['parents-list', search]`)
- [x] 3.2 Create `UseParentByIdQuery.ts` (`['parent', parentID]`, enabled when id present)
- [x] 3.3 Create `UseCreateParentMutation.ts` (invalidate `['parents-list']` on success)
- [x] 3.4 Create `UseUpdateParentMutation.ts` (invalidate `['parents-list']` and `['parent', id]`)
- [x] 3.5 Create `UseDeleteParentMutation.ts` (invalidate `['parents-list']`, remove `['parent', id]`)
- [x] 3.6 Create `UseResendParentInviteMutation.ts` wrapping `resend-parent-invite` (no cache invalidation; surfaces sent/already-active result to the caller)

## 4. Components (`src/components/admin/parents/`)

- [x] 4.1 Create `ParentsSearchBar.tsx` wrapping the shared `AdminSearchBar` (debounced, clearable)
- [x] 4.2 Create `ParentListItem.tsx` using shared `EntityListItemLink` (avatar, parent name, linked child name(s) subtitle)
- [x] 4.3 Create `ParentsList.tsx` using `UseParentsListQuery` + infinite-scroll sentinel, flatten pages, render items, empty state
- [x] 4.4 Decide whether to extract the `(picker + relationship)` row block from `ChildForm` into a shared component (e.g. `EntityRelationshipRow`) for reuse, or replicate the inverted `(child + relationship)` variant in `ParentForm`; prefer extraction if low-risk
- [x] 4.5 Create `ParentForm.tsx` (forwardRef + `useImperativeHandle` exposing `submit()`/`getValues()`): fields document type (adult subset `cc/passport/international_id/other`) + number, names, last names, email (create-only, required), phone (optional), avatar (`ImagePicker`/`useImagePicker`), and a repeatable list of `(child picker + relationship)` rows over `get-available-children`; prevent the same child appearing twice; validate each row has a child and relationship
- [x] 4.6 Make `ParentForm` hide/disable the email field in edit mode and support `defaultValues` (pre-filled child rows from existing `child_guardians`)
- [x] 4.7 Create `ParentChildrenSection.tsx` using shared `EntityChipSection` + `EntityAvatarChip` to render linked children as avatar chips (mirror `ChildParentsSection`)
- [x] 4.8 Create `ParentDetail.tsx` using `UseParentByIdQuery`: loading/empty states, identity header (avatar, name, document type + number, email, phone), `ParentChildrenSection`
- [x] 4.9 Add a "Resend invitation" action to `ParentDetail.tsx` (HeroUI `Button`) wired to `UseResendParentInviteMutation`, showing a localized success toast when sent, an informational toast when already active, and an error toast on failure
- [x] 4.10 Create `ConfirmDeleteParentModal.tsx` wrapping shared `ConfirmDeleteModal` with resolved i18n labels

## 5. Routes (`src/app/admin/parents/`)

- [x] 5.1 Create `page.tsx` (list): `NavigationBar` (back to `/admin`), `ParentsSearchBar`, `ParentsList`, `AdminActionButton variant="add"` routing to `/admin/parents/new` (pass `namespace="AdminParents"`)
- [x] 5.2 Create `new/page.tsx` (create): owns `formRef`, runs validation, uploads avatar after create (using the returned profile id), calls `UseCreateParentMutation`, success/error/duplicate-email toasts, navigates to detail
- [x] 5.3 Create `[parentID]/page.tsx` (detail): `ParentDetail` + `AdminActionButton variant="edit"` routing to `/edit`
- [x] 5.4 Create `[parentID]/edit/page.tsx` (edit): reuse `ParentForm` with mapped `defaultValues` (child rows from `child_guardians`), avatar tri-state handling, `UseUpdateParentMutation`, plus `TrashIcon` in `NavigationBar` rightElement opening `ConfirmDeleteParentModal` wired to `UseDeleteParentMutation`

## 6. Internationalization

- [x] 6.1 Add an `AdminParents` namespace to `messages/es.json` (list title, search placeholder, add/edit/detail titles, field labels — including the child-row picker, relationship `father/mother/other` labels, add/remove child actions — document labels, toasts, empty states, delete confirmation strings, resend-invitation label + sent/already-active/error toasts) mirroring the `AdminTeachers` block and reusing `AdminChildren.form.parents.relationship` labels where appropriate
- [x] 6.2 Verify the `/admin/parents` shortcut tile and `parents` tile label resolve and navigate correctly (add the tile if missing)

## 7. Verification

- [x] 7.1 Run `pnpm lint` and resolve any issues; ensure strict TypeScript (no `any`) and generated DB types are used
- [x] 7.2 Manual: list loads alphabetically, paginates on scroll, search filters, empty state shows, and rows show linked child name(s)
- [x] 7.3 Manual: create a parent with only required fields and one linked to two children with distinct relationships (e.g. father of one, mother of another) plus an avatar; verify the invitation email is received, its link reaches `/auth/callback`, `child_guardians` rows are written with the parent id as `guardian_id` and the per-row relationship, avatar is saved, success toasts + navigation to detail occur; verify a duplicate email shows the localized "already registered" toast
- [x] 7.4 Manual: detail shows identity + linked children chips; edit adds/removes child rows and changes a relationship, updates avatar (incl. removal); email not editable
- [x] 7.5 Manual: delete with confirmation removes the parent (auth + profile) and its `child_guardians` links, leaves the children, navigates to the list; cancel and failure paths behave per spec; a non-admin caller is rejected by `admin-delete-user`
- [x] 7.6 Manual: "Resend invitation" re-sends the email for a pending parent (success toast) and reports "already active" for a parent who has logged in; non-admin callers are rejected
- [x] 7.7 Manual: a signed-in teacher and a signed-in parent can each change their own avatar; neither can write another user's avatar folder
- [x] 7.8 Run `openspec validate add-admin-parents --strict`
