## Context

The admin area already ships three complete CRUD modules — `children`, `groups`, and `teachers` — that share an identical architecture: `"use client"` App Router pages, controlled-state `forwardRef`/`useImperativeHandle` forms (no form library), React Query hooks in `src/hooks/`, plain async query functions in `src/queries/<domain>/`, private Supabase storage buckets with signed URLs, and shared UI in `src/components/common/` + `src/components/admin/`.

Like teachers, **parents are NOT a separate table**: a parent is a `profiles` row with `role = 'parent'`. The `admin-create-user` edge function (admin-only, invites an auth user and inserts the `profiles` row with rollback) already supports `role: 'parent'` and is deployed. The `admin-resend-invite` edge function already exists for re-issuing invites.

The one domain difference from teachers is the relationship table: teachers link to groups via `group_teachers` (a plain join), whereas parents link to children via **`child_guardians`**, which carries a third column — `relationship` (enum `guardian_relationship`: `father | mother | other`). So a parent↔child link is not a plain pair; it is a `(child_id, guardian_id, relationship)` triple. The same `child_guardians` table is already written from the child side in `create-child.ts`/`update-child.ts` via `reconcileLinks` using `guardian_id`; this change writes it from the parent side using the parent's profile id as `guardian_id`. The existing `ChildForm` already implements the exact UX needed here — a list of repeatable `(parent + relationship)` rows where one parent can be father/mother/other — so the parent form mirrors it inverted as `(child + relationship)` rows.

Two existing edge functions cover the auth-coupled operations: `admin-delete-user` already deletes a `teacher`/`parent` auth user (cascading to `profiles` and, via `ON DELETE CASCADE` on `child_guardians.guardian_id`, to the child links) while refusing to delete admins; `admin-resend-invite` re-issues an invite but is currently hard-restricted to `role = 'teacher'`.

This change adds the parents module by mirroring the `teachers` module as closely as possible to preserve DRY/SOLID and behavioral consistency, accounting for the relationship-carrying link.

## Goals / Non-Goals

**Goals:**
- Parent list/create/detail/edit/delete that visually and behaviorally matches the existing `teachers` module.
- Reuse every existing shared abstraction (`AdminSearchBar`, `EntityListItemLink`, `EntityMultiSelect`, `ImagePicker`/`useImagePicker`, `ConfirmDeleteModal`, `EntityChipSection`/`EntityAvatarChip`, `AdminActionButton`, `NavigationBar`, `reconcileLinks`, `getProfilesByRole`, `imageStorage` factory) — introduce no new generic components.
- Route parent creation through the existing `admin-create-user` edge function (`role: 'parent'`) so auth + profile stay consistent and the invite email is sent.
- Operate on `profiles` filtered by `role = 'parent'` for list/detail/update/delete, and on `child_guardians` for child assignment with relationship.

**Non-Goals:**
- No changes to `child_guardians` schema or the `children` module's own parent-assignment UI.
- No persisted account-status tracking (invited vs. active) — identical to the teachers decision; status lives in `auth.users` and is learned on demand via "Resend invitation".
- No email/password management UI — the invite flow (magic-link email) is the account-setup path.
- No new fields on `profiles`; no table schema migration; no new `guardian_relationship` enum values.
- No bulk import, deactivation, or audit-log features.
- No new generic delete edge function — reuse `admin-delete-user` as-is.
- No deletion of `children` rows when a parent is deleted — only the `child_guardians` links are removed (by cascade).
- No self-service profile-field editing for teachers/parents in this change — the only owner-writable resource added is their own avatar object in storage.

## Decisions

### 1. Parent creation via the existing `admin-create-user` edge function (`role: 'parent'`)
`profiles.id` must equal a Supabase Auth user id, so the client invokes `admin-create-user` via `supabase.functions.invoke('admin-create-user', { body: { ..., role: 'parent' } })`. The function validates the caller is admin, calls `auth.admin.inviteUserByEmail` (sending the invite magic link, `redirectTo: <origin>/auth/callback`), inserts the `profiles` row, rolls back the auth user on failure, and returns the created `profiles` row. **Creating a parent therefore always sends the invitation email** as part of the same operation.
- **Why:** Reuses tested, secure, transactional server logic already supporting `parent`; one admin action = parent created + invited.
- **Alternative considered:** Direct `profiles` insert with a client-generated UUID — rejected (orphans the row from auth, can't send the setup email).
- **Consequence:** `email` is a **required, create-only** field (the function requires it; it is not stored on `profiles`, so it cannot be edited later). Child assignment happens client-side after invoke using the returned `profile.id` as `guardian_id`.

### 2. Child assignment via repeatable `(child + relationship)` rows
`child_guardians.relationship` is **per-link**, so each linked child carries its own relationship. Rather than the wireframe's single dropdown, the parent form mirrors the proven `ChildForm` guardian UI inverted: a list of `(child picker + relationship selector)` rows, one row per linked child, with an "+ Add child" action. Each row produces a `ChildLinkEntry = { child_id, relationship }`; the parent↔child links are written as `{ child_id, guardian_id: parentId, relationship }` rows via `reconcileLinks` on `child_guardians` (`parentColumn: 'guardian_id'`, `childColumn: 'child_id'`, `getKey: (e) => e.child_id`), the exact inverse of how `create-child.ts` reconciles guardians.
- **Why:** Honors the per-link `relationship` column and the real-world need (a parent is father/mother/other to different children). Reuses the existing, validated guardian-row interaction and the `guardian_relationship` enum — DRY with `ChildForm`. The single-dropdown wireframe is a simplification; the per-row model is a strict superset that still renders cleanly with one child.
- **Alternative considered:** A children multiselect + one shared relationship dropdown (literal wireframe). Rejected because it cannot express different relationships per child and would need re-work the moment a parent has two children with different roles.
- **Consequence:** On edit, the row list is pre-filled from the parent's existing `child_guardians`; reconciliation inserts new links, removes deleted ones, and updates the `relationship` of kept links.
- **Reuse opportunity:** the `(picker + relationship)` row block in `ChildForm` could be extracted into a shared `GuardianLinkRow`/`EntityRelationshipRow` component used by both forms; if extraction is low-risk, do it (SOLID), otherwise replicate the inverted variant and note the duplication for a later refactor.

### 3. Update is a direct `profiles` write; delete reuses `admin-delete-user`
Edit is an ordinary RLS-guarded write: `update(profiles).eq('id', id).eq('role','parent')`, mirroring `update-teacher`. Email is not editable (it lives in auth). Child links are reconciled via `child_guardians`.

**Delete is NOT a plain `profiles` delete** — it reuses the existing `admin-delete-user` edge function (`supabase.functions.invoke('admin-delete-user', { body: { userId: parentId } })`), exactly like `deleteTeacher`. That function: verifies the caller is admin, refuses to delete `admin` profiles, allows `teacher`/`parent`, and calls `auth.admin.deleteUser(userId)`. Deleting the auth user cascades to `public.profiles` (FK), and `child_guardians.guardian_id → profiles` is **`ON DELETE CASCADE`** (verified), so the parent's child links are removed automatically. The `children` rows are in a different table and are untouched.
- **Why:** Satisfies "only admin can delete users" and "delete from `auth.users` and `profiles` and remove child relationships, but keep the children." All of this is already implemented and tested for teachers — zero new server code, just reuse.
- **Consequence:** `deleteParent` is a thin wrapper around `admin-delete-user`; no client-side `child_guardians` cleanup is needed (the cascade handles it).

### 4. Resend invitation reuses `admin-resend-invite`, relaxed to accept parents
The detail screen exposes a "Resend invitation" action, invoking `admin-resend-invite`. The function currently loads the target with `.eq('id', id).eq('role','teacher')` and returns "Teacher not found" otherwise, so **it must be relaxed**: accept the target if `role IN ('teacher','parent')` (still refuse `admin`), and accept the id under a generic `userId` field while keeping `teacherId` accepted for backward compatibility with the existing teachers client. Everything else (admin guard, `getUserById`, "already active" short-circuit, `inviteUserByEmail` resend with `redirectTo`) stays unchanged. The parent client invokes it with `{ userId: parentId }`.
- **Why:** Single responsibility, already built and tested; a parent profile is structurally identical (a `profiles` row with an auth user). A minimal role-check + param widening avoids duplicating the function.
- **Backward compatibility:** existing `resend-teacher-invite.ts` sends `{ teacherId }`; the relaxed function continues to accept it, so the teachers client needs no change.
- **No status persisted:** the "already active" short-circuit is computed at call time; not stored on `profiles`.

### 5. Dedicated parent avatar storage binding + self-service owner policies
Add `parentAvatarStorage = createImageStorage({ bucket: 'parent-avatars', fileLabel: 'avatar' })` plus an `uploadParentAvatar.ts` shim, mirroring `uploadTeacherAvatar`. Avatars are uploaded under `${profileId}/avatar.<ext>` after the profile id is known (post-invoke on create; the parent id on edit), then the path is written to `profiles.avatar_url`. List/detail resolve signed URLs.
- **Why:** Avatar can only be keyed by the real profile id, which on create only exists after the edge function returns — so upload+`update(avatar_url)` runs after creation, exactly like the teacher flow.

**Self-service avatar editing (new policy work for both buckets).** The current `teacher-avatars` policies are admin-only for INSERT/UPDATE/DELETE (verified). Per the requirement, teachers and parents must be able to edit **their own** avatar. Because the object path is keyed by the owner's profile id (`<profileId>/avatar.<ext>`), add owner policies that allow writes when the first path segment equals `auth.uid()`:
- For `parent-avatars` (new bucket): admin policies (mirror `teacher-avatars`) **plus** owner INSERT/UPDATE/DELETE policies checking `bucket_id = 'parent-avatars' AND (storage.foldername(name))[1] = auth.uid()::text`, and authenticated SELECT.
- For `teacher-avatars` (existing bucket): add the equivalent owner INSERT/UPDATE/DELETE policies (the admin and authenticated-read policies already exist).
- **Why owner-by-path:** signed-URL reads are already authenticated-wide; restricting writes to the owning folder is the least-privilege way to enable self-service without exposing other users' avatars.
- **Open Question:** if a shared `profile-avatars` bucket is later preferred over per-role buckets, the owner policy generalizes unchanged (still keyed by `auth.uid()` folder); this change keeps per-role buckets to stay parallel with teachers/children.

### 6. List/detail queries parallel to teachers, plus a children-options query
Add `get-parents-page.ts` (`.eq('role','parent')`, `.or('first_name.ilike.%term%,last_name.ilike.%term%')`, `.range`, ordered by `last_name,first_name`, resolving avatar signed URLs, and including each parent's linked children for the subtitle/chips). Add `get-parent-by-id.ts` (`.eq('id',id).eq('role','parent')` with embedded `child_guardians -> children` to render the children chips and relationship). Add `get-available-children.ts` returning the children list as `{ id, first_name, last_name, avatar_url? }` options for the multiselect (no equivalent exists yet; `get-available-parents` is the inverse and lives under `children/`).
- **Why:** Keeps list performance and the "children in detail" shape parallel to teachers' "groups in detail"; the children-options query is the only genuinely new read.

### 7. Parent form mirrors `TeacherForm` + `ChildForm`'s guardian rows
Reuse the `forwardRef` + `useImperativeHandle` (`submit()`/`getValues()`) pattern. Fields: document type (adult subset `cc/passport/international_id/other`) + number, names, last names, **children links** (repeatable `(child picker + relationship)` rows from decision 2), **email** (create-only, required), **phone** (optional), avatar (`ImagePicker`/`useImagePicker`). No `role` Select (role is fixed to `parent`); no groups. The email field is hidden/read-only in edit mode; `defaultValues` supported for edit (pre-filled child rows).
- **Why:** Reuses the validated form ergonomics from `TeacherForm` for the scalar fields and the proven guardian-row interaction from `ChildForm` for the per-link relationships, keeping both forms consistent (DRY/SOLID).

## Risks / Trade-offs

- **`parent-avatars` bucket does not exist yet** → Provision a private bucket (mirroring `teacher-avatars`) with admin policies **and** owner-by-path write policies before shipping; verify in Supabase.
- **Owner avatar policies must be path-scoped correctly** → Use `(storage.foldername(name))[1] = auth.uid()::text`; an over-broad policy would let any authenticated user overwrite any avatar. Test that a teacher/parent can write only their own folder and not another user's.
- **Relaxing `admin-resend-invite` could break the teachers client if done carelessly** → Keep accepting `teacherId`, add `userId`, widen role check to `('teacher','parent')` only; do not remove or rename existing behavior. Redeploy and smoke-test a teacher resend after the change.
- **Per-child relationship rows add form complexity** → Mitigated by reusing the existing, tested `ChildForm` row interaction; prefer extracting a shared row component to avoid divergence.
- **Email is required on create but not stored on `profiles`** → Make it a create-only required field; document that it can't be edited later and is used solely for the invite (same as teachers).
- **Two-step create (invoke → assign children → upload avatar → update)** is not atomic; a failure after invoke leaves a parent with no children/avatar → On partial failure, show an error toast but still navigate to the created parent's detail so the admin can finish via edit. Surface the edge function's error message in the toast.
- **Parent deletion cascades child links** → This is the desired behavior (verified `ON DELETE CASCADE` on `child_guardians.guardian_id`); children rows are untouched. If `admin-delete-user` returns an error, surface it in the toast and do not navigate.
- **Behavioral drift from the teachers module** → Keep file/structure parity 1:1 and reuse shared components so future maintenance stays uniform.

## Migration Plan

1. Provision the private `parent-avatars` Supabase storage bucket; add admin policies (mirror `teacher-avatars`) plus owner-by-path INSERT/UPDATE/DELETE policies and authenticated SELECT.
2. Add the equivalent owner-by-path write policies to the existing `teacher-avatars` bucket (so teachers can edit their own avatar).
3. Relax `admin-resend-invite`: widen the target role check to `('teacher','parent')` and accept `userId` (keep `teacherId`); redeploy and smoke-test a teacher resend.
4. Ship the queries, hooks, storage shim, components, routes, and i18n.
5. No table schema migration (tables `profiles`, `child_guardians` already exist; `admin-create-user`/`admin-delete-user` already support `parent`). Only new storage RLS policies.
6. **Rollback:** UI is additive — removing the `/admin/parents` routes/components reverts it. The new storage policies and the resend relaxation are backward-compatible and can be left in place.

## Open Questions

- Should the `(picker + relationship)` row block be extracted from `ChildForm` into a shared component used by both forms, or replicated (inverted) in `ParentForm` for now? Prefer extraction if low-risk; otherwise note the duplication for a later refactor.
- Confirm the exact `parent-avatars` bucket name and that admin policies match the teachers/children buckets; if a shared `profile-avatars` bucket is later preferred, the owner-by-path policy generalizes unchanged.
- Should self-service avatar editing also be surfaced in a teacher/parent-facing profile UI in a later change? This change only adds the storage permission; no end-user avatar screen is built here.
