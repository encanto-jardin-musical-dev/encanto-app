## Context

The admin area already ships two complete CRUD modules — `children` and `groups` — that share an identical architecture: `"use client"` App Router pages, controlled-state ref-imperative forms (no form library), React Query hooks in `src/hooks/`, plain async query functions in `src/queries/<domain>/`, private Supabase storage buckets with signed URLs, and shared UI in `src/components/common/` + `src/components/admin/`. Teachers are NOT a separate table: a teacher is a `profiles` row with `role = 'teacher'`. The `group_teachers` join table already links teachers to groups, and the `admin-create-user` edge function (admin-only, invites an auth user and inserts the `profiles` row with rollback) is already deployed but unused by the client.

This change adds the teachers module by mirroring the `children` module as closely as possible to preserve DRY/SOLID and behavioral consistency, while accounting for the one structural difference: teacher creation cannot be a plain table insert because `profiles.id` is tied to Supabase Auth.

## Goals / Non-Goals

**Goals:**
- Teacher list/create/detail/edit/delete that visually and behaviorally matches the existing `children` module.
- Reuse every existing shared abstraction (`AdminSearchBar`, `EntityListItemLink`, `EntityMultiSelect`, `ImagePicker`/`useImagePicker`, `ConfirmDeleteModal`, `EntityChipSection`/`EntityAvatarChip`, `AdminActionButton`, `NavigationBar`, `reconcileLinks`, `getProfilesByRole`, `imageStorage` factory) — introduce no new generic components.
- Route teacher creation through the existing `admin-create-user` edge function so auth + profile stay consistent.
- Operate on `profiles` filtered by `role = 'teacher'` for list/detail/update/delete, and on `group_teachers` for group assignment.

**Non-Goals:**
- No changes to `group_teachers` behavior or the `groups` module.
- No persisted account-status tracking (invited vs. active). Verification state lives in `auth.users` and is not stored on `profiles` nor shown as a badge/filter in the list or detail UI. The admin learns acceptance state only on demand when pressing "Resend invitation" (the function reports "already active" if the teacher has logged in).
- No email/password management UI — the invite flow (magic-link email) is the account-setup path.
- No new document-type, role, or gender fields on `profiles`; no schema migration. No `status` column added to `profiles`.
- No bulk import, deactivation, or audit-log features.

## Decisions

### 1. Teacher creation via the `admin-create-user` edge function, which sends the invite email
`profiles.id` must equal a Supabase Auth user id, so the client invokes the deployed `admin-create-user` function via `supabase.functions.invoke('admin-create-user', { body: {...} })`. The function validates the caller is admin, calls `auth.admin.inviteUserByEmail` (which **sends Supabase's invite email with a magic link** and creates the unconfirmed `auth.users` row), inserts the `profiles` row, and rolls back the auth user on failure, returning the created `profiles` row. **Creating a teacher therefore always sends the invitation email as part of the same operation** — there is no separate "send invite" step.
- **Why:** Reuses tested, secure, transactional server logic; avoids duplicating service-role logic on the client (which is impossible/insecure anyway). One admin action = teacher created + invited.
- **Alternative considered:** Direct `profiles` insert with a client-generated UUID — rejected because it orphans the row from auth and can't send the setup email.
- **Consequence:** `email` is a **required** create-only field (the function requires it; it is not stored on `profiles`). Group assignment happens client-side after invoke using the returned `profile.id` + `reconcileLinks` on `group_teachers`.

### 1a. Account status is NOT tracked (Option A)
The app is passwordless (OTP / magic-link); clicking the invite link routes through the app's `/auth/callback` handler and the teacher is logged in. We do **not** surface or persist whether a teacher has accepted the invite. Verification state (`auth.users.confirmed_at`) is readable only by the service role, so exposing it would require an extra edge function or a synced `profiles.status` column — both out of scope.
- **Why:** The wireframes show no status UI; teacher CRUD and account-status management are separable concerns. Keeps this change minimal and avoids schema/trigger drift.
- **Required edge-function tweak:** the invite must redirect to the app's auth callback, so `inviteUserByEmail` is called with `{ redirectTo: <origin>/auth/callback }`. The origin is resolved from the request's `Origin` header (falls back to `SITE_URL` env var) so the link works correctly across all environments. This is the only change to `admin-create-user`; its contract (request body, admin-only guard, response) is otherwise unchanged.
- **Future-friendly:** if status is later needed, add it via a read-time edge function (preferred) without reworking the CRUD layer.

### 2. Update & delete operate directly on `profiles` (no edge function)
Edit and delete are ordinary RLS-guarded writes: `update(profiles).eq('id', id).eq('role','teacher')` and `delete().eq('id', id)`, mirroring `update-child`/`delete-child`. Email is not editable (it lives in auth, not `profiles`).
- **Why:** Matches the children pattern; RLS already restricts writes to admins. Edge functions are only needed for auth-coupled operations (create, resend invite).
- **Trade-off:** Deleting a `profiles` row leaves the auth user unless RLS/cascade handles it; documented as an Open Question.

### 2a. Resend invitation via a dedicated `admin-resend-invite` edge function
The detail screen exposes a "Resend invitation" action for teachers who haven't logged in yet. Re-issuing an invite requires the service role (`auth.admin`), so the client invokes a new `admin-resend-invite` edge function passing only `{ teacherId }`. The function: (1) verifies the caller is admin (reusing `getAuthenticatedUser` + the profile-role check from `admin-create-user`); (2) loads the teacher's `profiles` row, confirming `role = 'teacher'`; (3) resolves the teacher's email and confirmation state from `auth.users` via `auth.admin.getUserById(teacherId)`; (4) if the user is already confirmed (`confirmed_at`/`last_sign_in_at` set), returns an "already active" result (no email sent); (5) otherwise re-sends the invite email via `auth.admin.inviteUserByEmail(email, { redirectTo: <origin>/auth/callback })`.

**Verified API surface (auth-js 2.107.0, the version pinned for both the app `@supabase/supabase-js@^2.107.0` and the edge functions' `esm.sh/@supabase/supabase-js@2`):**
- `auth.admin.getUserById(uid)` — returns `User` including `email`, `confirmed_at`, `email_confirmed_at`, `last_sign_in_at`. Used to resolve email + active status from `teacherId`.
- `auth.admin.inviteUserByEmail(email, options)` — sends the invite email when called for an already-invited but unconfirmed user. This is the correct service-role call for resend because `generateLink` only generates a link without sending an email.
- There is **no admin `resend()` method**; `supabase.auth.resend()` exists only on the public (anon-session) client for `signup`/`email_change` and is not appropriate for a service-role admin resend.

- **Why pass `teacherId`, not email:** the email is not stored on `profiles` and is intentionally not surfaced to the client; the function resolves it server-side via `getUserById` so the browser never handles it.
- **Why `inviteUserByEmail`, not `generateLink({ type: 'invite' })`:** `generateLink` only *generates* `action_link` — it never sends an email regardless of email provider. `inviteUserByEmail` sends the email automatically and works correctly for already-invited but unconfirmed users, making it the right call for resend.
- **Why a separate function (not reuse `admin-create-user`):** single responsibility — create vs. resend have different inputs (full profile vs. id), different auth-API calls, and different idempotency. Both share the admin-guard and CORS helpers.
- **No status persisted:** the "already active" short-circuit is computed at call time from `auth.users` via `getUserById`; it is not stored on `profiles` (consistent with decision 1a — no status column, no status list/detail UI). The admin only learns acceptance state if/when they press resend.
- **Alternative considered:** reading `confirmed_at` to *hide* the resend button when active — rejected for this change because that would require surfacing status on every detail load (an extra service-role read); instead the button is always available and the function reports "already active" when pressed.

### 3. Reuse `getProfilesByRole` only for options, add dedicated paginated/detail queries
`getProfilesByRole` returns the full role list (used for group form options) and is unsuitable for the searchable, paginated teacher list. Add `get-teachers-page.ts` (`.eq('role','teacher')`, `.or(first_name/last_name ilike)`, `.range`, ordered by `last_name,first_name`, resolving avatar signed URLs) and `get-teacher-by-id.ts` (`.eq('id',id).eq('role','teacher')` with embedded `group_teachers -> groups`).
- **Why:** Keeps list performance and the "groups in detail" shape parallel to `get-children-page`/`get-child-by-id`.

### 4. Teacher form mirrors `ChildForm`, dropping child-only fields and adding teacher fields
Reuse the `forwardRef` + `useImperativeHandle` (`submit()`/`getValues()`) pattern. Fields: document type (adult subset `cc/passport/international_id/other`) + number, names, last names, **role** (Select), **groups** (`EntityMultiSelect`), **email** (create-only, required), **phone** (optional), avatar (`ImagePicker`). Drop gender/birth_date/address/guardians. The email field is hidden/read-only in edit mode.
- **Why:** Matches the wireframe and the `admin-create-user` body contract while reusing the validated form ergonomics.

### 5. Dedicated teacher avatar storage binding
Add `teacherAvatarStorage = createImageStorage({ bucket: 'teacher-avatars', fileLabel: 'avatar' })` plus a `uploadTeacherAvatar.ts` shim, mirroring `uploadChildAvatar`. Avatars are uploaded under `${profileId}/avatar.<ext>` after the profile id is known (post-invoke on create; the teacher id on edit), then the path is written to `profiles.avatar_url`. List/detail resolve signed URLs.
- **Why:** Avatar can only be keyed by the real profile id, which on create only exists after the edge function returns — so upload+`update(avatar_url)` runs after creation, exactly like the child temp-id-then-update flow.

## Risks / Trade-offs

- **`teacher-avatars` bucket does not exist yet** → Provision a private bucket (mirroring `children-avatars`) with admin-write/read policies before shipping; add to the task list and verify in Supabase.
- **Email is required on create but not stored on `profiles`** → Make it a create-only required field; document that it can't be edited later and is used solely for the invite.
- **Two-step create (invoke → assign groups → upload avatar → update)** is not atomic; a failure after invoke leaves a teacher with no groups/avatar → On partial failure, show an error toast but still navigate to the created teacher's detail so the admin can finish via edit. Surface the edge function's error message in the toast.
- **Deleting a `profiles` row may orphan the auth user / break referencing rows** (`group_teachers`, `messages`) → Rely on existing FK/cascade behavior; if delete fails due to references, surface the DB error in the toast (same as children). Confirm cascade rules (Open Question).
- **Behavioral drift from the children module** → Keep file/structure parity 1:1 and reuse shared components so future maintenance stays uniform.

## Migration Plan

1. Provision the private `teacher-avatars` Supabase storage bucket with admin read/write policies (mirror `children-avatars`).
2. Ship the queries, hooks, storage shim, components, routes, and i18n.
3. No DB schema migration (tables `profiles`, `group_teachers` already exist; `admin-create-user` already deployed).
4. **Rollback:** Feature is additive — removing the `/admin/teachers` routes/components reverts the UI with no data-model impact. The bucket can be left in place.

## Open Questions

- Does deleting a teacher's `profiles` row need to also remove the Supabase Auth user (and via what mechanism — cascade, trigger, or a future edge function)? For this change, delete is a plain `profiles` delete; auth-user cleanup is out of scope unless required.
- Confirm the exact `teacher-avatars` bucket name and that policies match the children bucket; if a shared `profile-avatars` bucket is preferred, adjust the storage binding accordingly.
- Should the detail screen show document type + number and role labels localized the same way children does? (Assume yes, reuse the same i18n label mapping approach.)
