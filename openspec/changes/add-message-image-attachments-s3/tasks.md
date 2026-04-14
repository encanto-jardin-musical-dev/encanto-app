## 1. AWS Infrastructure

- [x] 1.1 Create private S3 bucket `encanto-message-attachments-staging` with all public access blocked and SSE-S3 enabled
- [x] 1.2 Configure CORS on the bucket to allow `PUT`, `GET`, `HEAD` from the app origins (localhost, staging, prod)
- [x] 1.3 Add lifecycle rules (abort incomplete multipart uploads after 1 day; transition to IA after 90 days)
- [x] 1.4 Create a dedicated IAM user with a policy scoped to `s3:PutObject` and `s3:GetObject` on that bucket; capture access key/secret
- [ ] 1.5 Repeat 1.1–1.4 for the production bucket `encanto-message-attachments-prod`

## 2. Shared Edge Function Utilities

- [x] 2.1 Create `supabase/functions/_shared/cors.ts` — exports `corsHeaders` object and `handleCors(req)` helper that returns a preflight response for OPTIONS requests
- [x] 2.2 Create `supabase/functions/_shared/auth.ts` — exports `getAuthenticatedUser(req, supabase)` that parses the `Authorization: Bearer <token>` header and calls `supabase.auth.getUser(token)`; returns the user or throws 401
- [x] 2.3 Create `supabase/functions/_shared/supabaseClient.ts` — exports `createServiceClient()` using `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` env vars

## 3. upload-attachment-url Edge Function

- [x] 3.1 Scaffold `supabase/functions/upload-attachment-url/index.ts` with `Deno.serve()`, CORS preflight handling via `_shared/cors.ts`
- [x] 3.2 Authenticate the caller using `_shared/auth.ts`; return 401 if unauthenticated
- [x] 3.3 Verify the caller's role is `teacher` or `admin`; return 403 otherwise
- [x] 3.4 Parse and validate request body: MIME type in allowlist (`image/jpeg`, `image/png`, `image/webp`, `application/pdf`), declared size ≤ 10 MB, max 5 files per batch, filename sanitization; return 400 on any violation
- [x] 3.5 Generate S3 keys `messages/{yyyy}/{mm}/{uuid}.{ext}` for each file
- [x] 3.6 Build presigned PUT URLs using `@aws-sdk/s3-request-presigner` with `Content-Type` and `Content-Length-Range` conditions; 15-minute TTL
- [x] 3.7 Return array of `{ key, url }` with CORS headers
- [x] 3.8 Add structured logging (no secrets logged)

## 4. sign-attachment-urls Edge Function

- [x] 4.1 Scaffold `supabase/functions/sign-attachment-urls/index.ts` with `Deno.serve()`, CORS preflight handling
- [x] 4.2 Authenticate the caller using `_shared/auth.ts`; return 401 if unauthenticated
- [x] 4.3 Accept `[{ messageId, key }]` in the request body
- [x] 4.4 For each entry, verify the caller is a participant of the message (for DMs check `sender_id`/`receiver_id`; for group messages join through `child_groups` → `child_guardians`); return 403 for unauthorized entries
- [x] 4.5 Generate presigned GET URLs with a **24-hour TTL** using `@aws-sdk/s3-request-presigner` with `Content-Disposition: attachment` response header override
- [x] 4.6 Return signed URLs in the same order as the request with CORS headers
- [x] 4.7 Add structured logging (no secrets logged)

## 5. Attachment Type Definition

- [x] 5.1 Add `Attachment` type to `src/types/messages.types.ts`: `{ key: string; contentType: string; size: number; name: string }`. Add `MessageAttachments = Attachment[]` alias.

## 6. Client Upload Utilities

- [x] 6.1 Create `src/utils/uploadAttachment/validate.ts` — validates file type (jpeg/png/webp/pdf only), size (≤ 10 MB), and count (≤ 5); returns localized error messages via `next-intl`
- [x] 6.2 Create `src/utils/uploadAttachment/index.ts` — exports `uploadAttachments(files)` that calls `upload-attachment-url` for presigned PUT URLs, PUTs each file to S3 in parallel, and returns `Attachment[]` metadata; implements per-file XHR progress reporting
- [x] 6.3 Handle errors in `uploadAttachments`: if any upload fails, reject the promise with an error that includes which files succeeded/failed

## 7. Data Layer Updates

- [x] 7.1 Update `src/queries/messages/send-messages.ts` to include `attachments` in the destructured fields and in the `messageToSend` insert object
- [x] 7.2 Update `src/hooks/UseSendMessageMutation.ts` to accept and forward `attachments?: MessageAttachments` through the mutation
- [x] 7.3 Add `src/hooks/UseAttachmentUrlsQuery.ts` that calls `sign-attachment-urls` per thread load, with staleTime of ~23 hours (to stay under 24h TTL)

## 8. MessageInput UI

- [x] 8.1 Replace the inert `[+]` button stub in `MessageInput.tsx` with a real attachment picker: connect a hidden `<input type="file" accept="image/jpeg,image/png,image/webp,application/pdf" multiple>` and trigger it on click
- [x] 8.2 Show selected files as removable chips (HeroUI `Chip`) below the text input, displaying filename and file size
- [x] 8.3 Keep the picker hidden/disabled when the user's role is `parent`
- [x] 8.4 Change send button disabled logic from `!content.trim()` to `!content.trim() && selectedFiles.length === 0` (attachment-only messages)
- [x] 8.5 Wire the send action: validate files → upload in parallel (call `uploadAttachments`) → call `sendMessage` mutation with `attachments` → clear picker state on success
- [x] 8.6 Show upload progress per file while uploading (progress bar or indicator on each chip)
- [x] 8.7 Show error toast on upload failure; abort send and preserve the composer state so the user can retry
- [x] 8.8 Gate the entire attachment feature behind `NEXT_PUBLIC_ATTACHMENTS_ENABLED` env var (default off)

## 9. MessageCard Attachment Rendering

- [x] 9.1 Create `src/components/messages/MessageAttachments.tsx` — accepts `attachments: Attachment[]` and `signedUrls: Record<string, string>` props
- [x] 9.2 Render each attachment as a clickable link: file-type icon (image icon for images, document icon for PDFs) + filename; link opens in a new tab via the presigned GET URL
- [x] 9.3 Show a loading skeleton while `signedUrls` are being fetched
- [x] 9.4 Show an inline error state if URL signing fails for a specific attachment (do not crash the whole message)
- [x] 9.5 Integrate `MessageAttachments` into `MessageCard.tsx` below the `<p>{message_content}</p>` element
- [x] 9.6 Verify messages with `attachments: null` render unchanged (backward compatibility)

## 10. Feature Flag

- [x] 10.1 Add `NEXT_PUBLIC_ATTACHMENTS_ENABLED` to `.env.example` (defaulted to empty/false) and document it
- [x] 10.2 Ensure the read path (`MessageAttachments` component + `UseAttachmentUrlsQuery`) works regardless of the flag — only the composer picker is gated, so recipients always see attachments sent before the flag was disabled

## 11. Verification

- [x] 11.1 Smoke test: send an image-only message as a teacher and verify it appears as a clickable link for the recipient
- [x] 11.2 Smoke test: send a PDF-only message as a teacher and verify the link opens the PDF in a new tab
- [x] 11.3 Smoke test: send a mixed (image + PDF) message with no text content (attachment-only) and verify it sends successfully
- [x] 11.4 Smoke test: verify a parent cannot see the attachment picker in `MessageInput`
- [x] 11.5 Verify backward compatibility: existing messages with `attachments = null` render normally
- [x] 11.6 Verify realtime: a new message with attachments received via the Supabase realtime subscription renders the attachment links correctly
- [ ] 11.7 Verify that presigned GET URLs expire after 24 hours and return 403 after expiry
