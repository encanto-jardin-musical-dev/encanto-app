## MODIFIED Requirements

### Requirement: Cleanup preview (dry-run)

The cleanup function SHALL support a preview mode that computes, without deleting anything, the number of `messages`, `tasks`, and `daily_reports` rows whose `created_at` is older than a cutoff of one year before the current server time, plus the number of Supabase Storage attachment objects (in the private `message-attachments` bucket) referenced by those rows. The preview response SHALL include the exact cutoff timestamp used, per-entity row counts, and per-entity attachment counts.

#### Scenario: Preview returns counts and cutoff
- **WHEN** an admin invokes the cleanup function in preview mode
- **THEN** the response contains the cutoff timestamp and, for each of messages, tasks, and reports, the count of rows older than the cutoff and the count of attachment objects referenced by those rows

#### Scenario: Preview deletes nothing
- **WHEN** an admin invokes the cleanup function in preview mode
- **THEN** no database rows and no Supabase Storage objects are deleted

#### Scenario: Preview counts match manual query
- **WHEN** an admin runs a preview
- **THEN** the reported row counts equal the result of counting each table with `created_at` older than the returned cutoff

### Requirement: Deletion scope

Cleanup SHALL apply only to the `messages`, `tasks`, and `daily_reports` tables, deleting rows whose `created_at` is older than the verified cutoff. It SHALL NOT delete rows from any other table (including `attendance`, `profiles`, `children`, and `groups`), and SHALL NOT delete Supabase Storage avatar or group-image files. Attachment object deletion SHALL be scoped to the `message-attachments` bucket only.

#### Scenario: Only in-scope tables are purged
- **WHEN** an admin executes the cleanup
- **THEN** only `messages`, `tasks`, and `daily_reports` rows older than the cutoff are deleted, and all other tables are unchanged

#### Scenario: Rows newer than the cutoff are preserved
- **WHEN** an admin executes the cleanup
- **THEN** rows in the in-scope tables with `created_at` at or after the cutoff remain

#### Scenario: Other storage buckets are untouched
- **WHEN** an admin executes the cleanup
- **THEN** only objects in the `message-attachments` bucket are removed, and avatar/group-image buckets are unchanged

### Requirement: Attachment object cleanup

For each deleted row, the cleanup function SHALL delete the Supabase Storage objects referenced in that row's `attachments` JSON, via the Supabase Storage client (`supabase.storage.from('message-attachments').remove(...)`). Deletion SHALL NOT use AWS S3 or the `@aws-sdk/*` libraries, and SHALL NOT require any `AWS_*` secrets. Row deletion SHALL be performed before Storage object deletion, so a failed object deletion leaves harmless orphan objects rather than broken references on live rows. Malformed attachment entries SHALL be skipped without failing the run.

#### Scenario: Attachments of deleted rows are removed from Supabase Storage
- **WHEN** an admin executes the cleanup on rows that reference attachment objects
- **THEN** the referenced objects in the `message-attachments` bucket are deleted after their rows are deleted, using the Supabase Storage API

#### Scenario: Storage deletion failure does not break the run
- **WHEN** an admin executes the cleanup and some Storage object deletions fail
- **THEN** the rows are still deleted, the failures are reported in the response, and remaining tables continue processing

#### Scenario: No AWS dependency
- **WHEN** the cleanup function runs in any mode
- **THEN** it performs no AWS S3 calls and requires no AWS credentials

## ADDED Requirements

### Requirement: Orphaned attachment sweep

The cleanup function SHALL support an orphan sweep that removes Supabase Storage objects in the `message-attachments` bucket that are (a) not referenced by the `attachments` JSON of any `messages`, `tasks`, or `daily_reports` row, AND (b) older than a cutoff of one year before the current server time. The one-year age guard SHALL protect recently uploaded objects whose owning row insert may still be in flight. The sweep SHALL be admin-only and SHALL follow the same preview-first and typed-confirmation (`ELIMINAR`) safeguards as row cleanup.

#### Scenario: Orphan preview counts unreferenced aged objects
- **WHEN** an admin invokes the function in `orphan-preview` mode
- **THEN** the response reports the count of `message-attachments` objects that are unreferenced and older than the one-year cutoff, plus a sample of their keys, and deletes nothing

#### Scenario: Orphan execute deletes only aged unreferenced objects
- **WHEN** an admin invokes `orphan-execute` with the cutoff from a prior orphan preview and the confirmation phrase `ELIMINAR`
- **THEN** only unreferenced objects older than the cutoff are removed via the Supabase Storage API, and the response reports the number of objects deleted

#### Scenario: Referenced objects are never swept
- **WHEN** an orphan sweep runs while objects are referenced by live rows
- **THEN** those referenced objects are not deleted, regardless of age

#### Scenario: Recent unreferenced objects are protected
- **WHEN** an orphan sweep runs and an unreferenced object is newer than the one-year cutoff
- **THEN** that object is not deleted

#### Scenario: Orphan execute requires double verification
- **WHEN** an admin invokes `orphan-execute` without the prior cutoff or without the exact phrase `ELIMINAR`
- **THEN** the function responds with 400 and deletes nothing

#### Scenario: Orphan sweep is admin-only
- **WHEN** a non-admin or unauthenticated caller invokes an orphan mode
- **THEN** the function rejects the request and deletes nothing
