## Why

Push notifications for new messages do not reach users today. Background pushes never render because the app points Firebase Messaging at the Serwist service worker (`/sw.js`), which has no `onBackgroundMessage` handler, while the Firebase-specific service worker (`/firebase-messaging-sw.js`) is generated but never registered. Foreground notifications do not exist at all — `onMessage` is exported but never wired. On top of that, the current token model (`profiles.fcm_token`, a single column) cannot support multi-device users, and an unused `subscriptions` table from an abandoned Web Push approach still lives in the schema. Parents and teachers miss conversations because of this, which defeats the core messaging value of the product.

## What Changes

- **BREAKING** Remove `profiles.fcm_token` and the unused `subscriptions` table; introduce a new `device_push_tokens` table keyed by user + FCM token to support multi-device registration.
- Fix the service-worker registration path so Firebase Messaging binds to `/firebase-messaging-sw.js` (not the Serwist SW) and background `showNotification` fires reliably for both 1:1 and group messages.
- Request `Notification.requestPermission()` **before** `getToken()` so fresh users get a valid token on first opt-in.
- Add a foreground `onMessage` handler in the providers tree that:
  - shows a HeroUI toast when the user is active in the app but not viewing the matching message thread
  - stays silent when the user is already on the thread
- Pull the Supabase `push` Edge Function into the repo (`supabase/functions/push/`) as the source of truth, audit the `new_message` webhook configuration, and rewrite the function to:
  - verify the webhook secret
  - resolve recipients for both direct messages (`receiver_id`) and group messages (via `get_user_groups`)
  - fan out to all `device_push_tokens` rows per recipient using FCM HTTP v1 (service-account OAuth), not the legacy server key
  - delete stale tokens on `UNREGISTERED` / `INVALID_ARGUMENT` responses
- Update `firebase-messaging-sw.js` so notifications use a per-conversation tag (no more single-tag collapse) and the click handler opens `/messages/<senderId>` with the conversation context, not just `/`.
- Add a `storeDeviceToken` / `removeDeviceToken` pair (server actions) that upsert on login / token refresh and delete on logout.

## Capabilities

### New Capabilities
- `push-notifications`: End-to-end delivery of FCM push notifications for new messages, including client-side token lifecycle (registration, refresh, removal), multi-device fan-out, background rendering via the dedicated Firebase service worker, foreground in-app toast behavior, and the server-side dispatch Edge Function that bridges Supabase message inserts to FCM HTTP v1.

### Modified Capabilities
<!-- None — there are no existing specs in openspec/specs/ to modify. -->

## Impact

- **Database (BREAKING)**: migration drops `profiles.fcm_token` column and the `subscriptions` table; creates `device_push_tokens` with RLS. Generated `src/types/database.types.ts` must be regenerated.
- **Supabase Edge Function**: new `supabase/functions/push/` directory becomes source of truth; existing remote function replaced on deploy. `new_message` database webhook configuration audited / re-created.
- **Client code**: `src/utils/pushNotifications/` rewritten (`index.ts`, `storeFCMToken.ts` → `storeDeviceToken.ts`, new `removeDeviceToken.ts`); `src/lib/firebase/firebaseConfig.ts` simplified (drop `waitForMessaging` polling workaround); `src/app/sw.ts` stops claiming to handle FCM; `scripts/generate-firebase-sw.js` template updated for per-conversation tag and smarter click routing.
- **Providers**: new foreground FCM provider added to `src/app/providers.tsx` that listens via `onMessage` and dispatches HeroUI toasts based on current route.
- **Secrets / env**: Firebase service-account JSON (already available) must be wired into the Edge Function environment via `supabase secrets set`. Webhook signing secret added.
- **Logout flow**: must call `removeDeviceToken` so a shared device doesn't keep receiving pushes for the previous user.
- **Out of scope** (separate proposals): unread-count badge system, `messages.read_at` column, `navigator.setAppBadge()`, in-app notification inbox, notification preferences beyond on/off.
