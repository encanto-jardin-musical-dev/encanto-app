## Why

Admins can already manage children, groups, and teachers, and children can be linked to one or more parents via `child_guardians` (with a per-link relationship) — but there is currently no way for an admin to create, view, edit, or delete the parent profiles themselves. The `admin-create-user` edge function already supports `role: 'parent'`, yet no client UI consumes it for parents, so the parent side of the roster is incomplete. This change adds the parents management module so admins can maintain the parents that children depend on, mirroring the existing teachers module.

## What Changes

- Add a **Parents list** screen at `/admin/parents` with alphabetical ordering, lazy pagination (20 per page), search by name, and a FAB to add a parent. Each row shows avatar, parent name, and child name(s) subtitle.
- Add an **Add Parent** screen at `/admin/parents/new` to create a parent. Required fields: identity document (type + number), names, last names, and email. Phone and avatar are optional. Children assignment is optional and modeled as repeatable `(child + relationship)` rows — mirroring the existing `ChildForm` guardian UI — so a parent can be the father/mother/other of multiple children, each link carrying its own relationship. Creation goes through the existing `admin-create-user` edge function (auth invite + `profiles` insert with `role = 'parent'`), then links the selected children via `child_guardians` carrying each relationship.
- Add a **Parent detail** screen at `/admin/parents/[parentID]` showing an identity header (name, document type + number, email, phone) and the children the parent is linked to (rendered as avatar chips), with an edit FAB.
- Add an **Edit Parent** screen at `/admin/parents/[parentID]/edit` reusing the parent form, plus a delete action with a confirmation modal.
- Add the data layer: React Query hooks (`UseParentsListQuery`, `UseParentByIdQuery`, `UseCreateParentMutation`, `UseUpdateParentMutation`, `UseDeleteParentMutation`, `UseResendParentInviteMutation`) and queries under `src/queries/parents/` operating on `profiles` filtered by `role = 'parent'`, reusing `reconcileLinks` for `child_guardians`, plus a `get-available-children` options query for the children picker.
- Add parent avatar storage (a `parentAvatarStorage` binding + `uploadParentAvatar` shim) mirroring the teacher/child avatar pattern, with a private `parent-avatars` bucket.
- **Relax `admin-resend-invite`** so it accepts any invited non-admin profile (currently hard-restricted to `role = 'teacher'`); the parent client reuses it.
- **Self-service avatar editing**: extend the `teacher-avatars` and `parent-avatars` bucket policies so the owning teacher/parent (path keyed by their profile id) may upload/update/delete **their own** avatar, in addition to admins. This lets teachers and parents change their own avatar image, not only admins.
- Reuse the existing `admin-delete-user` edge function for parent deletion (admin-only, deletes the auth user which cascades to `profiles` and `child_guardians`; children are not deleted).
- Add an `AdminParents` i18n namespace under `messages/es.json`.
- Reuse existing shared admin UI (`AdminSearchBar`, `EntityListItemLink`, `EntityMultiSelect`, `ImagePicker`/`useImagePicker`, `ConfirmDeleteModal`, `EntityChipSection`/`EntityAvatarChip`, `AdminActionButton`, `NavigationBar`), the guardian-row pattern from `ChildForm`, and the existing `admin-create-user` / `admin-delete-user` edge functions — no new generic components introduced.

## Capabilities

### New Capabilities
- `admin-parents-management`: Admin CRUD for parent profiles — list with search and lazy loading, create (via `admin-create-user` edge function with email invite), detail with linked children, edit, delete (via `admin-delete-user`, cascading auth→profiles→child_guardians), and resend invitation; parent↔child links reconciled through `child_guardians` with repeatable `(child, relationship)` rows.

### Modified Capabilities
- `admin-teachers-management`: The teacher avatar storage requirement changes so a teacher MAY edit their own avatar image (not admin-only). The resend-invitation requirement's server operation is generalized to accept any invited non-admin profile (teacher or parent) rather than teacher-only.

## Impact

- **New routes**: `src/app/admin/parents/{page,new/page,[parentID]/page,[parentID]/edit/page}.tsx`.
- **New components**: `src/components/admin/parents/` (`ParentsList`, `ParentListItem`, `ParentsSearchBar`, `ParentForm`, `ParentDetail`, `ParentChildrenSection`, `ConfirmDeleteParentModal`).
- **New hooks**: `src/hooks/UseParents*` (list, by-id, create, update, delete, resend-invite mutations).
- **New queries**: `src/queries/parents/` (`get-parents-page`, `get-parent-by-id`, `create-parent`, `update-parent`, `delete-parent`, `resend-parent-invite`, `get-available-children`).
- **Storage**: new private `parent-avatars` bucket + binding in `src/utils/imageStorage.ts` + `src/utils/uploadParentAvatar.ts`. New RLS policies on `storage.objects` so the owning parent/teacher (path keyed by their profile id) may write their own avatar, alongside the existing admin policies.
- **Edge functions**:
  - `admin-create-user`: invoked with `role: 'parent'` (already supported; no change).
  - `admin-delete-user`: invoked for parent deletion (already supports `teacher`/`parent`, refuses admins, cascades auth→profiles→child_guardians; no change).
  - `admin-resend-invite`: **MODIFIED** — currently restricts the target to `role = 'teacher'` (`.eq('role','teacher')`, "Teacher not found"); relax it to accept any invited non-admin profile (`teacher` or `parent`) and rename/alias the body param to a generic `userId` (keep `teacherId` accepted for backward compatibility). Redeploy.
- **Database**: `child_guardians.guardian_id → profiles` is `ON DELETE CASCADE` (verified), so deleting a parent removes its child links automatically; children rows are unaffected. No schema migration to tables; only new storage RLS policies.
- **i18n**: new `AdminParents` namespace in `messages/es.json`.
- **Already in place**: `admin-create-user` (supports `role: 'parent'`), `admin-delete-user` (supports `parent`, cascade delete), `getProfilesByRole(client, 'parent')`, the `child_guardians` table + `guardian_relationship` enum, and the repeatable guardian-row UI in `ChildForm`. Verify the `/admin/parents` shortcut tile exists and navigates (add if missing).
