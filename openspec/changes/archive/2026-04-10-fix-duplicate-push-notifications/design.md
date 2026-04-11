## Context

The push pipeline was introduced in PR #89 (`feat(push-notifications): overhaul FCM architecture for multi-device support`). The current Edge Function at `supabase/functions/push/index.ts` builds an FCM HTTP v1 payload that contains both:

```ts
message: {
  token,
  notification: { title, body },   // <-- causes auto-display
  data: { route, conversationId, ... }
}
```

When FCM delivers a payload that contains a `notification` block, the browser (Chrome/Edge) **auto-displays** a system notification without giving the page JavaScript the chance to suppress it. **In addition**, because the payload also has a `data` block, `firebase-messaging-sw.js` still receives the message via `onBackgroundMessage` and calls `self.registration.showNotification(...)` a second time. Result: **two notifications per message**.

This is a well-documented FCM behavior: background handlers only fully control rendering when the payload is **data-only**.

## Goals / Non-Goals

**Goals:**
- Users receive exactly one background push notification per message.
- The single rendered notification preserves current behavior: correct title, body, per-conversation tag, and click routing.
- Foreground toast behavior (`PushNotificationProvider`) is unchanged.
- Fix is deployable without client-side migration — existing registered tokens keep working.

**Non-Goals:**
- Changing which users receive pushes or how fan-out works.
- Reworking the two-service-worker split.
- Adding iOS Safari PWA support (data-only messages have known quirks there — tracked separately if needed).
- Adding notification grouping/badging beyond today's per-conversation `tag`.

## Decisions

### Decision 1: Send data-only FCM payloads

**Choice**: Remove `message.notification` from the FCM HTTP v1 payload in `buildFcmPayload`. Move `title` and `body` into `message.data` as string fields. The service worker's `onBackgroundMessage` handler reads them from `payload.data` and renders the notification.

**Why**: Chrome only lets the SW fully own rendering when there is no `notification` block. Leaving it in means either (a) two notifications (current bug) or (b) suppressing the SW handler, which would break our per-conversation `tag` and click routing logic.

**Alternative considered**: Keep `notification` and remove `onBackgroundMessage`. Rejected — we lose control over `tag`, `data`, `requireInteraction`, and click routing, and the fallback auto-rendering ignores our `data.route`.

### Decision 2: Populate `data.title` and `data.body` in the Edge Function

**Choice**: Add two new keys to the `data` map emitted by `buildFcmPayload`:

```ts
data: {
  title: senderName,
  body,
  route, conversationId, senderId, type, tag, messageId,
}
```

FCM HTTP v1 requires all `data` values to be strings, which they already are.

**Why**: The SW currently reads `payload.notification?.title || 'Nuevo mensaje'`. Once `notification` is removed, it needs a source for title/body. Using `data` keeps everything in one place and keeps the contract explicit.

### Decision 3: Update the SW template to read title/body from `data`

**Choice**: In `scripts/generate-firebase-sw.js`, change the `onBackgroundMessage` handler to prefer `data.title` / `data.body`, keeping the existing default fallbacks (`'Nuevo mensaje'` / `'Tienes un nuevo mensaje'`) for safety.

**Why**: The handler needs to work against the new payload shape. Fallbacks are defensive in case an old queued message (or a future caller) omits the fields.

### Decision 4: No changes to `PushNotificationProvider` (foreground path)

**Verification required, not a change**: `PushNotificationProvider` reads from `payload.data` already (route resolution, etc.). Audit it to confirm nothing depends on `payload.notification`. If it does, migrate those reads to `payload.data.title` / `payload.data.body`.

## Risks / Trade-offs

- **[Risk]** Stale SW on already-opened clients could still double-render until it updates → **Mitigation**: The generated SW already calls `skipWaiting()` + `clients.claim()` on install/activate, so the new version takes over on next page load. Users with very long-lived tabs may see one more duplicate before refresh; acceptable.
- **[Risk]** iOS Safari PWA background handling differs for data-only messages → **Mitigation**: We do not currently support iOS Safari PWA notifications in production; no regression. If added later, revisit.
- **[Risk]** FCM enforces a ~4KB data-payload limit; adding `title` and `body` grows the payload slightly → **Mitigation**: Body is already truncated to 100 chars in the Edge Function. We stay well under 4KB.
- **[Risk]** A queued pre-change payload (notification + data) delivered after the new SW deploys would still double-render (Chrome auto-displays + SW shows its own) → **Mitigation**: Message queue TTL is short; transient at rollout only.

## Migration Plan

1. Update `supabase/functions/push/index.ts` to remove `notification` and add `title`/`body` to `data`.
2. Update `scripts/generate-firebase-sw.js` template to read title/body from `data`.
3. Run `npm run prebuild` to regenerate `public/firebase-messaging-sw.js`.
4. Deploy Edge Function: `supabase functions deploy push`.
5. Merge + deploy frontend so the new SW is served.
6. Manually verify on Chrome desktop + Android Chrome: send a message to a backgrounded tab; confirm a single notification appears, title/body/click routing intact.

**Rollback**: Revert the commit and redeploy the Edge Function. The SW will regenerate to the prior shape on next build.
