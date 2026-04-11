## MODIFIED Requirements

### Requirement: Background Notification Rendering

When a push arrives while the app is closed or backgrounded, the Firebase messaging service worker SHALL render **exactly one** system notification whose content and routing reflect the underlying message. The service worker SHALL be the sole renderer of background notifications — the FCM payload MUST NOT include a top-level `notification` block that would cause the browser to auto-display a second notification.

#### Scenario: Single notification per background message

- **WHEN** a push payload arrives while the user has no focused tab
- **THEN** the system SHALL render exactly one system notification via the service worker's `onBackgroundMessage` handler, and the browser SHALL NOT auto-display an additional notification from an FCM `notification` block

#### Scenario: Direct message received in background

- **WHEN** a push payload arrives for a 1:1 message and no app tab is in focus
- **THEN** the service worker SHALL call `showNotification` with the sender's name as title (read from `data.title`), the message preview as body (read from `data.body`), and `tag = 'conversation:<senderId>'` so repeat messages from the same sender collapse per-conversation (not globally)

#### Scenario: Group message received in background

- **WHEN** a push payload arrives for a group message and no app tab is in focus
- **THEN** the service worker SHALL render a notification whose title includes the group name (read from `data.title`) and whose `tag = 'conversation:group:<groupId>'`

#### Scenario: Notification click routes to the thread

- **WHEN** a user clicks a background notification
- **THEN** the service worker SHALL focus an existing tab or open a new window at `/messages/<senderId>` for DMs or the equivalent group thread route for group messages, using the `data` payload to resolve the destination

### Requirement: Supabase Edge Function Dispatch

The system SHALL include a `push` Supabase Edge Function, stored in the repository at `supabase/functions/push/`, that receives database webhook events for `INSERT` on `messages` and dispatches FCM push notifications to all relevant devices using the FCM HTTP v1 API. The dispatched payload SHALL be **data-only** — it MUST NOT contain a top-level `message.notification` block — so that the service worker is the sole renderer of the resulting notification.

#### Scenario: Webhook secret verification

- **WHEN** the function receives a POST
- **THEN** it SHALL verify a shared webhook secret header and reject with 401 if absent or invalid

#### Scenario: Direct message fan-out

- **WHEN** a webhook event fires for a new row where `group_id` is null
- **THEN** the function SHALL load every `device_push_tokens` row whose `user_id = receiver_id` and dispatch one FCM request per token

#### Scenario: Group message fan-out

- **WHEN** a webhook event fires for a new row where `group_id` is set
- **THEN** the function SHALL resolve group members via the `get_user_groups` database function (or equivalent), exclude the sender, and dispatch one FCM request per device token of each remaining member

#### Scenario: Data-only payload shape

- **WHEN** the function builds an FCM request body
- **THEN** `message.notification` SHALL be absent, and `message.data` SHALL include string-valued `title`, `body`, `route`, `conversationId`, `senderId`, `type`, `tag`, and `messageId` fields

#### Scenario: FCM HTTP v1 authentication

- **WHEN** the function dispatches to FCM
- **THEN** it SHALL authenticate using a short-lived OAuth access token minted from the Firebase service-account JSON supplied via `supabase secrets`, and SHALL NOT use the deprecated legacy server key

#### Scenario: Stale token cleanup

- **WHEN** FCM responds with `UNREGISTERED` or `INVALID_ARGUMENT` for a given token
- **THEN** the function SHALL delete the matching row from `device_push_tokens`

#### Scenario: Partial delivery failure is non-fatal

- **WHEN** one or more FCM dispatches in a fan-out fail for transient reasons
- **THEN** the function SHALL log the failures, continue dispatching to remaining tokens, and return a 2xx response so Supabase does not retry the entire fan-out
