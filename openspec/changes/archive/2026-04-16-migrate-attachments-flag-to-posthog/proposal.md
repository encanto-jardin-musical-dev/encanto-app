## Why

The attachment upload feature is currently gated by the `NEXT_PUBLIC_ATTACHMENTS_ENABLED` environment variable, which requires a redeploy to toggle and applies globally across all users. Migrating this flag to PostHog feature flags enables runtime toggling without deploys, per-user/per-group rollouts, and centralized flag management alongside the existing `messages_search_bar` PostHog flag.

## What Changes

- Replace the `NEXT_PUBLIC_ATTACHMENTS_ENABLED` env var check in `MessageInput.tsx` with PostHog's `useFeatureFlagEnabled` hook, using a new flag named `attachments_enabled`.
- Remove the `NEXT_PUBLIC_ATTACHMENTS_ENABLED` entry from `.env.example` and `.env.local`.
- Create the `attachments_enabled` feature flag in PostHog (manual step, documented).
- Keep the read path (viewing existing attachments) always active — only the upload/picker UI is gated, consistent with current behavior.

## Capabilities

### New Capabilities

_None — this change modifies an existing capability's implementation, not its requirements._

### Modified Capabilities

- `message-attachments`: The feature gating mechanism changes from a build-time environment variable to a runtime PostHog feature flag. The behavioral requirements (role-gating, file types, upload flow) remain unchanged.

## Impact

- **Code**: `src/components/messages/MessageInput.tsx` — replace env var check with `useFeatureFlagEnabled('attachments_enabled')`.
- **Configuration**: Remove `NEXT_PUBLIC_ATTACHMENTS_ENABLED` from `.env.example` and `.env.local`.
- **Dependencies**: No new dependencies — `posthog-js/react` is already installed and the `PostHogProvider` is already in the component tree.
- **PostHog**: Requires creating the `attachments_enabled` flag in the PostHog dashboard and configuring its rollout rules.
- **Deployment**: After merging, the flag defaults to off in PostHog until explicitly enabled — matches current safe-by-default behavior.
