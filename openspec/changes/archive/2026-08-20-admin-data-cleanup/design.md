# Design: admin-data-cleanup

## Context

The app stores user-generated content in three Postgres tables — `messages`, `tasks`, `daily_reports` — each with a `created_at` timestamp and an `attachments` JSON column holding S3 object metadata (`{ key, contentType, size, name }[]`, keys shaped like `messages/2024/01/<uuid>.webp`). Files live in a single AWS S3 bucket, uploaded via presigned PUT URLs from the `upload-attachment-url` edge function. Nothing ever deletes this data today.

The repo already has an established pattern for privileged operations: `admin-*` edge functions (`admin-create-user`, `admin-delete-user`, `admin-resend-invite`) that use `createServiceClient()` (service role, bypasses RLS), authenticate the caller via `_shared/auth.ts#getAuthenticatedUser`, and verify `profiles.role = 'admin'` before acting. The client invokes them with `client.functions.invoke('<name>', { body })`.

Admin screens live under `src/app/admin/`, with a dashboard (`/admin`) whose `AdminShortcuts` component renders navigation tiles. All user-facing copy is localized via `next-intl`.

## Goals / Non-Goals

**Goals:**
- Let an admin purge `messages`, `tasks`, and `daily_reports` rows older than one year, plus the S3 attachment objects those rows reference.
- Make accidental deletion practically impossible via double verification: a mandatory dry-run preview whose cutoff timestamp is pinned into the execute call, plus a typed confirmation phrase validated server-side.
- Report exactly what was (and would be) deleted, per entity.
- Keep the operation maintainable: one edge function, batched deletes, per-table error isolation.

**Non-Goals:**
- Deleting `attendance`, `profiles`, `children`, `groups`, or any other table.
- Deleting Supabase Storage avatar/group-image buckets (those belong to persistent entities).
- Sweeping orphan S3 objects not referenced by any row (a separate, riskier operation).
- Scheduled/automatic cleanup (this change is manual, admin-triggered only).
- Soft-delete or an audit table (results are returned to the caller and logged from the function).

## Decisions

### 1. Edge Function with service role, not client-side deletes
Deletion must bypass RLS and needs AWS credentials for S3 — neither is possible from the browser. A new `supabase/functions/admin-data-cleanup/` function follows the existing `admin-delete-user` pattern: CORS handling, `getAuthenticatedUser`, admin role check, JSON responses.

### 2. One function, two modes (`preview` / `execute`)
The request body carries `mode: 'preview' | 'execute'`. Preview computes counts; execute deletes. Keeping both in one function shares auth, cutoff computation, and table iteration logic, and guarantees the preview and execute paths count exactly the same rows. Alternative considered: two separate functions — rejected because duplicated selection logic can drift, breaking the "you delete what you previewed" guarantee.

### 3. Pinned cutoff timestamp is the primary safety mechanism
Preview computes `cutoff = now() - interval '1 year'` server-side and returns it. Execute **requires** the client to send back that exact `cutoff` value and deletes only rows with `created_at < cutoff`. Anything created between preview and execute is therefore never in scope — the admin deletes exactly what they reviewed. Alternative considered: recomputing `now() - 1 year` at execute time — rejected because it silently expands scope beyond the reviewed summary. Rows with `NULL created_at` never match the comparison, so they are safe by default.

### 4. Typed confirmation phrase as the second verification
Execute also requires `confirmationPhrase` to exactly equal a fixed constant (`ELIMINAR`, matching the app's Spanish UI). The UI forces the admin to type it (execute button stays disabled otherwise), and the server re-validates it — so a stray `confirm: true` flag or a scripted call without the phrase fails. Alternative considered: a signed preview token — rejected as disproportionate; phrase + pinned cutoff + admin role already provides two independent human checks.

### 5. Delete DB rows first, then S3 objects
For each table: select the batch's attachment keys, delete the rows, then delete the S3 objects. If S3 deletion fails, orphaned objects remain — harmless and invisible. The reverse order would leave live rows pointing at missing files (user-visible breakage). Orphaned objects are accepted as the lesser evil and reported in the response.

### 6. Batched deletes per table
Each table is processed in batches (500 rows: `SELECT id, attachments ... LIMIT 500`, delete by IDs, repeat until empty) to avoid statement/edge-function timeouts on large backlogs. S3 deletions use `DeleteObjectsCommand` (up to 1000 keys per call). Per-table results (rows deleted, objects deleted, errors) are accumulated so one table's failure does not block the others.

### 7. S3 access reuses the existing AWS secrets
The function reads the same `AWS_REGION`, `AWS_S3_BUCKET`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY` secrets already used by `upload-attachment-url` (IAM must additionally allow `s3:DeleteObject` — called out in Migration Plan). Keys are extracted from the `attachments` JSON of deleted rows; malformed entries are skipped.

### 8. UI: dedicated `/admin/cleanup` page with a 3-step flow
1. **Preview**: page loads with a "Run preview" action → shows a per-entity summary table (rows + attachments to delete) and the cutoff date.
2. **Confirm**: a typed-confirmation input (must equal `ELIMINAR`) enables the execute button.
3. **Execute → Results**: shows per-entity deleted counts and any failures.
Implemented as a client component under `src/components/admin/cleanup/`, with two React Query hooks (`UseCleanupPreviewQuery`-style mutation/queries under `src/hooks/`) wrapping a thin `src/queries/admin/` caller that invokes the edge function. A sixth tile is added to `AdminShortcuts.tsx`. All copy goes through `next-intl`.

### 9. Gate the whole feature behind the PostHog flag `admin_cleanup`
The flag is off by default so the feature ships dark. The page is wrapped in the existing `FeatureFlagRoleGate` (`flag="admin_cleanup"`, `allowedRoles={[USER_ROLES.ADMIN]}`), which renders nothing while the flag resolves and calls `notFound()` when the flag is off or the role is not admin — the same pattern used by `/admin/attendance`. The dashboard tile in `AdminShortcuts.tsx` renders only when `useFeatureFlagEnabled("admin_cleanup") === true` (hook called unconditionally, `undefined`/`false` treated as off, per project conventions). The flag is a client-side convenience, not a security boundary — the edge function's server-side admin role check is the real gate. Alternative considered: gating via middleware — rejected because flag evaluation is client-side (PostHog JS) and the established pattern already handles the loading window without bouncing users.

## Risks / Trade-offs

- [Wrong data deleted] → Pinned cutoff (delete exactly what was previewed) + typed phrase validated server-side + admin-role check + preview-first UI flow.
- [Edge function timeout on a large first run] → Batched deletes (500 rows/batch) and batched S3 deletes (1000 keys/call); if the function still times out, re-running preview/execute is idempotent and converges.
- [DB delete succeeds but S3 delete fails] → Orphan S3 objects remain; failures are reported per table in the response and function logs. Accepted trade-off (reverse order would break live attachment references).
- [Two admins execute concurrently] → Both delete the same pinned-cutoff scope; deletes are idempotent, worst case is duplicated work. No locking added (admin-only, low-frequency operation).
- [IAM policy lacks `s3:DeleteObject`] → Migration Plan includes updating the IAM policy before deploy; function surfaces S3 errors per table rather than crashing.
- [Nullable `created_at` rows never purged] → Documented, safe-by-default; current codebase always sets `created_at` via defaults.
- [Flag off but edge function deployed] → By design: the flag only hides UI; the function still enforces admin role + phrase + cutoff, so no unprivileged deletion is possible.

## Migration Plan

1. Update the AWS IAM policy for the attachments bucket user to allow `s3:DeleteObject`.
2. Create the PostHog feature flag `admin_cleanup`, default off (enable for internal admins first).
3. Deploy the `admin-data-cleanup` edge function (`supabase functions deploy admin-data-cleanup`).
4. Ship the frontend (new route, components, hooks, flag-gated tile, i18n strings) — invisible while the flag is off.
5. Enable `admin_cleanup` for test admins in staging; verify preview counts match `SELECT count(*)` queries and execute removes rows and objects.
6. Rollback: turn the flag off (UI disappears instantly); optionally remove the tile/page. The function is admin-triggered and inert without callers; no data migration to reverse (deletion is the feature — restored only from backups).

## Open Questions

- Confirmation phrase: `ELIMINAR` (proposed) — confirm wording with product.
- Should results also be tracked as a PostHog event? (Easy to add client-side after execute; not required for v1.)
