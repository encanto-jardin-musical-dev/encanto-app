## Why

Teachers and administrators currently can only send plain-text messages to parents, which makes it hard to share photos of classroom activities or distribute PDF documents (permission slips, reports, circulars). Adding image and PDF attachments — stored in AWS S3 and referenced from the existing `messages.attachments` jsonb column — closes a long-standing feature gap in parent-teacher communication without requiring schema migrations.

## What Changes

- Add a new Supabase Edge Function (`upload-attachment-url`) that issues presigned S3 PUT URLs. Only users with `teacher` or `admin` role may call it.
- Configure an AWS S3 bucket (private, server-side encrypted) to host message attachments. Public read access is served through a CloudFront distribution or time-limited GET presigned URLs.
- Client-side upload flow: request presigned URL → validate file client-side → PUT directly to S3 → include attachment metadata when calling the `sendMessage` mutation.
- Persist attachments in the existing `messages.attachments` jsonb column as an array of `{ key, url, contentType, size, name, thumbnailKey? }` objects. No schema migration required.
- Server-side validation in the edge function: file type (jpeg/png/webp/heic/pdf), size (max 10MB), filename sanitization, attachment count per message (max 5).
- PDF thumbnail generation: a second edge function (or inline step) renders the first page of uploaded PDFs to a webp thumbnail and stores `thumbnailKey` alongside the PDF.
- HEIC handling: client converts HEIC → webp before upload (fallback to raw HEIC upload if conversion fails).
- Message UI additions: attachment picker in `MessageComposer`, attachment previews (image grid + PDF card with thumbnail) in `MessageBubble`, full-screen image viewer.
- FCM push payload updates: include attachment count/first thumbnail URL so push notifications can preview images.
- Logout cleanup: no change required — attachments stay in S3 and are referenced by the message row lifecycle.

## Capabilities

### New Capabilities
- `message-attachments`: Uploading, validating, storing, and rendering image/PDF attachments on direct and group messages. Covers AWS S3 integration, the presigned-URL edge function, role-gated access, and the client send/receive flow.

### Modified Capabilities
<!-- None — push-notifications spec does not define attachment behavior at the requirement level. -->

## Impact

- **New infrastructure**: AWS S3 bucket + IAM user/role, CloudFront distribution (optional), Supabase secrets for AWS credentials.
- **New edge function**: `supabase/functions/upload-attachment-url/` (plus optional PDF thumbnail function).
- **Modified code**:
  - `src/components/messages/MessageComposer.tsx` — attachment picker UI and upload orchestration.
  - `src/components/messages/MessageBubble.tsx` (and related) — render attachments.
  - `src/queries/messages/send-message.ts` — accept attachments array.
  - `src/hooks/UseSendMessageMutation.ts` — pass attachments through.
  - `src/utils/` — new `uploadAttachment.ts` helper and client-side validators.
  - `supabase/functions/push/index.ts` — extend FCM payload with attachment preview.
- **New dependencies** (candidates): `@aws-sdk/client-s3` + `@aws-sdk/s3-request-presigner` (edge function only), `heic2any` or `heic-convert` (client), `pdfjs-dist` or `pdf-lib` (thumbnail generation).
- **Env vars**: `AWS_REGION`, `AWS_S3_BUCKET`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY` (Supabase function secrets). `NEXT_PUBLIC_S3_PUBLIC_URL` or CloudFront domain (Vercel env).
- **Security**: RLS on `messages` already gates read access; presigned GET URLs expire in 1 hour; S3 bucket blocks public ACLs.
- **No breaking changes**: existing messages with `attachments: null` continue to render unchanged.
