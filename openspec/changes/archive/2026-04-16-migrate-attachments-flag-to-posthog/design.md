## Context

The attachment upload feature in `MessageInput.tsx` is currently gated by `NEXT_PUBLIC_ATTACHMENTS_ENABLED`, a build-time environment variable. This approach requires a full redeploy to toggle the feature and applies uniformly to all users. The project already uses PostHog for analytics and has one feature flag (`messages_search_bar`) in `MessagesContactsList.tsx` using `useFeatureFlagEnabled` from `posthog-js/react`. The `PostHogProvider` is already mounted in the component tree via `src/app/providers.tsx`.

The read path (viewing attachments already sent) is intentionally always active and unaffected by this change.

## Goals / Non-Goals

**Goals:**
- Replace the env-var-based gating with PostHog's `useFeatureFlagEnabled('attachments_enabled')` hook in `MessageInput.tsx`.
- Remove the `NEXT_PUBLIC_ATTACHMENTS_ENABLED` env var from `.env.example` and `.env.local`.
- Preserve existing behavior: only the attachment picker UI (file input + button) is gated; the read path remains always-on.
- Maintain the role guard (`userRole !== 'parent'`) as a separate concern from the feature flag.

**Non-Goals:**
- Changing any attachment upload logic, validation, or S3 interaction.
- Adding server-side PostHog flag evaluation — the flag is purely client-side UI gating.
- Migrating any other env-var-based flags to PostHog.
- Modifying the `messages_search_bar` flag or other PostHog integrations.

## Decisions

### 1. Use `useFeatureFlagEnabled` hook (not `posthog.isFeatureEnabled`)

**Choice**: Use the React hook `useFeatureFlagEnabled('attachments_enabled')` from `posthog-js/react`.

**Rationale**: This is the same pattern already used in `MessagesContactsList.tsx` for `messages_search_bar`. The hook integrates with React's lifecycle, re-renders when the flag value changes, and works with the existing `PostHogProvider`. Using the imperative API would break from the established pattern and miss reactive updates.

**Alternatives considered**:
- `posthog.isFeatureEnabled()` — imperative, doesn't trigger re-renders, inconsistent with existing codebase pattern.
- `usePostHog()` + manual check — more boilerplate for no benefit.

### 2. Flag name: `attachments_enabled`

**Choice**: Name the PostHog flag `attachments_enabled`.

**Rationale**: Follows the existing convention (`messages_search_bar` uses snake_case). Descriptive and matches the domain. Avoids unnecessary prefixes.

### 3. Keep role guard separate from feature flag

**Choice**: Maintain the `userRole !== USER_ROLES.PARENT && userRole !== 'parent'` check as a separate condition from the PostHog flag.

**Rationale**: The role guard is a business rule (parents cannot upload), while the feature flag is an operational toggle. These are independent concerns. The role guard should remain even when the feature flag is enabled.

### 4. Handle loading state — default to hidden

**Choice**: When PostHog flags are still loading (hook returns `undefined`), treat the flag as `false` (hide the picker).

**Rationale**: This matches current behavior where the env var being unset means the feature is off. It prevents a flash of the attachment picker UI during flag loading. Since the feature is additive (picker appears when enabled), briefly hiding it causes no disruption.

## Risks / Trade-offs

- **[PostHog SDK not loaded]** → If PostHog fails to initialize (ad-blocker, network error), `useFeatureFlagEnabled` returns `undefined`, which is treated as `false`. The attachment picker simply won't appear. This is acceptable — matches safe-default behavior. **Mitigation**: PostHog is already configured with a reverse proxy (`/d4t4-3nc4nt0/`) to avoid ad-blockers.

- **[Flag evaluation latency]** → PostHog flags may take a moment to evaluate on page load, causing the picker to appear slightly after the rest of the UI. **Mitigation**: The attachment picker button is a small `+` icon adjacent to the send button. A brief delay in showing it is imperceptible to users.

- **[Flag not created in PostHog dashboard]** → If deployed without creating the flag in PostHog, the feature will be off for everyone. **Mitigation**: Document the manual PostHog setup step clearly in tasks.md. This is the intended safe default.
