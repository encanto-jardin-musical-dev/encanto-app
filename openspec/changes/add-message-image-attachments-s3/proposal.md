## Why

Teachers and administrators currently can only send plain-text messages to parents, which makes it hard to share photos of classroom activities or distribute PDF documents (permission slips, reports, circulars). Adding image and PDF attachments — stored in AWS S3 and referenced from the existing `messages.attachments` jsonb column — closes a long-standing feature gap in parent-teacher communication without requiring schema migrations.

## What Changes

- Add a new Supabase Edge Function (`upload-attachment-url`) that issues presigned S3 PUT URLs. Only users with `teacher` or `admin` role may call it.
- Configure an AWS S3 bucket (private, server-side encrypted) to host message attachments. Access is served through time-limited GET presigned URLs (24-hour TTL).
- Client-side upload flow: request presigned URL → validate file client-side → PUT directly to S3 → include attachment metadata when calling the `sendMessage` mutation.
- Persist attachments in the existing `messages.attachments` jsonb column as an array of `{ key, contentType, size, name }` objects. No schema migration required.
- Server-side validation in the edge function: file type (jpeg/png/webp/pdf), size (max 10MB), filename sanitization, attachment count per message (max 5).
- Message UI additions: attachment picker in `MessageInput`, attachments rendered as clickable links (file-type icon + filename) that open in a new browser tab.
- Attachment-only messages are allowed: the send button is enabled when either text content or files are present.

## Capabilities

### New Capabilities
- `message-attachments`: Uploading, validating, storing, and rendering image/PDF attachments on direct and group messages. Covers AWS S3 integration, the presigned-URL edge functions, role-gated access, and the client send/receive flow.

### Modified Capabilities
<!-- None — push-notifications spec does not define attachment behavior at the requirement level. -->

## Impact

- **New infrastructure**: AWS S3 bucket + IAM user/role, Supabase secrets for AWS credentials.
- **New edge functions**: `supabase/functions/upload-attachment-url/`, `supabase/functions/sign-attachment-urls/`.
- **Modified code**:
  - `src/components/messages/MessageInput.tsx` — attachment picker UI and upload orchestration.
  - `src/components/messages/MessageCard.tsx` (and related) — render attachments as links.
  - `src/queries/messages/send-messages.ts` — accept attachments array.
  - `src/hooks/UseSendMessageMutation.ts` — pass attachments through.
  - `src/utils/` — new `uploadAttachment.ts` helper and client-side validators.
- **New dependencies** (candidates): `@aws-sdk/client-s3` + `@aws-sdk/s3-request-presigner` (edge functions only).
- **Env vars**: `AWS_REGION`, `AWS_S3_BUCKET`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY` (Supabase function secrets). `NEXT_PUBLIC_ATTACHMENTS_ENABLED` feature flag.
- **Security**: RLS on `messages` already gates read access; presigned GET URLs expire in 24 hours; S3 bucket blocks public ACLs.
- **No breaking changes**: existing messages with `attachments: null` continue to render unchanged.

## Phased Delivery

### Phase 1 (this change)
- Images (jpeg/png/webp) and PDFs only
- Teachers/admins only can attach
- Render as clickable links that open in a new tab (file-type icon + filename)
- 24-hour TTL on presigned GET URLs
- Attachment-only messages allowed (no text required)

### Phase 2 (future)
- Inline image previews (thumbnails rendered in the message bubble)
- Image grid layout for multi-image messages
- Full-screen image viewer
- HEIC support (client-side conversion via `heic2any` before upload)

### Phase 3 (future)
- PDF thumbnails (first-page thumbnail generated server-side)
- Push notification attachment previews (FCM payload includes thumbnail URL)
- Rate limiting on the upload-URL edge function

### Phase 4 (future)
- CloudFront distribution (signed cookies replacing per-object presigned GET URLs)
- Virus scanning (ClamAV / AWS GuardDuty Malware Protection)
- Orphan cleanup job (reconcile S3 inventory vs. referenced keys in `messages.attachments`)
