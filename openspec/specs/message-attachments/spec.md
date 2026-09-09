## ADDED Requirements

### Requirement: Role-gated attachment uploads
The system SHALL allow only users with `teacher` or `admin` role to upload attachments to messages. Parents MUST be prevented from uploading attachments. The role restriction SHALL be enforced by a Supabase Storage RLS policy on the `message-attachments` bucket (INSERT), in addition to any client-side gating.

#### Scenario: Teacher uploads an attachment
- **WHEN** an authenticated user with role `teacher` uploads a valid file to the `message-attachments` bucket
- **THEN** the storage INSERT policy permits the upload and the object is stored

#### Scenario: Parent attempts to upload
- **WHEN** an authenticated user with role `parent` attempts to upload to the `message-attachments` bucket
- **THEN** the storage INSERT policy denies the request and no object is stored

#### Scenario: Unauthenticated caller
- **WHEN** a caller with no valid Supabase session attempts to upload to the `message-attachments` bucket
- **THEN** the request is denied

### Requirement: Allowed file types and sizes
The system SHALL accept only the following MIME types for message attachments: `image/jpeg`, `image/png`, `image/webp`, and `application/pdf`. The maximum file size per attachment MUST be 10 megabytes. A single message MUST NOT contain more than 5 attachments.

#### Scenario: Accepted image upload
- **WHEN** a teacher uploads a 2 MB `image/webp` file
- **THEN** the presigned URL is issued and the upload succeeds

#### Scenario: Rejected MIME type
- **WHEN** a teacher requests an upload URL for `video/mp4`
- **THEN** the edge function returns HTTP 400 with an explanatory error

#### Scenario: Oversized file
- **WHEN** a teacher requests an upload URL declaring a size of 15 MB
- **THEN** the edge function returns HTTP 400 and no URL is issued

#### Scenario: Too many attachments
- **WHEN** a teacher attempts to send a message with 6 attachments
- **THEN** the client blocks the send and surfaces an error explaining the 5-attachment limit

### Requirement: Client-side pre-upload validation
The client SHALL validate file type and size before requesting a presigned URL, and SHALL display an error message when validation fails.

#### Scenario: User selects an unsupported file
- **WHEN** the user picks a `.mov` file in the message composer
- **THEN** the file is rejected locally and an error toast is shown without calling any edge function

### Requirement: Attachment upload via Supabase Storage
The client SHALL upload attachment files to a private Supabase Storage bucket named `message-attachments` using the Supabase Storage client (`supabase.storage.from('message-attachments').upload(...)`). Uploads MUST NOT be proxied through the Next.js server and MUST NOT use AWS S3 or presigned PUT URLs. Each stored object's path SHALL be recorded as the `key` field of the attachment metadata.

#### Scenario: Successful upload
- **WHEN** an authorized teacher or admin uploads a valid file through the message composer
- **THEN** the file is stored in the `message-attachments` bucket and its object path is captured as the attachment `key`

#### Scenario: Upload failure aborts send
- **WHEN** any attachment upload to Supabase Storage fails before the message is sent
- **THEN** the message is not inserted into the `messages` table and the user is shown a retry prompt

#### Scenario: Upload does not touch the Next.js server or S3
- **WHEN** an attachment is uploaded
- **THEN** the file bytes are sent directly to Supabase Storage and no request is made to AWS S3 or a Next.js API route for the upload

### Requirement: Attachment persistence in messages.attachments
The system SHALL persist attachment metadata in the existing `messages.attachments` jsonb column as an array. Each entry MUST include at least the fields `key`, `contentType`, `size`, and `name`.

#### Scenario: Sending a message with one image
- **WHEN** a teacher sends a message with one uploaded image
- **THEN** the inserted `messages` row has `attachments = [{ key, contentType: "image/webp", size, name }]`

#### Scenario: Sending a plain text message
- **WHEN** a user sends a message without attachments
- **THEN** the inserted `messages` row has `attachments = null`

### Requirement: Private bucket with presigned GET on read
The `message-attachments` Supabase Storage bucket SHALL block all public access. When a message participant renders a thread, the system SHALL generate signed URLs via the Supabase Storage client (`createSignedUrls`) for the attachment object paths it needs to display. Access to sign/read an object SHALL be restricted to participants of the message that references that object.

#### Scenario: Participant loads a thread with attachments
- **WHEN** an authenticated participant loads a message thread containing attachments
- **THEN** the client obtains signed URLs for each attachment `key` it needs to render

#### Scenario: Non-participant attempts to read an attachment
- **WHEN** an authenticated user who is not a participant of a message attempts to sign or read that message's attachment object
- **THEN** the request is denied and no signed URL is returned for that object

#### Scenario: Signed URL expires
- **WHEN** the configured signed-URL TTL has elapsed since a URL was generated
- **THEN** the URL no longer authorizes access to the object

### Requirement: HEIC upload handling
**[DEFERRED — Phase 2]** The client SHALL attempt to convert HEIC files to WEBP before upload. When conversion fails, the client MAY upload the raw HEIC file and MUST display a warning indicating the preview may not render on some devices.

**[DEFERRED — Phase 2]** Phase 1 rejects HEIC files at client validation time with an error toast explaining the format is not yet supported.

#### Scenario: Successful HEIC conversion
**[DEFERRED — Phase 2]**
- **WHEN** a teacher selects a `.heic` photo on a supported browser
- **THEN** the client converts it to WEBP and uploads the converted file

#### Scenario: HEIC conversion fallback
**[DEFERRED — Phase 2]**
- **WHEN** HEIC conversion throws an error
- **THEN** the client uploads the original HEIC file and shows a warning toast

### Requirement: PDF thumbnail generation
**[DEFERRED — Phase 3]** After a PDF is uploaded, the system SHALL attempt to generate a WEBP thumbnail of the first page and store it in the same bucket. The thumbnail key MUST be recorded in the attachment entry under `thumbnailKey`.

#### Scenario: Successful thumbnail generation
**[DEFERRED — Phase 3]**
- **WHEN** a PDF upload completes
- **THEN** a WEBP thumbnail of page 1 is written to S3 and `thumbnailKey` is included when the message is sent

#### Scenario: Thumbnail generation failure
**[DEFERRED — Phase 3]**
- **WHEN** thumbnail generation throws or times out
- **THEN** the message is still sent, `thumbnailKey` is omitted, and the UI renders a generic PDF icon

### Requirement: Rendering attachments in the message UI
The message thread SHALL render image and PDF attachments as clickable links. Each link SHALL display a file-type icon and the attachment filename. Clicking a link SHALL open the attachment in a new browser tab via the presigned GET URL.

#### Scenario: Rendering an image message
- **WHEN** a thread contains a message with one image attachment
- **THEN** the bubble shows an image-type icon and the filename as a clickable link that opens in a new tab

#### Scenario: Rendering a PDF message
- **WHEN** a thread contains a message with a PDF attachment
- **THEN** the bubble shows a document icon and the filename as a clickable link that opens the PDF in a new tab

#### Scenario: Rendering a mixed message
- **WHEN** a thread contains a message with 2 images and 1 PDF
- **THEN** each attachment is rendered as a separate clickable link within the same bubble

#### Scenario: Signed URL loading state
- **WHEN** a thread with attachments is loaded and presigned GET URLs are being fetched
- **THEN** the attachment area shows a loading skeleton until the URLs are available

#### Scenario: Signed URL fetch failure
- **WHEN** URL signing fails for a specific attachment
- **THEN** that attachment shows an inline error state; other attachments in the same message are unaffected

### Requirement: Push notifications for image messages
**[DEFERRED — Phase 3]** The FCM push payload SHALL include `attachmentCount` and, when the first attachment is an image, a short-lived presigned URL to its thumbnail so the notification can display a preview image.

#### Scenario: Image message notification
**[DEFERRED — Phase 3]**
- **WHEN** a teacher sends a message with an image attachment
- **THEN** the FCM payload contains `attachmentCount: 1` and `firstAttachmentThumbUrl` pointing at a presigned thumbnail URL

#### Scenario: Text-only message notification
**[DEFERRED — Phase 3]**
- **WHEN** a teacher sends a plain text message
- **THEN** the FCM payload contains `attachmentCount: 0` and no thumbnail URL

#### Scenario: Signing failure on notification path
**[DEFERRED — Phase 3]**
- **WHEN** thumbnail URL signing fails while preparing the FCM payload
- **THEN** the notification is still delivered as text-only and the error is logged

### Requirement: Upload rate limiting
**[DEFERRED — Phase 2]** The upload-URL edge function SHALL enforce a per-user rate limit of at most 50 presigned URL requests per hour.

#### Scenario: Within the limit
**[DEFERRED — Phase 2]**
- **WHEN** a teacher has requested 49 presigned URLs in the past hour and requests one more
- **THEN** the function issues the URL

#### Scenario: Over the limit
**[DEFERRED — Phase 2]**
- **WHEN** a teacher has already requested 50 presigned URLs in the past hour and requests another
- **THEN** the function returns HTTP 429

### Requirement: Attachment-only messages
The system SHALL allow teachers and admins to send messages that contain attachments and no text content. The send button SHALL be enabled when either text content or at least one file is present in the composer.

#### Scenario: Sending an attachment with no text
- **WHEN** a teacher selects one or more files but leaves the text field empty and taps send
- **THEN** the message is sent successfully and the recipient sees the attachment link(s) with no text body

#### Scenario: Send button enabled with files only
- **WHEN** the text input is empty but at least one file is selected in the composer
- **THEN** the send button is enabled and actionable

### Requirement: Runtime feature flag for attachment uploads
The attachment upload UI (file picker and attachment button) SHALL be gated by a PostHog feature flag named `attachments_enabled`. When the flag evaluates to `false` or is unavailable, the upload UI MUST NOT be rendered. The read path (viewing existing attachments) SHALL remain always active regardless of flag state.

#### Scenario: Flag enabled for user
- **WHEN** the `attachments_enabled` PostHog feature flag evaluates to `true` for the current user
- **THEN** the attachment picker button and file input are rendered in the message composer (subject to existing role guards)

#### Scenario: Flag disabled for user
- **WHEN** the `attachments_enabled` PostHog feature flag evaluates to `false` for the current user
- **THEN** the attachment picker button and file input are not rendered, and the user can only send text messages

#### Scenario: Flag unavailable during loading
- **WHEN** the PostHog SDK has not yet loaded or evaluated the `attachments_enabled` flag
- **THEN** the attachment picker MUST NOT be shown (default to off)

#### Scenario: PostHog SDK failure
- **WHEN** the PostHog SDK fails to initialize (e.g., network error, blocked by client)
- **THEN** the attachment picker MUST NOT be shown, and no errors are surfaced to the user

#### Scenario: Viewing attachments with flag off
- **WHEN** the `attachments_enabled` flag is `false` and a message thread contains previously sent attachments
- **THEN** the attachments are displayed normally with presigned GET URLs — only the upload path is gated
