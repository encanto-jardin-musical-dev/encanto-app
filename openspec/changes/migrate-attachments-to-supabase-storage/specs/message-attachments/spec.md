## ADDED Requirements

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

## MODIFIED Requirements

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

### Requirement: Private bucket with signed URLs on read
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

## REMOVED Requirements

### Requirement: Direct-to-S3 upload via presigned PUT
**Reason**: The attachment storage backend is migrating from AWS S3 to Supabase Storage. Direct-to-S3 uploads via presigned PUT URLs and the `upload-attachment-url` edge function are replaced by the "Attachment upload via Supabase Storage" requirement.
**Migration**: Client upload now uses `supabase.storage.from('message-attachments').upload(...)`. The `upload-attachment-url` edge function becomes dead code and may be deleted; the S3 bucket, scoped IAM user, and `AWS_*` Supabase Secrets are retained (not decommissioned) per product decision. No existing objects are copied into the Supabase bucket — there is no historical data to preserve.
