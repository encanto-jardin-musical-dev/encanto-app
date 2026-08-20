# Proposal: admin-data-cleanup

## Why

Messages, tasks, and daily reports (plus their attachment images in S3) accumulate indefinitely, growing database and storage costs and retaining personal data longer than needed. Admins need a safe, self-service way to purge records older than one year — with strong guardrails, because deletion is irreversible.

## What Changes

- Add a new Supabase Edge Function `admin-data-cleanup` (service-role, admin-only) with two modes:
  - **Preview (dry-run)**: returns per-entity counts of rows and S3 attachments older than the 1-year cutoff, with the exact cutoff timestamp. Deletes nothing.
  - **Execute**: deletes `messages`, `tasks`, and `daily_reports` rows with `created_at` older than the pinned cutoff, then deletes the S3 attachment objects referenced by those rows.
- Double verification to avoid errors:
  1. **Preview-first flow** — the admin must run a preview and see the exact deletion summary before executing; execution requires sending back the pinned cutoff timestamp from the preview, so data created after the preview is never touched.
  2. **Explicit typed confirmation** — the admin must type a confirmation phrase (e.g. `ELIMINAR`) in the UI; the server rejects any execute call that lacks the exact phrase and the preview cutoff.
- Add a new admin page `/admin/cleanup` that walks the admin through preview → review → typed confirmation → execute, showing per-entity counts and results.
- Add a sixth shortcut tile ("Cleanup") to the Admin Options dashboard linking to `/admin/cleanup`.
- Gate the entire feature behind the PostHog feature flag `admin_cleanup` (off by default): the page renders 404 and the dashboard tile is hidden unless the flag is enabled for the current user.
- Avatar and group images in Supabase Storage are **NOT** in scope — they belong to persistent entities (profiles, children, groups) that outlive this cleanup.

## Capabilities

### New Capabilities
- `admin-data-cleanup`: Admin-triggered purge of messages, tasks, and daily reports (and their S3 attachment objects) older than one year, via a preview-then-confirm edge function with typed double verification.

### Modified Capabilities
- `admin-options-page`: The "Entity creation shortcuts" requirement changes — the dashboard gains a sixth shortcut tile (Cleanup) navigating to `/admin/cleanup`.

## Impact

- **New Edge Function**: `supabase/functions/admin-data-cleanup/` — reuses `_shared/auth.ts`, `_shared/supabaseClient.ts`, `_shared/cors.ts`; needs the existing `AWS_*` secrets for S3 deletion (`DeleteObjectsCommand`).
- **Database**: Deletes rows from `messages`, `tasks`, `daily_reports` where `created_at < now() - interval '1 year'`. No schema changes; RLS untouched (service role bypasses RLS inside the function).
- **S3**: Deletes only attachment objects referenced by the deleted rows (keys stored in each table's `attachments` JSON column, e.g. `messages/2024/01/<uuid>.webp`). Orphan objects not referenced by any row are out of scope.
- **Frontend**: New route `src/app/admin/cleanup/`, new components under `src/components/admin/cleanup/`, a React Query hook pair (preview/execute) under `src/hooks/`, a query wrapper under `src/queries/admin/`, a new tile in `AdminShortcuts.tsx`, and i18n strings in `src/i18n/` catalogs.
- **Feature flag**: New PostHog flag `admin_cleanup`; the page is wrapped in the existing `FeatureFlagRoleGate` (`flag="admin_cleanup"`, admin-only) and the tile renders only when `useFeatureFlagEnabled("admin_cleanup") === true` (flag hooks run unconditionally; `false`/`undefined` treated as off).
- **Auth/Security**: Caller must be authenticated with `profiles.role = 'admin'` (same guard as `admin-delete-user`); execute additionally requires the confirmation phrase and preview cutoff. The edge function enforces admin role server-side regardless of the client-side flag.
