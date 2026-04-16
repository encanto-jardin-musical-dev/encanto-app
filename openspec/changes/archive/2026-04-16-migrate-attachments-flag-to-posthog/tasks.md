## 1. Replace env var with PostHog feature flag in MessageInput

- [x] 1.1 Import `useFeatureFlagEnabled` from `posthog-js/react` in `src/components/messages/MessageInput.tsx`
- [x] 1.2 Replace the module-scope `const ATTACHMENTS_ENABLED = process.env.NEXT_PUBLIC_ATTACHMENTS_ENABLED === 'true'` with a `useFeatureFlagEnabled('attachments_enabled')` call inside the component body
- [x] 1.3 Update the `showAttachmentPicker` logic to use the PostHog flag value, treating `undefined` (loading) as `false`
- [x] 1.4 Remove the now-unused `ATTACHMENTS_ENABLED` constant

## 2. Clean up environment variable references

- [x] 2.1 Remove `NEXT_PUBLIC_ATTACHMENTS_ENABLED` and its documentation comment from `.env.example`
- [x] 2.2 Remove `NEXT_PUBLIC_ATTACHMENTS_ENABLED=true` from `.env.local`

## 3. Verify and document

- [x] 3.1 Run `npm run build` to confirm no build errors or references to the removed env var
- [x] 3.2 Run `npm run lint` to confirm no linting issues
- [x] 3.3 Document the PostHog flag setup: add a comment in `MessageInput.tsx` noting the flag name `attachments_enabled` must exist in the PostHog dashboard
