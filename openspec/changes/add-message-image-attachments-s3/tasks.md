## 1. AWS Infrastructure

- [ ] 1.1 Create private S3 bucket `encanto-message-attachments-staging` with all public access blocked and SSE-S3 enabled
- [ ] 1.2 Configure CORS on the bucket to allow `PUT`, `GET`, `HEAD` from the app origins (localhost, staging, prod)
- [ ] 1.3 Add lifecycle rules (abort incomplete multipart uploads after 1 day; transition to IA after 90 days)
- [ ] 1.4 Create a dedicated IAM user with a policy scoped to `s3:PutObject` and `s3:GetObject` on that bucket; capture access key/secret
- [ ] 1.5 Repeat 1.1–1.4 for the production bucket `encanto-message-attachments-prod`
- [ ] 1.6 Document the infra setup in `docs/aws-message-attachments.md` (or equivalent) including teardown steps

## 2. Supabase Secrets and Edge Function Scaffolding

- [ ] 2.1 Add `AWS_REGION`, `AWS_S3_BUCKET`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY` as Supabase secrets for staging and prod
- [ ] 2.2 Scaffold `supabase/functions/upload-attachment-url/` following the `push` function pattern, including `deno.json` and shared auth helpers
- [ ] 2.3 Scaffold `supabase/functions/sign-attachment-urls/`
- [ ] 2.4 Scaffold `supabase/functions/generate-pdf-thumbnail/` (and spike a Deno PDF render; if infeasible, scaffold a Lambda fallback)

## 3. upload-attachment-url Edge Function

- [ ] 3.1 Implement JWT parsing and role gate: return 401 if unauthenticated, 403 if not `teacher` or `admin`
- [ ] 3.2 Validate request payload: MIME type in allowlist, declared size ≤ 10 MB, filename sanitization
- [ ] 3.3 Generate S3 key `messages/{yyyy}/{mm}/{uuid}.{ext}` and build a presigned PUT URL with `Content-Type` and `Content-Length-Range` conditions
- [ ] 3.4 Batch endpoint: accept up to 5 file descriptors in one call and return an array of `{ key, url }`
- [ ] 3.5 Per-user rate limit (max 50 URLs per rolling hour) backed by a Supabase table or KV — enforce and return 429 when exceeded
- [ ] 3.6 Structured logging (no secrets) and Sentry integration for the function

## 4. sign-attachment-urls Edge Function

- [ ] 4.1 Accept `[{ messageId, key }]`; resolve `messages` rows and verify the caller is a participant of each
- [ ] 4.2 Return 403 for any unauthorized entry; return 400 for unknown messages/keys
- [ ] 4.3 Generate presigned GET URLs with a 1-hour TTL; return them in the same order as the request
- [ ] 4.4 Add Sentry logging and unit tests (where the project supports them — otherwise just manual verification)

## 5. generate-pdf-thumbnail Edge Function / Lambda

- [ ] 5.1 Spike: can we render a PDF page to an image from a Supabase Deno edge function? Record the outcome in design.md Open Questions.
- [ ] 5.2 If Deno-feasible: implement with `pdf-lib` + Deno canvas and write the thumbnail to S3 under `<key>.thumb.webp`
- [ ] 5.3 If not Deno-feasible: deploy an AWS Lambda with a Function URL, invoke it from the client after PDF upload
- [ ] 5.4 Return `{ thumbnailKey }` on success; return an error object on failure so the client can fall back to the PDF icon

## 6. Client Upload Utilities

- [ ] 6.1 Create `src/utils/uploadAttachment/index.ts` exporting `uploadAttachment(file)` that calls the presigned URL function and PUTs to S3
- [ ] 6.2 Add `src/utils/uploadAttachment/validate.ts` for type/size/count validation with localized error messages (via `next-intl`)
- [ ] 6.3 Add `src/utils/uploadAttachment/heic.ts` that lazy-loads `heic2any` and falls back to raw HEIC on failure
- [ ] 6.4 Add `src/utils/uploadAttachment/pdfThumbnail.ts` that calls the thumbnail function after a successful PDF upload
- [ ] 6.5 Implement per-file progress reporting (XHR `onprogress` since fetch lacks native progress)

## 7. Data Layer Updates

- [ ] 7.1 Add/refine the `Attachment` type in `src/types/messages.types.ts`
- [ ] 7.2 Update `src/queries/messages/send-message.ts` to accept and persist `attachments` on the insert
- [ ] 7.3 Update `src/hooks/UseSendMessageMutation.ts` to pass attachments through
- [ ] 7.4 Add `src/hooks/UseAttachmentUrlsQuery.ts` that batches calls to `sign-attachment-urls` per loaded thread, with staleTime ~50 minutes
- [ ] 7.5 Ensure realtime subscription payloads handle the new attachment shape (React Query cache invalidation paths)

## 8. Message Composer UI

- [ ] 8.1 Add an attachment picker button to `MessageComposer.tsx` (icon + hidden file input accepting the allowed MIME types)
- [ ] 8.2 Show selected files as removable chips before sending, with per-file upload progress
- [ ] 8.3 Disable the picker when the user's role is `parent` (v1 restriction)
- [ ] 8.4 Wire the send action to: validate → upload in parallel → call send mutation with attachments → clear picker state on success
- [ ] 8.5 Show toast on partial failure (abort send, do not persist the message)

## 9. Message Bubble / Thread UI

- [ ] 9.1 Create `MessageAttachments.tsx` component that takes an array of attachments and renders image grid + PDF cards
- [ ] 9.2 Integrate `MessageAttachments` into `MessageBubble.tsx` (or equivalent)
- [ ] 9.3 Implement the full-screen image viewer (use HeroUI Modal + `Image`); support swipe on mobile
- [ ] 9.4 PDF card: show thumbnail if available, generic icon otherwise; open in new tab on click
- [ ] 9.5 Handle loading/error states while presigned GET URLs are being fetched

## 10. Push Notification Updates

- [ ] 10.1 Update `supabase/functions/push/index.ts` to read `attachments` from the new message row
- [ ] 10.2 When the first attachment is an image, sign a short-lived (5 min) thumbnail URL and include it as `firstAttachmentThumbUrl` in the FCM data payload
- [ ] 10.3 Include `attachmentCount` in the payload
- [ ] 10.4 Update `public/firebase-messaging-sw.js` / `generate-firebase-sw.js` template so background notifications pass `image` to `showNotification` when the URL is present
- [ ] 10.5 Update `PushNotificationProvider.tsx` foreground toast to reflect attachments ("📷 Imagen" / "📄 PDF" prefix)

## 11. Feature Flag and Rollout

- [ ] 11.1 Gate the composer picker behind `NEXT_PUBLIC_ATTACHMENTS_ENABLED` (or a PostHog feature flag) defaulted off
- [ ] 11.2 Smoke-test on staging with a teacher account: send image-only, PDF-only, and mixed messages; verify parent render
- [ ] 11.3 Verify read path still works for existing messages with `attachments = null`
- [ ] 11.4 Enable flag for a pilot group in production and monitor Sentry + PostHog for 48 hours
- [ ] 11.5 Enable flag globally once pilot is clean

## 12. Cleanup and Follow-ups

- [ ] 12.1 Update `CLAUDE.md` with the new attachments pattern and edge function references
- [ ] 12.2 Add a short runbook for rotating the IAM user credentials
- [ ] 12.3 File follow-up tickets for: virus scanning, orphan cleanup job, CloudFront migration (if signing volume warrants it), retention policy
