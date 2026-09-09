## Context

Attachments (messages, daily reports, tasks) are the only feature still using AWS S3. The flow today:

- **Upload** — `src/utils/uploadAttachment/index.ts` requests presigned PUT URLs from the `upload-attachment-url` Supabase Edge Function, then PUTs each file directly to S3 via `XMLHttpRequest` (giving per-file progress). Metadata (`key`, `contentType`, `size`, `name`) is stored in the `messages.attachments` jsonb column.
- **Read** — `src/hooks/UseAttachmentUrlsQuery.ts` batches `{messageId, key}` pairs to the `sign-attachment-urls` Edge Function, which verifies the caller is a message participant and returns 24h presigned GET URLs. React Query caches them with a ~23h staleTime.
- **Access control** — enforced inside the two edge functions (role gate on upload; participant check on read). The bucket blocks public access.

In contrast, all avatars/group images already use Supabase Storage through `src/utils/imageStorage.ts`, which exposes `upload`, `getSignedUrl`, and `getSignedUrls` over private buckets with `createSignedUrl(s)`. That module is the reference pattern for this migration.

The stored `Attachment` shape stays identical, so no `messages.attachments` row rewrite is needed — only the meaning of `key` shifts from "S3 object key" to "Supabase Storage object path".

Constraints: preserve allowed MIME types (`image/jpeg`, `image/png`, `image/webp`, `application/pdf`), 10 MB max size, 4-file max (per current `validate.ts`), attachment-only messages, the `attachments_enabled` PostHog gate, and link-style rendering. Participant-only access must be preserved.

## Goals / Non-Goals

**Goals:**
- Serve all attachment upload and read paths from a private Supabase Storage bucket.
- Reproduce participant-only read access and teacher/admin upload gating using Supabase Storage RLS policies (moving enforcement out of edge functions).
- Keep the `Attachment` metadata shape and `messages.attachments` persistence unchanged so historical rows keep working after object migration.
- Retire the S3 bucket, IAM user, `AWS_*` secrets, and the two edge functions after cutover.
- Migrate existing S3 objects into Supabase Storage under identical key paths.

**Non-Goals:**
- Changing allowed types, size/count limits, or the attachment metadata schema.
- Adding inline previews, PDF thumbnails, or HEIC conversion (still deferred per the original phased plan).
- Changing the `attachments_enabled` feature-flag mechanism.
- Reworking push notifications.

## Decisions

### Decision 1: Single private bucket `message-attachments`
Use one private Supabase Storage bucket for all attachment types, mirroring current single-S3-bucket layout. Public access disabled; reads always go through signed URLs.

**Alternative considered:** Per-domain buckets (messages/reports/tasks). Rejected — the current design already commingles them under one bucket and the metadata carries no type discriminator; splitting adds policy duplication with no clear benefit.

### Decision 2: Preserve object key paths
Keep the existing S3 key convention (e.g. `messages/{yyyy}/{mm}/{uuid}.{ext}`) as the Supabase Storage object path. This lets us copy S3 objects 1:1 and leave every `messages.attachments.key` value untouched.

**Alternative considered:** New Supabase-native path scheme + a data migration rewriting jsonb keys. Rejected — higher risk, touches production message rows, no upside.

### Decision 3: Access control via Storage RLS, not edge functions
Move participant/role enforcement into Supabase Storage RLS policies on `storage.objects` for the `message-attachments` bucket:
- **INSERT (upload):** allow only when `auth.jwt()`/profile role is `teacher` or `admin`.
- **SELECT (read/sign):** allow only when the caller is a participant of the message that references the object key. Because Storage RLS can't easily join arbitrary jsonb, we will resolve participation by matching the object path against the caller's messages (a SQL helper/`security definer` function keyed on the path prefix, or a mapping check). The exact predicate is an open question below.

**Alternative considered:** Keep a thin edge function that signs URLs after a participant check (closest to today's behavior, minimal RLS complexity). This is the fallback if a clean RLS predicate proves impractical — it still removes S3/AWS while retaining Supabase-native storage.

### Decision 4: Upload progress — accept simpler pending state (default), tus optional
Supabase's `upload()` does not surface per-file progress like the current XHR flow. Default to a per-file pending/spinner state and drop the percentage bar. If product wants to retain progress bars, use Supabase resumable uploads (`@supabase/storage-js` tus support) as a follow-up.

**Alternative considered:** Immediately adopt tus resumable uploads. Deferred — adds complexity and a behavioral surface; not required for functional parity.

### Decision 5: Reuse `imageStorage.ts` patterns, keep public function signatures
`uploadAttachments(files, onProgress?)` and `useAttachmentUrlsQuery({requests})` keep their signatures so consumers (`MessageInput`, `ReportForm`, `TaskForm`, and render components) need minimal or no changes. Internals switch to `supabase.storage.from('message-attachments').upload(...)` and `.createSignedUrls(...)`. `onProgress` degrades to coarse-grained (0 → 100 per file) if tus is not adopted.

## Risks / Trade-offs

- **[RLS predicate for participant read is non-trivial]** → Mitigation: fall back to a thin signing edge function (Decision 3 alternative) that keeps the participant check in SQL while still using Supabase Storage. Decide during design spike before implementation.
- **[Loss of granular upload progress]** → Mitigation: coarse pending state for parity; adopt tus resumable uploads as an opt-in follow-up if UX regression is unacceptable.
- **[Data migration gap — orphaned/broken historical attachments]** → Mitigation: copy all S3 objects with identical keys before cutover; verify a sample of historical messages render; keep S3 read-only until verification passes; only then decommission.
- **[Cutover race — new uploads split across two stores]** → Mitigation: deploy client change and run S3→Supabase copy in a maintenance window, or dual-read (try Supabase, fall back to S3 signed URL) during a transition period.
- **[Supabase Storage size/egress limits vs S3]** → Mitigation: confirm plan limits cover current + projected attachment volume before cutover.

## Migration Plan

1. Create private `message-attachments` bucket and storage RLS policies (upload role gate + participant read). Validate policies on staging.
2. Implement client changes behind existing `attachments_enabled` flag: `uploadAttachment/index.ts` → Supabase upload; `UseAttachmentUrlsQuery.ts` → `createSignedUrls`. Update `messages.types.ts` key comment.
3. Copy existing S3 objects → Supabase bucket under identical keys (script; verify counts + checksums).
4. Smoke test on staging: upload new attachment (teacher), read historical attachment (participant), confirm non-participant is denied, confirm parent cannot upload.
5. Production cutover in a maintenance window (or with dual-read fallback). Verify sample of old + new messages render.
6. After a soak period, decommission: delete `sign-attachment-urls` and `upload-attachment-url` edge functions, remove `AWS_*` Supabase Secrets, delete IAM user and S3 bucket.

**Rollback:** Before decommission, revert the client change to restore S3 edge-function calls (objects still exist in S3). After decommission, rollback requires re-provisioning S3 — hence the soak period before step 6.

## Open Questions

1. Can participant read access be expressed as a Supabase Storage RLS predicate on `storage.objects`, or do we keep a thin signing edge function? (Blocks Decision 3.)
2. Are there existing production attachments in S3 to migrate, and what is the object count/total size? (Determines whether step 3 is real work or a no-op.)
3. Do we require zero-downtime cutover (dual-read fallback) or is a maintenance window acceptable?
4. Retain per-file progress bars (adopt tus) or accept a coarse pending state?
