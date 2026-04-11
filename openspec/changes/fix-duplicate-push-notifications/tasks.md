## 1. Edge Function payload shape

- [x] 1.1 In `supabase/functions/push/index.ts`, update the `FcmPayload` interface so `message.notification` is removed and `message.data` explicitly includes `title` and `body` as string fields
- [x] 1.2 In `buildFcmPayload`, remove the `notification: { title, body }` block and add `title: senderName` and `body` (existing truncated preview) to the `data` map
- [x] 1.3 Verify all `data` values remain strings (FCM HTTP v1 requirement)

## 2. Firebase messaging service worker template

- [x] 2.1 In `scripts/generate-firebase-sw.js`, update the `onBackgroundMessage` handler to read `notificationTitle` from `data.title || payload.notification?.title || 'Nuevo mensaje'` and `notificationBody` from `data.body || payload.notification?.body || 'Tienes un nuevo mensaje'`
- [x] 2.2 Confirm the rest of the handler (tag resolution, `requireInteraction`, click routing, notification options) is unchanged
- [x] 2.3 Run `npm run prebuild` and inspect `public/firebase-messaging-sw.js` to confirm the regenerated output matches the new template

## 3. Foreground handler audit

- [x] 3.1 Read `src/components/providers/PushNotificationProvider.tsx` and confirm it reads title/body/route from `payload.data` (not `payload.notification`)
- [x] 3.2 If any field is read from `payload.notification`, migrate it to `payload.data` with the same fallback defaults as the SW

## 4. Manual verification

- [x] 4.1 Start dev server with HTTPS (`npm run dev:https`) and deploy the updated Edge Function to a test Supabase project (`supabase functions deploy push`)
- [x] 4.2 Log in on Chrome desktop, grant notification permission, send a DM from another account while the tab is backgrounded → confirm **exactly one** notification appears
- [x] 4.3 Repeat the test for a group message → confirm exactly one notification, correct title and `tag`
- [x] 4.4 Click a background notification → confirm it focuses/opens the correct `/messages/<id>` route
- [x] 4.5 With the app in the foreground on a non-matching route, send a message → confirm a single HeroUI toast appears (no duplicate toast, no system notification)
- [x] 4.6 With the app on the matching conversation route, send a message → confirm no toast and no notification (realtime UI update only)

## 5. Deployment

- [x] 5.1 Deploy the Edge Function (deployed via Supabase MCP as version 7)
- [ ] 5.2 Merge the PR and deploy the frontend so the regenerated SW is served to clients
- [ ] 5.3 Smoke-test production: send one DM and one group message to a backgrounded tab, confirm single notification each
