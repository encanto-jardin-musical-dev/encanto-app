## 1. Baseline & Investigation

- [x] 1.1 Run `supabase functions download push` and commit the current remote function verbatim to `supabase/functions/push/` as the baseline (no edits yet) so diffs are reviewable
- [x] 1.2 Review the downloaded function and capture in `supabase/functions/push/README.md` what it currently does, what tables it reads/writes, and any surprising behavior
- [x] 1.3 Inspect the existing `new_message` Supabase database webhook in the dashboard; document its current trigger, headers, target URL, and whether a webhook secret is set (note findings in `supabase/functions/push/README.md`)
- [x] 1.4 Read `src/types/database.types.ts` to confirm the `messages` table shape (`group_id`, `receiver_id`, `sender_id`, content fields) so the fan-out queries in the Edge Function match reality
- [x] 1.5 Identify the group-thread route in `src/app/messages/` so the notification click handler can route there (or confirm there is no dedicated route, in which case fall back to `/messages`)

## 2. Database — additive migration

- [x] 2.1 Create migration `create_device_push_tokens` with table `device_push_tokens (id uuid pk, user_id uuid fk -> auth.users, token text unique not null, user_agent text, last_seen_at timestamptz default now(), created_at timestamptz default now())`
- [x] 2.2 Add index on `user_id`
- [x] 2.3 Enable RLS and add policies: authenticated users can `select`/`insert`/`update`/`delete` rows where `user_id = auth.uid()`
- [x] 2.4 Run migration locally via `supabase db reset` (dev) and regenerate types: `supabase gen types typescript --local > src/types/database.types.ts`
- [x] 2.5 Deploy this additive migration to staging; verify table + policies via SQL console

## 3. Secrets & environment

- [x] 3.1 Upload the Firebase service-account JSON to Supabase secrets as `FIREBASE_SERVICE_ACCOUNT_JSON` (base64 or JSON string, match however the function will read it) on both staging and prod projects
- [x] 3.2 Generate a strong random `PUSH_WEBHOOK_SECRET`, set it as a Supabase secret on both projects
- [x] 3.3 Set `SUPABASE_SERVICE_ROLE_KEY` as a function secret on both projects so the function can delete stale tokens
- [x] 3.4 Document required secrets and setup steps in `supabase/functions/push/README.md`

## 4. Edge Function rewrite (`supabase/functions/push/`)

- [x] 4.1 Add a `verifyWebhookSecret(request)` helper that reads `x-push-webhook-secret` and compares against `PUSH_WEBHOOK_SECRET` using constant-time comparison; reject with 401 on mismatch
- [x] 4.2 Add a `getFcmAccessToken()` helper that reads `FIREBASE_SERVICE_ACCOUNT_JSON`, builds a JWT assertion (RS256 via `crypto.subtle`), exchanges it at `https://oauth2.googleapis.com/token` for an access token, and caches it in module scope until ~60s before expiry
- [x] 4.3 Add a `resolveRecipients(messageRow)` helper: for DMs return `[receiver_id]`; for group messages resolve members via `get_user_groups` (or the correct RPC per task 1.4), excluding `sender_id`
- [x] 4.4 Add a `loadDeviceTokens(userIds)` helper using the service-role Supabase client that returns an array of `{ user_id, token }`
- [x] 4.5 Add a `buildFcmPayload(messageRow, recipientContext)` helper that returns `{ message: { token, notification: { title, body }, data: { route, conversationId, senderId, type } } }`, where `data.route` is `/messages/<senderId>` for DMs or the group thread route for groups
- [x] 4.6 Add a `dispatchToToken(accessToken, payload)` helper that POSTs to `https://fcm.googleapis.com/v1/projects/<project-id>/messages:send`, returns `{ ok: true }` or `{ ok: false, error }`
- [x] 4.7 Add a `handleDispatchFailure(token, error)` helper that deletes the matching `device_push_tokens` row on `UNREGISTERED` or `INVALID_ARGUMENT`
- [x] 4.8 Wire the main handler: verify secret → parse webhook payload → resolve recipients → load tokens → `Promise.allSettled` dispatch → cleanup stale tokens → return 200 with a small JSON summary
- [x] 4.9 During the transition window, keep a temporary fallback that also reads `profiles.fcm_token` when no `device_push_tokens` rows exist for a user (removed in task 8.3)
- [x] 4.10 Deploy the new function to staging: `supabase functions deploy push --project-ref <staging>`

## 5. Webhook configuration

- [x] 5.1 In Supabase dashboard, verify or recreate the `new_message` database webhook: table `public.messages`, event `INSERT`, method `POST`, URL `https://<staging-ref>.functions.supabase.co/push`, headers include `x-push-webhook-secret: $PUSH_WEBHOOK_SECRET`
- [x] 5.2 Trigger a manual INSERT into `messages` on staging and confirm the function logs show a 200 response with the correct recipient and token counts
- [x] 5.3 Repeat the webhook configuration on the production project (do not enable traffic to production yet — production is still on the legacy path until the client ships)

## 6. Client — FCM service worker & token registration

- [x] 6.1 Update `scripts/generate-firebase-sw.js` template: use `tag = 'conversation:<conversationId>'` derived from `payload.data`, set `data.route` for click routing, read `route` in the `notificationclick` handler and call `clients.openWindow(data.route)` (or focus matching existing client)
- [x] 6.2 Update the template's hardcoded Firebase SDK version to match the installed `firebase` package version (or parameterize it from `package.json`)
- [x] 6.3 In `src/utils/pushNotifications/index.ts`, rewrite `registerServiceWorker` to register `/firebase-messaging-sw.js` explicitly with scope `/firebase-cloud-messaging-push-scope`, not `/sw.js`
- [x] 6.4 In the same file, move `Notification.requestPermission()` to run *before* `getToken()`; abort and return `'denied'` if permission is not `'granted'`
- [x] 6.5 Delete the 2-second `setTimeout` and the polling `waitForMessaging` workaround in `src/lib/firebase/firebaseConfig.ts`; initialize messaging synchronously inside the browser-only block
- [x] 6.6 Remove `src/utils/pushNotifications/storeFCMToken.ts`; replace with `storeDeviceToken.ts` (server action) that upserts `(user_id, token)` into `device_push_tokens` and updates `last_seen_at`
- [x] 6.7 Add `removeDeviceToken.ts` (server action) that deletes the row matching `(user_id, token)`
- [x] 6.8 Cache the last-seen token in `localStorage`; skip upsert if token unchanged and `last_seen_at` is fresh (< 24h), to avoid a roundtrip on every page load
- [x] 6.9 Ensure `src/app/sw.ts` (the Serwist worker) contains no FCM logic and document with a comment that FCM lives in the separate `/firebase-messaging-sw.js`

## 7. Client — foreground handler & logout

- [x] 7.1 Create `src/components/providers/PushNotificationProvider.tsx` that calls `onMessage` inside a `useEffect`, reads the current pathname via a ref updated from `usePathname()`, and dispatches HeroUI toasts via `addToast` when the pathname does not match the incoming message's conversation
- [x] 7.2 Toast content: sender name as title, message preview as body, click handler calls `router.push(data.route)`
- [x] 7.3 Mount `<PushNotificationProvider />` inside `src/app/providers.tsx` alongside Jotai / React Query / HeroUI providers
- [x] 7.4 Find the logout handler (likely in auth utilities or user menu); before signing the user out of Supabase, call `removeDeviceToken(currentToken)` so the delete is authenticated
- [x] 7.5 Add all new user-facing toast strings to `messages/es.json` and access them via `next-intl`

## 8. Cleanup & destructive migration

- [x] 8.1 Verify on staging for at least a few hours: tokens persist, multi-device works, background pushes render on Chrome / Edge / Safari, foreground toast appears on non-thread routes, clicking notifications/toasts routes to the right thread
- [x] 8.2 Deploy the Edge Function and client to production; confirm the same checks in production for a short soak period
- [x] 8.3 Remove the temporary `profiles.fcm_token` fallback from the Edge Function (task 4.9) and redeploy
- [x] 8.4 Create destructive migration: `ALTER TABLE profiles DROP COLUMN fcm_token;` and `DROP TABLE subscriptions;`
- [x] 8.5 Apply the destructive migration on staging; regenerate types; verify build + lint pass
- [x] 8.6 Apply the destructive migration on production
- [x] 8.7 Grep the codebase for any remaining references to `fcm_token` or `from('subscriptions')` outside migration files; remove any dead code

## 9. Verification

- [x] 9.1 Manual QA matrix: Chrome desktop, Edge desktop, Safari macOS, Safari iOS (PWA-installed), Firefox desktop — for each: opt-in flow, single-device background push, multi-device background push, foreground toast on non-thread route, foreground suppression on matching thread, click routing, logout removes token
- [x] 9.2 Manual QA for group messages: teacher sends a group message, verify every enrolled parent device receives a push, verify teacher (the sender) does not
- [x] 9.3 Stale-token cleanup: manually insert a bogus token row in `device_push_tokens`, trigger a message, confirm the function deletes the bogus row after FCM returns `UNREGISTERED`
- [x] 9.4 Webhook secret rejection: POST to the function URL without the header, confirm 401
- [x] 9.5 Add a short note to `CLAUDE.md` under "Push Notifications" describing the new architecture and where the Edge Function / SW / provider live, so future agents don't re-derive it
