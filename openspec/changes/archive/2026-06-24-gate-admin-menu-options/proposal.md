## Why

The plus button currently shows the Attendance, Daily Report, and Tasks actions to all staff users whenever the menu is enabled, even though several of these features are still under development. We need per-action feature flags so each option can be rolled out (or hidden) independently without removing it from the codebase.

## What Changes

- Gate three staff actions in the plus button menu behind their own PostHog feature flags:
  - `attendance` → `admin_options_attendance`
  - `daily-report` → `admin_options_reports`
  - `tasks` → `admin_options_tasks`
- An action SHALL only appear in the menu when its corresponding flag evaluates to `true`. When a flag is disabled or still loading (`undefined`), its action is hidden.
- The `messages` and `admin-options` actions are unaffected and continue to use their existing visibility rules (role-based for admin options).
- When all per-flag actions are hidden, the menu still renders with the remaining always-visible actions; no empty-menu state is introduced beyond what already exists.

## Capabilities

### New Capabilities
<!-- None -->

### Modified Capabilities
- `plus-button-actions`: The "Staff users see expandable sub-options" behavior changes so that the Attendance, Daily Report, and Tasks actions are each individually gated behind a dedicated PostHog feature flag, in addition to the existing role checks and the menu-level `action_button_options` flag.

## Impact

- **Code**: `src/components/common/ActionButton.tsx` (action list filtering and flag evaluation).
- **Feature flags (PostHog)**: introduces three new flags — `admin_options_attendance`, `admin_options_reports`, `admin_options_tasks`. These must be created in PostHog for the actions to appear.
- **Dependencies**: no new packages; reuses `posthog-js/react` `useFeatureFlagEnabled`.
- **No breaking changes**: with the flags off by default, hidden actions are simply not shown.
