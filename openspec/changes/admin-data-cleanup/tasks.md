# Tasks: admin-data-cleanup

## 1. Edge function scaffold

- [x] 1.1 Create `supabase/functions/admin-data-cleanup/index.ts` following the `admin-delete-user` pattern: CORS via `_shared/cors.ts`, `POST` only, service client via `_shared/supabaseClient.ts`, caller auth via `_shared/auth.ts`, and 403 unless caller profile `role = 'admin'`
- [x] 1.2 Define the request contract: `{ mode: 'preview' }` and `{ mode: 'execute', cutoff: string, confirmationPhrase: string }`; reject non-POST, invalid JSON, missing/unknown `mode` with 4xx JSON errors

## 2. Preview mode

- [x] 2.1 Compute `cutoff = now() - interval '1 year'` server-side and, for each of `messages`, `tasks`, `daily_reports`, count rows with `created_at < cutoff` using count-only queries
- [x] 2.2 For each table, fetch `attachments` of matching rows and count referenced S3 objects (skip malformed entries); return `{ cutoff, entities: { messages: { rows, objects }, tasks: {...}, reports: {...} } }`
- [x] 2.3 Verify preview performs no deletes (spot-check counts against `SELECT count(*)` queries in the Supabase dashboard)

## 3. Execute mode with double verification

- [x] 3.1 Validate execute input: require a non-empty `cutoff` ISO timestamp and `confirmationPhrase === 'ELIMINAR'`; return 400 and delete nothing when either is missing or incorrect
- [x] 3.2 Implement batched deletion per table: `SELECT id, attachments` where `created_at < cutoff` LIMIT 500, collect attachment keys, delete the batch by IDs, repeat until no rows match; accumulate per-table rows-deleted counts
- [x] 3.3 Wrap each table's processing in per-table error isolation so one table's failure does not block the others; record per-table errors for the response

## 4. S3 attachment deletion

- [x] 4.1 Configure an `S3Client` from the existing `AWS_REGION` / `AWS_S3_BUCKET` / `AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY` secrets (as in `upload-attachment-url`)
- [x] 4.2 After each table's rows are deleted, delete the collected keys with `DeleteObjectsCommand` in batches of up to 1000; count deleted objects and capture S3 errors per table without failing the run
- [x] 4.3 Update the AWS IAM policy for the attachments bucket user to allow `s3:DeleteObject` on the bucket

## 5. Function response & deploy

- [x] 5.1 Return the execute summary: per-entity `{ rowsDeleted, objectsDeleted, error? }`; add structured `console` logging for audit (mode, caller id, cutoff, per-entity results)
- [x] 5.2 Deploy with `supabase functions deploy admin-data-cleanup` and smoke-test preview/execute against staging with an admin JWT (verify 403 for non-admin, 400 for bad phrase/cutoff)

## 6. Frontend data layer

- [x] 6.1 Add `src/queries/admin/run-cleanup.ts` (or similar) that invokes the function via `client.functions.invoke('admin-data-cleanup', { body })` for both modes, with typed request/response shapes in `src/types/`
- [x] 6.2 Add React Query hooks in `src/hooks/` (e.g. `UseCleanupPreviewMutation`, `UseCleanupExecuteMutation`) wrapping the query with explicit error handling

## 7. Cleanup page UI

- [x] 7.1 Create `src/app/admin/cleanup/page.tsx` with `NavigationBar` (back to `/admin`) and localized title, wrapped in `FeatureFlagRoleGate` with `flag="admin_cleanup"` and `allowedRoles={[USER_ROLES.ADMIN]}` (same pattern as `/admin/attendance`)
- [x] 7.2 Create `src/components/admin/cleanup/` components implementing the 3-step flow: preview action → per-entity summary table with cutoff date → typed-confirmation input that enables the execute button only when it exactly matches `ELIMINAR` → per-entity results (rows deleted, objects deleted, errors)
- [x] 7.3 Build the UI with HeroUI components and Heroicons per project conventions; handle loading and error states for both mutations

## 8. Feature flag, navigation & i18n

- [x] 8.1 Create the PostHog feature flag `admin_cleanup`, default off (enable for internal/test admins first)
- [x] 8.2 Add the sixth shortcut tile (Cleanup, appropriate Heroicon, route `/admin/cleanup`) to `AdminShortcuts.tsx`, rendered only when `useFeatureFlagEnabled("admin_cleanup") === true` — hook called unconditionally with other hooks, before any conditional rendering
- [x] 8.3 Add all cleanup page strings (title, steps, summary headers, confirmation prompt, actions, results, errors) plus the `AdminOptionsPage.tiles.cleanup` label to the i18n catalogs in `src/i18n/`

## 9. Verification

- [x] 9.1 Run `pnpm lint` and `pnpm build` to validate types and compilation
- [x] 9.2 Flag behavior: with `admin_cleanup` off, the tile is hidden and `/admin/cleanup` returns not-found; with it on, the tile appears and the page renders; no flicker or redirect while the flag resolves
- [x] 9.3 Manual end-to-end check (flag on): preview counts match DB queries → execute button disabled until phrase typed → execute deletes only rows older than the pinned cutoff → attachments gone from S3 → results summary matches expectations → newer rows and other tables untouched
