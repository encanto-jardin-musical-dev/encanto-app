# admin-data-cleanup

## Purpose

Defines an admin-only data cleanup capability that allows authenticated admins to preview and permanently delete old `messages`, `tasks`, and `daily_reports` rows (plus their S3 attachment objects) under a PostHog feature flag, with double verification before execution and full i18n support.

## Requirements

### Requirement: Admin-only cleanup access

The cleanup edge function SHALL authenticate the caller and SHALL reject any request whose caller profile does not have `role = 'admin'`. The cleanup page SHALL live under the `/admin` route namespace, consistent with other admin-only screens.

#### Scenario: Admin can call the cleanup function
- **WHEN** an authenticated user whose profile role is `admin` invokes the cleanup function
- **THEN** the request is processed according to its mode

#### Scenario: Non-admin is rejected
- **WHEN** an authenticated user whose profile role is `teacher` or `parent` invokes the cleanup function
- **THEN** the function responds with 403 and deletes nothing

#### Scenario: Unauthenticated call is rejected
- **WHEN** the cleanup function is invoked without a valid auth token
- **THEN** the function responds with an authentication error and deletes nothing

### Requirement: Feature flag gating

The cleanup UI SHALL be gated behind the PostHog feature flag `admin_cleanup`. The `/admin/cleanup` page SHALL render a not-found response when the flag is disabled for the current user, and SHALL render nothing while the flag state is unresolved. The Admin Options dashboard SHALL show the Cleanup shortcut tile only when the flag is enabled. Feature flag hooks SHALL run unconditionally and in stable order, treating both `false` and `undefined` (loading) as off. The flag is a UI gate only; the edge function's server-side admin role check SHALL remain the security boundary and SHALL NOT depend on the flag.

#### Scenario: Flag enabled admin sees the page
- **WHEN** an admin with the `admin_cleanup` flag enabled navigates to `/admin/cleanup`
- **THEN** the cleanup screen is rendered

#### Scenario: Flag disabled user gets not-found
- **WHEN** a user with the `admin_cleanup` flag disabled navigates to `/admin/cleanup`
- **THEN** the not-found page is displayed

#### Scenario: Page renders nothing while the flag resolves
- **WHEN** an admin navigates to `/admin/cleanup` and the flag state has not yet resolved
- **THEN** the screen renders no cleanup content and does not redirect

#### Scenario: Tile hidden when flag is off
- **WHEN** the Admin Options screen renders for a user with the `admin_cleanup` flag disabled or unresolved
- **THEN** the Cleanup shortcut tile is not displayed

#### Scenario: Edge function ignores the flag
- **WHEN** the cleanup function is invoked while the `admin_cleanup` flag is disabled for the caller
- **THEN** the function still processes the request if the caller is an authenticated admin (the flag is not consulted server-side)

### Requirement: Cleanup preview (dry-run)

The cleanup function SHALL support a preview mode that computes, without deleting anything, the number of `messages`, `tasks`, and `daily_reports` rows whose `created_at` is older than a cutoff of one year before the current server time, plus the number of S3 attachment objects referenced by those rows. The preview response SHALL include the exact cutoff timestamp used, per-entity row counts, and per-entity attachment counts.

#### Scenario: Preview returns counts and cutoff
- **WHEN** an admin invokes the cleanup function in preview mode
- **THEN** the response contains the cutoff timestamp and, for each of messages, tasks, and reports, the count of rows older than the cutoff and the count of attachment objects referenced by those rows

#### Scenario: Preview deletes nothing
- **WHEN** an admin invokes the cleanup function in preview mode
- **THEN** no database rows and no S3 objects are deleted

#### Scenario: Preview counts match manual query
- **WHEN** an admin runs a preview
- **THEN** the reported row counts equal the result of counting each table with `created_at` older than the returned cutoff

### Requirement: Double verification before execution

The cleanup function SHALL support an execute mode that runs only when BOTH verifications pass: (1) the request includes the exact cutoff timestamp returned by a prior preview, and (2) the request includes the exact confirmation phrase `ELIMINAR`. Requests missing either verification SHALL be rejected with a 400 error and SHALL delete nothing. Execution SHALL delete only rows with `created_at` older than the provided cutoff, so rows created after the preview are never deleted.

#### Scenario: Execute with valid double verification
- **WHEN** an admin invokes execute mode with the cutoff from a prior preview and the confirmation phrase `ELIMINAR`
- **THEN** the function deletes rows older than that cutoff and returns a deletion summary

#### Scenario: Execute without confirmation phrase is rejected
- **WHEN** an admin invokes execute mode with a valid cutoff but a missing or incorrect confirmation phrase
- **THEN** the function responds with 400 and deletes nothing

#### Scenario: Execute without a cutoff is rejected
- **WHEN** an admin invokes execute mode with the correct phrase but no cutoff timestamp
- **THEN** the function responds with 400 and deletes nothing

#### Scenario: Data created after preview is preserved
- **WHEN** a preview is run at time T and new rows are created before execution
- **THEN** executing with the preview cutoff deletes only rows older than that cutoff, leaving the newer rows intact

### Requirement: Deletion scope

Cleanup SHALL apply only to the `messages`, `tasks`, and `daily_reports` tables, deleting rows whose `created_at` is older than the verified cutoff. It SHALL NOT delete rows from any other table (including `attendance`, `profiles`, `children`, and `groups`), and SHALL NOT delete Supabase Storage avatar or group-image files.

#### Scenario: Only in-scope tables are purged
- **WHEN** an admin executes the cleanup
- **THEN** only `messages`, `tasks`, and `daily_reports` rows older than the cutoff are deleted, and all other tables are unchanged

#### Scenario: Rows newer than the cutoff are preserved
- **WHEN** an admin executes the cleanup
- **THEN** rows in the in-scope tables with `created_at` at or after the cutoff remain

### Requirement: Attachment object cleanup

For each deleted row, the cleanup function SHALL delete the S3 objects referenced in that row's `attachments` JSON. Row deletion SHALL be performed before S3 object deletion, so a failed S3 deletion leaves harmless orphan objects rather than broken references on live rows. Malformed attachment entries SHALL be skipped without failing the run.

#### Scenario: Attachments of deleted rows are removed from S3
- **WHEN** an admin executes the cleanup on rows that reference attachment objects
- **THEN** the referenced S3 objects are deleted after their rows are deleted

#### Scenario: S3 deletion failure does not break the run
- **WHEN** an admin executes the cleanup and some S3 object deletions fail
- **THEN** the rows are still deleted, the failures are reported in the response, and remaining tables continue processing

### Requirement: Cleanup result reporting

A successful execution SHALL return a per-entity summary containing the number of rows deleted, the number of S3 objects deleted, and any per-entity errors encountered.

#### Scenario: Execute returns a per-entity summary
- **WHEN** an admin executes the cleanup
- **THEN** the response reports, for each of messages, tasks, and reports, the rows deleted, the objects deleted, and any error for that entity

### Requirement: Cleanup page flow

The `/admin/cleanup` screen SHALL guide the admin through three steps: (1) run a preview and display the per-entity deletion summary with the cutoff date; (2) require the admin to type the confirmation phrase before the execute action is enabled; (3) on execution, display the per-entity deletion results. The execute action SHALL remain disabled until the typed phrase matches `ELIMINAR` exactly, and SHALL send the preview's cutoff timestamp with the execute request.

#### Scenario: Admin previews before executing
- **WHEN** an admin opens `/admin/cleanup` and runs the preview
- **THEN** the screen displays the cutoff date and per-entity counts of rows and attachments to be deleted, without deleting anything

#### Scenario: Execute disabled until phrase is typed
- **WHEN** the preview summary is displayed and the confirmation input does not contain the exact phrase
- **THEN** the execute action is disabled

#### Scenario: Execute enabled with exact phrase
- **WHEN** the admin types `ELIMINAR` into the confirmation input
- **THEN** the execute action becomes enabled, and activating it sends the execute request with the preview cutoff

#### Scenario: Results are displayed after execution
- **WHEN** the execution completes
- **THEN** the screen displays the per-entity rows deleted, objects deleted, and any reported errors

### Requirement: Localized cleanup UI text

All user-facing text on the cleanup screen — title, step labels, summary table headers, confirmation prompt, execute/preview actions, and result messages — SHALL be sourced from the app's i18n message catalog (`next-intl`) rather than hardcoded literals.

#### Scenario: All cleanup labels come from the message catalog
- **WHEN** the cleanup screen is rendered
- **THEN** every label and message is read from the i18n catalog and no user-facing string is a hardcoded literal in the components
