## ADDED Requirements

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
