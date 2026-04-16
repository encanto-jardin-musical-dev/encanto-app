## Context

Encanto uses Supabase Storage for user-generated files today via the `subscriptions` and other buckets, but the product/infra team has standardized on **AWS S3** as the canonical object store for rich media going forward (cost, lifecycle policies, CloudFront integration). Messages between teachers and parents are currently text-only, stored in the `messages` table whose `attachments` (jsonb) column is already present but unused at the UI level. This change introduces the first end-to-end S3 flow in the codebase.

Relevant existing infra:
- Edge function pattern in `supabase/functions/push/` with Supabase Secrets for credentials.
- Messages read/write paths in `src/queries/messages/` and `src/hooks/` (React Query pattern).
- Realtime subscriptions pipe new messages through `UseSupabaseRealtime.ts`.
- FCM push fan-out in `supabase/functions/push/index.ts` triggered by the `new_message` webhook.

## Goals / Non-Goals

**Goals (Phase 1):**
- Allow teachers and admins to attach up to 5 images (jpg/png/webp) and/or PDFs to a message in a single send.
- Store originals in a private S3 bucket; client uploads directly via presigned PUT URLs issued by an edge function.
- Render attachments as clickable links that open in a new tab (file-type icon + filename). No inline previews in Phase 1.
- Preserve RLS semantics: only message participants can view attachments (enforced by the GET URL issuer, not by S3 ACLs).
- Allow attachment-only messages (no text content required).

**Deferred Goals:**
- Update push notifications so image messages can preview the first image in the FCM payload. *(Phase 3)*
- Inline image thumbnails and full-screen viewer. *(Phase 2)*
- PDF thumbnail generation. *(Phase 3)*
- HEIC support. *(Phase 2)*

**Non-Goals:**
- Video, audio, or other MIME types. Out of scope for this iteration.
- Parents sending attachments (teachers/admins only for v1).
- Editing or deleting attachments after send — consistent with current messages, which are immutable once sent.
- Migrating existing Supabase Storage uploads (none exist for messages).
- EXIF stripping / image optimization pipelines.
- Virus scanning (tracked as an open question).

## Decisions

### Decision 1: Reuse `messages.attachments` jsonb column
**Chosen:** Store attachments as `jsonb` array on the `messages` row.

**Rationale:** The column already exists across `messages`, `daily_reports`, and `tasks`, suggesting a project-wide convention. Zero-migration and the read path already fetches this column. A normalized `message_attachments` table would add join overhead to every thread fetch without concrete benefits (we don't need to query individual attachments).

**Phase 1 shape:**
```ts
type Attachment = {
  key: string;           // S3 object key, e.g. "messages/<messageId>/<uuid>.webp"
  contentType: string;   // "image/webp" | "image/jpeg" | "image/png" | "application/pdf"
  size: number;          // bytes
  name: string;          // sanitized original filename
};
type MessageAttachments = Attachment[];
```

Note: we store `key`, not `url`. URLs are generated on read via presigned GET URLs so that access remains short-lived and revocable.

Note: `width`, `height`, and `thumbnailKey` optional fields are intentionally omitted from Phase 1. They will be added in Phase 2 (inline image previews) and Phase 3 (PDF thumbnails) respectively.

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
**Chosen:** Bucket blocks all public access. GET URLs are generated per request with a **24-hour TTL**.

**Rationale:** Message attachments are private by policy (teacher→parent communication). A public-by-default bucket leaks URLs through logs, analytics, cached proxies. The 24h TTL significantly reduces signing call volume vs. a 1h TTL, and is acceptable for a school communication app where attachment confidentiality at the hour scale is not a hard requirement.

**Where GETs are signed:** A thin edge function `sign-attachment-urls` that accepts `[{messageId, key}]`, verifies the caller is a participant of each message, and returns signed URLs. React Query caches by `(messageId, key)` with staleTime ~23 hours to stay under the 24h TTL.

**Alternative considered:** CloudFront with signed cookies. Deferred — adds infra complexity; revisit if signing call volume becomes a bottleneck.

### Decision 4: HEIC conversion client-side
**[DEFERRED — Phase 2]** Convert HEIC → webp in the browser via `heic2any` before upload.

Phase 1 rejects HEIC files at validation time with an error toast explaining that HEIC is not yet supported. No `heic2any` dependency needed. Allowed types for Phase 1: `image/jpeg`, `image/png`, `image/webp`, `application/pdf`.

### Decision 5: PDF thumbnails generated server-side
**[DEFERRED — Phase 3]** After successful PDF upload, a `generate-pdf-thumbnail` edge function renders page 1 to webp and stores the thumbnail back under `<key>.thumb.webp`.

Phase 1 renders PDFs with a generic document icon + filename link. No `generate-pdf-thumbnail` edge function needed. `thumbnailKey` is not stored in Phase 1 attachment objects.

### Decision 6: Upload orchestration on the client
The Phase 1 send flow:
1. User selects files in `MessageInput`. Client validates type/size/count.
2. Client requests presigned PUT URLs (one batched call, returns array of `{key, url}`).
3. Client uploads files to S3 in parallel with per-file progress UI.
4. Client calls `sendMessage` mutation with `attachments: Attachment[]` appended to the message row.
5. If any upload fails, the message is not sent — uploaded objects for that attempt are orphaned (lifecycle rule cleans them up).

### Decision 7: Bucket layout & lifecycle
- Bucket name: `encanto-message-attachments-{env}` (`prod`, `staging`).
- Object keys: `messages/{yyyy}/{mm}/{uuid}.{ext}`. Grouping by month simplifies S3 inventory and potential archival.
- Lifecycle rule: abort incomplete multipart uploads after 1 day; transition to IA after 90 days; no auto-deletion (messages are retained with the account).
- Orphan cleanup: weekly job (Phase 4 future work) comparing S3 inventory against referenced keys in `messages.attachments`.

### Decision 8: FCM payload updates
**[DEFERRED — Phase 3]** Extend the `push` edge function to include attachment metadata in the data-only FCM payload.

Phase 1 does not modify push notifications. Attachment messages show text content only (or empty body for attachment-only messages) in the FCM payload.

### Decision 9: Links, not inline previews (Phase 1)
**Chosen:** Images and PDFs render as clickable links with a file-type icon and filename. Links open in a new browser tab via presigned GET URL.

**Rationale:** Minimizes UI complexity for initial launch. Full inline rendering (thumbnails, image grid, full-screen viewer) is deferred to Phase 2. This approach ships a working feature quickly without taking on heavy rendering and image-loading infrastructure.

### Decision 10: Attachment-only messages allowed
**Chosen:** The send button is enabled when either text content or files are present. A message with attachments and no text content is valid.

**Rationale:** Teachers should be able to share a photo or document without requiring a text caption. Technically this means changing the send button's disabled condition from `!content.trim()` to `!content.trim() && selectedFiles.length === 0`.

## Risks / Trade-offs

- **[Orphaned S3 objects from failed sends]** → Mitigation: lifecycle rule plus future weekly reconciliation job (Phase 4). Cost impact is small until volume grows.
- **[Secret leakage if edge function env is misconfigured]** → Mitigation: dedicated IAM user scoped to this bucket with `s3:PutObject`, `s3:GetObject` only; rotate on suspicion; never log the AWS secret.
- **[Malicious uploads (scripts masquerading as images, PDF exploits)]** → Mitigation: `Content-Type` constraint in presigned PUT, client validates magic bytes, store `Content-Disposition: attachment` on GETs to force download for PDFs, never `eval` attachment content. Virus scanning deferred as an open question (Phase 4).
- **[Presigned GET call volume]** → Mitigation: batch sign requests per thread load, cache in React Query with staleTime ~23h under the 24h TTL. The 24h TTL dramatically reduces signing volume vs. the original 1h design. Escalation: move to CloudFront signed cookies if volume is still an issue.

## Migration Plan / Rollout

No data migration required.

Rollout order:
1. Provision AWS S3 bucket, IAM user, CORS config, lifecycle rules via Terraform or console (document the steps in `docs/` or the PR).
2. Add Supabase Secrets: `AWS_REGION`, `AWS_S3_BUCKET`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`.
3. Deploy `upload-attachment-url` and `sign-attachment-urls` edge functions.
4. Ship client code behind a feature flag (`NEXT_PUBLIC_ATTACHMENTS_ENABLED`) defaulted off.
5. Smoke test on staging with a real teacher account.
6. Enable flag in production for a single pilot group, then roll out.

Rollback: disable the feature flag — read path continues to render any attachments already sent (they remain valid because the GET signing function stays deployed).

## Open Questions

1. **Virus scanning:** Do we need ClamAV / AWS GuardDuty Malware Protection for S3 before launch, or is it acceptable to defer to Phase 4? Compliance review needed.
2. **CloudFront vs. direct S3 GET URLs:** Benchmark expected request volume before committing to direct signing. CloudFront reduces per-request signing cost if thread load volume is high.
3. **Retention policy:** Do attachments need a max retention window for GDPR/compliance reasons, or do they stay as long as the message row exists?
4. **Per-user upload quota:** What's an acceptable ceiling (50/hour? per-day MB cap?) — product input needed. Rate limiting implementation is deferred to Phase 2.
