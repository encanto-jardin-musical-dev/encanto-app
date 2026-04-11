## ADDED Requirements

### Requirement: Device Token Registration

The system SHALL allow every authenticated device to register an FCM token that is uniquely associated with the current user and persisted in a `device_push_tokens` table. Each user MAY have multiple active tokens to support multi-device use (phone + laptop + tablet).

#### Scenario: First-time opt-in on a device

- **WHEN** an authenticated user grants notification permission on a device that has no existing token
- **THEN** the system SHALL request an FCM token, upsert a row in `device_push_tokens` keyed by `(user_id, token)`, and record `user_agent` and `last_seen_at`

#### Scenario: Returning user on the same device

- **WHEN** an authenticated user re-opens the app on a device whose FCM token is unchanged
- **THEN** the system SHALL update `last_seen_at` on the existing row without creating a duplicate

#### Scenario: Token refresh by FCM

- **WHEN** Firebase issues a new FCM token for a device (token rotation)
- **THEN** the system SHALL insert the new token row and MAY keep the previous row until it is proven stale by a dispatch failure

#### Scenario: User logs out on a shared device

- **WHEN** a user logs out
- **THEN** the system SHALL delete the current device's `device_push_tokens` row so the next user of the device does not receive the previous user's notifications

### Requirement: Notification Permission Order

The system SHALL request browser notification permission **before** requesting an FCM token, because FCM `getToken()` fails when permission has not yet been granted.

#### Scenario: Fresh user opts in

- **WHEN** a user with `Notification.permission === 'default'` initiates opt-in
- **THEN** the system SHALL call `Notification.requestPermission()` first, and only call `getToken()` if permission is `granted`

#### Scenario: User has previously denied permission

- **WHEN** a user with `Notification.permission === 'denied'` initiates opt-in
- **THEN** the system SHALL NOT call `getToken()` and SHALL surface guidance that permission must be re-enabled in the browser

### Requirement: Service Worker Binding

The system SHALL bind Firebase Cloud Messaging to the dedicated `/firebase-messaging-sw.js` service worker and SHALL NOT pass the Serwist PWA service worker (`/sw.js`) to `getToken` as its `serviceWorkerRegistration`.

#### Scenario: FCM token request

- **WHEN** the client calls `getToken`
- **THEN** the `serviceWorkerRegistration` option SHALL be an explicit `navigator.serviceWorker.register('/firebase-messaging-sw.js')` result

#### Scenario: Serwist service worker lifecycle

- **WHEN** the Serwist service worker (`/sw.js`) installs or activates
- **THEN** it SHALL NOT claim responsibility for FCM background messages and SHALL NOT contain `onBackgroundMessage` handlers

### Requirement: Background Notification Rendering

When a push arrives while the app is closed or backgrounded, the Firebase messaging service worker SHALL render a system notification whose content and routing reflect the underlying message.

#### Scenario: Direct message received in background

- **WHEN** a push payload arrives for a 1:1 message and no app tab is in focus
- **THEN** the service worker SHALL call `showNotification` with the sender's name as title, the message preview as body, and `tag = 'conversation:<senderId>'` so repeat messages from the same sender collapse per-conversation (not globally)

#### Scenario: Group message received in background

- **WHEN** a push payload arrives for a group message and no app tab is in focus
- **THEN** the service worker SHALL render a notification whose title includes the group name and whose `tag = 'conversation:group:<groupId>'`

#### Scenario: Notification click routes to the thread

- **WHEN** a user clicks a background notification
- **THEN** the service worker SHALL focus an existing tab or open a new window at `/messages/<senderId>` for DMs or the equivalent group thread route for group messages, using the `data` payload to resolve the destination

### Requirement: Foreground In-App Notification

When a push arrives while the app is open, the system SHALL handle it via `onMessage` and SHALL NOT fall through to the service worker's system notification.

#### Scenario: User is on the matching thread

- **WHEN** a push for conversation X arrives while the user is viewing `/messages/X`
- **THEN** the system SHALL suppress any visible notification (the realtime subscription already updates the UI)

#### Scenario: User is active in the app but on a different screen

- **WHEN** a push arrives while the user is on any route other than the matching thread
- **THEN** the system SHALL display a HeroUI toast containing the sender name and message preview, and clicking the toast SHALL navigate to the relevant thread

### Requirement: Supabase Edge Function Dispatch

The system SHALL include a `push` Supabase Edge Function, stored in the repository at `supabase/functions/push/`, that receives database webhook events for `INSERT` on `messages` and dispatches FCM push notifications to all relevant devices using the FCM HTTP v1 API.

#### Scenario: Webhook secret verification

- **WHEN** the function receives a POST
- **THEN** it SHALL verify a shared webhook secret header and reject with 401 if absent or invalid

#### Scenario: Direct message fan-out

- **WHEN** a webhook event fires for a new row where `group_id` is null
- **THEN** the function SHALL load every `device_push_tokens` row whose `user_id = receiver_id` and dispatch one FCM request per token

#### Scenario: Group message fan-out

- **WHEN** a webhook event fires for a new row where `group_id` is set
- **THEN** the function SHALL resolve group members via the `get_user_groups` database function (or equivalent), exclude the sender, and dispatch one FCM request per device token of each remaining member

#### Scenario: FCM HTTP v1 authentication

- **WHEN** the function dispatches to FCM
- **THEN** it SHALL authenticate using a short-lived OAuth access token minted from the Firebase service-account JSON supplied via `supabase secrets`, and SHALL NOT use the deprecated legacy server key

#### Scenario: Stale token cleanup

- **WHEN** FCM responds with `UNREGISTERED` or `INVALID_ARGUMENT` for a given token
- **THEN** the function SHALL delete the matching row from `device_push_tokens`

#### Scenario: Partial delivery failure is non-fatal

- **WHEN** one or more FCM dispatches in a fan-out fail for transient reasons
- **THEN** the function SHALL log the failures, continue dispatching to remaining tokens, and return a 2xx response so Supabase does not retry the entire fan-out

### Requirement: Removal of Legacy Token Storage

The system SHALL NOT read from or write to `profiles.fcm_token` or the `subscriptions` table. Both SHALL be removed from the schema.

#### Scenario: Migration applied

- **WHEN** the database migration for this change runs
- **THEN** it SHALL drop the `profiles.fcm_token` column and drop the `subscriptions` table, and regenerated `database.types.ts` SHALL no longer contain either symbol

#### Scenario: No dangling references

- **WHEN** the codebase is searched for `fcm_token` or `from('subscriptions')`
- **THEN** there SHALL be no occurrences outside of historical migration files
