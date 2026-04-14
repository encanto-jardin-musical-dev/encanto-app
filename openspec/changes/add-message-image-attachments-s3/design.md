## Context

Encanto uses Supabase Storage for user-generated files today via the `subscriptions` and other buckets, but the product/infra team has standardized on **AWS S3** as the canonical object store for rich media going forward (cost, lifecycle policies, CloudFront integration). Messages between teachers and parents are currently text-only, stored in the `messages` table whose `attachments` (jsonb) column is already present but unused at the UI level. This change introduces the first end-to-end S3 flow in the codebase.

Relevant existing infra:
- Edge function pattern in `supabase/functions/push/` with Supabase Secrets for credentials.
- Messages read/write paths in `src/queries/messages/` and `src/hooks/` (React Query pattern).
- Realtime subscriptions pipe new messages through `UseSupabaseRealtime.ts`.
- FCM push fan-out in `supabase/functions/push/index.ts` triggered by the `new_message` webhook.

## Goals / Non-Goals

**Goals:**
- Allow teachers and admins to attach up to 5 images (jpg/png/webp/heic) and/or PDFs to a message in a single send.
- Store originals in a private S3 bucket; client uploads directly via presigned PUT URLs issued by an edge function.
- Render attachments inline in the message thread with thumbnails, full-screen image viewer, and PDF open-in-new-tab.
- Preserve RLS semantics: only message participants can view attachments (enforced by the GET URL issuer, not by S3 ACLs).
- Update push notifications so image messages can preview the first image in the FCM payload.

**Non-Goals:**
- Video, audio, or other MIME types. Out of scope for this iteration.
- Parents sending attachments (teachers/admins only for v1).
- Editing or deleting attachments after send — consistent with current messages, which are immutable once sent.
- Migrating existing Supabase Storage uploads (none exist for messages).
- EXIF stripping / image optimization pipelines beyond PDF thumbnail generation.
- Virus scanning (tracked as an open question).

## Decisions

### Decision 1: Reuse `messages.attachments` jsonb column
**Chosen:** Store attachments as `jsonb` array on the `messages` row.

**Rationale:** The column already exists across `messages`, `daily_reports`, and `tasks`, suggesting a project-wide convention. Zero-migration and the read path already fetches this column. A normalized `message_attachments` table would add join overhead to every thread fetch without concrete benefits (we don't need to query individual attachments).

**Shape:**
```ts
type Attachment = {
  key: string;           // S3 object key, e.g. "messages/<messageId>/<uuid>.webp"
  contentType: string;   // "image/webp" | "application/pdf" | ...
  size: number;          // bytes
  name: string;          // sanitized original filename
  width?: number;        // images only
  height?: number;       // images only
  thumbnailKey?: string; // PDFs: S3 key for first-page thumbnail
};
type MessageAttachments = Attachment[];
```

Note: we store `key`, not `url`. URLs are generated on read via presigned GET or CloudFront-signed URLs so that access remains short-lived and revocable.

**Alternative considered:** New `message_attachments` table. Rejected — migration + join cost + duplicates existing jsonb convention.

### Decision 2: Presigned PUT URLs from a Supabase Edge Function
**Chosen:** `supabase/functions/upload-attachment-url/` generates time-limited presigned PUT URLs using `@aws-sdk/s3-request-presigner`.

**Rationale:**
- Keeps AWS credentials in Supabase Secrets, matching the existing `push` function and keeping Vercel env footprint minimal.
- Edge function can enforce role check (`teacher` or `admin`) by reading the JWT's `role` claim or querying `profiles` — same pattern as existing functions.
- Browser uploads bypass the Next.js server, saving Vercel bandwidth/compute. Important for 10MB PDFs.
- S3 presigned PUT URLs support `Content-Type`, `Content-Length-Range`, and `x-amz-meta-*` conditions, letting us enforce type/size at the storage boundary.

**Alternatives considered:**
- Next.js server action proxying to S3: simpler client code but uses Vercel bandwidth and leaks credentials into Vercel env.
- Supabase Storage: would work but the team has chosen S3 going forward.

### Decision 3: Private bucket + presigned GET URLs for reads
**Chosen:** Bucket blocks all public access. GET URLs are generated per request with a 1-hour TTL.

**Rationale:** Message attachments are private by policy (teacher→parent communication). A public-by-default bucket leaks URLs through logs, analytics, cached proxies. The 1h TTL balances freshness vs. function call volume.

**Where GETs are signed:** A thin edge function or Next.js server action `sign-attachment-urls` that accepts `[{messageId, key}]`, verifies the caller is a participant of each message, and returns signed URLs. React Query caches by `(messageId, key)` with staleTime ~50min to stay under the 1h TTL.

**Alternative considered:** CloudFront with signed cookies. Deferred — adds infra complexity; revisit if signing call volume becomes a bottleneck.

### Decision 4: HEIC conversion client-side
**Chosen:** Convert HEIC → webp in the browser via `heic2any` before upload. Fallback: upload raw HEIC if conversion fails (with a warning toast).

**Rationale:** HEIC is not renderable in most browsers, so converting pre-upload means a single storage artifact that works everywhere. Doing it client-side avoids server compute. The fallback preserves the message send path when conversion fails on niche browsers.

**Trade-off:** `heic2any` is ~1MB gzipped; lazy-load it only when a `.heic` file is selected.

### Decision 5: PDF thumbnails generated server-side
**Chosen:** After successful PDF upload, the client calls a second edge function `generate-pdf-thumbnail` that reads the PDF from S3, renders page 1 to webp via `pdf-lib` + `@napi-rs/canvas` (or Deno-compatible equivalent), and writes the thumbnail back under `<key>.thumb.webp`. The thumbnail key is stored in the attachment's `thumbnailKey` field.

**Rationale:** Client-side PDF rendering requires shipping pdf.js (~2MB) and is slow on mobile. Server-side keeps the client bundle lean and gives consistent results. Deno edge functions can run pdf-lib but not full pdf.js rendering — we may need to invoke an AWS Lambda instead if Deno rendering proves infeasible (tracked as an open question).

**Fallback:** If thumbnail generation fails, leave `thumbnailKey` undefined; UI falls back to a generic PDF icon.

### Decision 6: Upload orchestration on the client
The send flow becomes:
1. User selects files in `MessageComposer`. Client validates type/size/count.
2. Client requests presigned PUT URLs (one batched call, returns array of `{key, url, fields}`).
3. Client uploads files to S3 in parallel with per-file progress UI.
4. For PDFs, client awaits thumbnail generation function call (can run in parallel with remaining uploads).
5. Client calls `sendMessage` mutation with `attachments: Attachment[]` appended to the message row.
6. If any upload fails, the message is not sent — uploaded objects for that attempt are orphaned (lifecycle rule cleans them up).

### Decision 7: Bucket layout & lifecycle
- Bucket name: `encanto-message-attachments-{env}` (`prod`, `staging`).
- Object keys: `messages/{yyyy}/{mm}/{uuid}.{ext}`. Grouping by month simplifies S3 inventory and potential archival.
- Lifecycle rule: abort incomplete multipart uploads after 1 day; transition to IA after 90 days; no auto-deletion (messages are retained with the account).
- Orphan cleanup: weekly job (future work) comparing S3 inventory against referenced keys in `messages.attachments`.

### Decision 8: FCM payload updates
Extend the `push` edge function to include attachment metadata in the data-only FCM payload:
```json
{ "attachmentCount": 2, "firstAttachmentThumbUrl": "https://..." }
```
A short-lived (5 min) presigned URL is embedded so the service worker can show a rich notification via `showNotification({ image })`. If URL generation fails, fall back to text-only notification.

## Risks / Trade-offs

- **[Deno edge function can't render PDF to image]** → Mitigation: fall back to invoking an AWS Lambda via function URL for thumbnail generation. Tracked as open question.
- **[Presigned GET call volume explodes on long threads]** → Mitigation: batch sign requests per thread load, cache in React Query with staleTime under the TTL. Escalation: move to CloudFront signed cookies if volume is an issue.
- **[HEIC conversion fails on Firefox/older browsers]** → Mitigation: fall back to uploading raw HEIC; show warning toast explaining the file may not preview correctly. Affected users are a small minority.
- **[Orphaned S3 objects from failed sends]** → Mitigation: lifecycle rule plus future weekly reconciliation job. Cost impact is small until volume grows.
- **[Secret leakage if edge function env is misconfigured]** → Mitigation: dedicated IAM user scoped to this bucket with `s3:PutObject`, `s3:GetObject` only; rotate on suspicion; never log the AWS secret.
- **[Malicious uploads (scripts masquerading as images, PDF exploits)]** → Mitigation: `Content-Type` constraint in presigned PUT, client validates magic bytes, store `Content-Disposition: attachment` on GETs to force download for PDFs, never `eval` attachment content. Virus scanning deferred as an open question.
- **[Push payloads exceeding FCM 4KB limit]** → Mitigation: only include short presigned URL + count; never embed base64 data.
- **[Rate limiting the upload function]** → Mitigation: document a per-user quota check in the edge function (e.g., max 50 presigned URLs per hour) to defend against abuse.

## Migration Plan

No data migration required.

Rollout order:
1. Provision AWS S3 bucket, IAM user, CORS config, lifecycle rules via Terraform or console (document the steps in `docs/` or the PR).
2. Add Supabase Secrets: `AWS_REGION`, `AWS_S3_BUCKET`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`.
3. Deploy `upload-attachment-url` and `sign-attachment-urls` edge functions.
4. Deploy `generate-pdf-thumbnail` edge function (or Lambda fallback).
5. Ship client code behind a feature flag (`NEXT_PUBLIC_ATTACHMENTS_ENABLED` or PostHog flag) defaulted off.
6. Smoke test on staging with a real teacher account.
7. Enable flag in production for a single pilot group, then roll out.

Rollback: disable the feature flag — read path continues to render any attachments already sent (they remain valid because the GET signing function stays deployed).

## Open Questions

1. **PDF thumbnail rendering environment:** Can we render a PDF page to an image from a Deno edge function, or do we need AWS Lambda? Spike required before task breakdown is finalized.
2. **Virus scanning:** Do we need ClamAV / AWS GuardDuty Malware Protection for S3 before launch, or is it acceptable to defer? Compliance review needed.
3. **CloudFront vs. direct S3 GET URLs:** Benchmark expected request volume before committing to direct signing. CloudFront reduces per-request signing cost if thread load volume is high.
4. **Retention policy:** Do attachments need a max retention window for GDPR/compliance reasons, or do they stay as long as the message row exists?
5. **Per-user upload quota:** What's an acceptable ceiling (50/hour? per-day MB cap?) — product input needed.
