## Why

Message/report/task attachments are the only feature in the app still backed by AWS S3, reached through two Supabase Edge Functions (`upload-attachment-url`, `sign-attachment-urls`) plus AWS credentials in Supabase Secrets. Everything else (all avatars and group images) already runs on Supabase Storage via `src/utils/imageStorage.ts`. Consolidating attachments onto Supabase Storage removes a second storage provider, deletes the AWS IAM user/secrets and two edge functions, simplifies access control (storage RLS instead of function-enforced participant checks), and reduces operational and cost surface.

## What Changes

- Replace the S3 presigned-PUT upload flow in `src/utils/uploadAttachment/index.ts` with `supabase.storage.from(bucket).upload(...)`, reusing the validated pattern from `imageStorage.ts`.
- Replace the `sign-attachment-urls` edge-function call in `src/hooks/UseAttachmentUrlsQuery.ts` with `supabase.storage.from(bucket).createSignedUrls(...)`.
- Introduce a private `message-attachments` Supabase Storage bucket with RLS/storage policies that restrict read/write to message participants and enforce the teacher/admin upload role gate.
- **BREAKING (infra):** The `upload-attachment-url` edge function becomes dead code after cutover (client uploads go direct to Supabase Storage). Per product decision, the AWS S3 bucket, scoped IAM user, and `AWS_*` Supabase Secrets are **retained** (not destroyed); deleting the dead `upload-attachment-url` function is optional cleanup.
- Keep the stored `Attachment` shape (`key`, `contentType`, `size`, `name`) unchanged so existing `messages.attachments` jsonb rows remain valid; `key` becomes the Supabase Storage object path instead of an S3 object key.
- **No data migration:** per product decision there are no historical S3 attachments that must be preserved, so existing objects are not copied into the Supabase bucket.
- Preserve existing behavior: allowed MIME types, size/count limits, client-side pre-upload validation, attachment-only messages, the `attachments_enabled` PostHog gate, and link-style rendering.
- Update the `admin-data-cleanup` edge function to delete attachment objects via the Supabase Storage API (`message-attachments` bucket) instead of AWS S3, removing its `@aws-sdk/*` dependency and `AWS_*` secrets.
- Add an orphan-sweep capability to `admin-data-cleanup` (`orphan-preview` / `orphan-execute` modes) that removes unreferenced Supabase Storage objects older than one year, under the same admin + preview + typed-confirmation safeguards.

## Capabilities

### New Capabilities
<!-- None. This change re-implements an existing capability on a different storage backend, and extends the existing admin-data-cleanup capability. -->

### Modified Capabilities
- `message-attachments`: Storage backend changes from AWS S3 (presigned URLs via edge functions) to Supabase Storage (SDK upload + participant-gated signing). Requirements referencing S3, presigned PUT URLs, and the `upload-attachment-url` edge function are rewritten to describe Supabase Storage uploads, upload role gating via storage RLS, and signed URL generation. Participant-only reads remain enforced server-side by the (reused) `sign-attachment-urls` function, which now signs Supabase Storage URLs. Role gating, allowed types/sizes/counts, attachment-only messages, feature-flag gating, and rendering behavior are unchanged.
- `admin-data-cleanup`: Attachment object deletion moves from AWS S3 to the Supabase Storage API (`message-attachments` bucket); the function drops its `@aws-sdk/*` dependency and `AWS_*` secrets. Adds an orphaned-attachment sweep (`orphan-preview` / `orphan-execute`) that deletes unreferenced storage objects older than one year, with a one-year age guard protecting in-flight uploads and the same admin-only, preview-first, `ELIMINAR`-confirmation safeguards.

## Impact

- **Client code:** `src/utils/uploadAttachment/index.ts`, `src/utils/uploadAttachment/validate.ts` (unchanged logic, possibly relocated constants), `src/hooks/UseAttachmentUrlsQuery.ts`, and type comments in `src/types/messages.types.ts`. Consumers (`MessageInput.tsx`, `ReportForm.tsx`, `TaskForm.tsx`, `MessageAttachments.tsx`, `ImageGrid.tsx`, and the corresponding detail/card components) keep the same function signatures where possible.
- **Upload progress:** Supabase's standard `upload()` does not expose per-file XHR progress. Either adopt resumable/`tus` uploads to retain progress bars or replace the per-file progress UI with a simpler pending state.
- **Infrastructure:** New private Supabase Storage bucket + storage RLS policies. AWS S3 bucket, IAM user, and `AWS_*` Supabase Secrets are retained per decision (not destroyed).
- **Data:** No migration — existing S3 objects are not copied (no historical data to preserve).
- **Dependencies:** Potential removal of `@aws-sdk/*` usage from the edge-function project (outside this repo). No new client dependencies unless `tus`-based resumable upload is chosen for progress.
