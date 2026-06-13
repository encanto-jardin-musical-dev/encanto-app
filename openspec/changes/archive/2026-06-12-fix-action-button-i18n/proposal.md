## Why

The plus button (`ActionButton`) sub-option labels and accessible labels are hardcoded English strings (`"Attendance"`, `"Daily Report"`, `"Tasks"`, `"Messages"`, `"Admin Options"`, `aria-label="actions"`), while the rest of the app renders user-facing text through the `next-intl` i18n layer with translations in `messages/es.json`. This breaks localization consistency: these labels show up in English even though the app locale is Spanish.

## What Changes

- Move all user-facing strings in `ActionButton` (the five action labels and the `aria-label`) out of the component and into the i18n message catalog.
- Add a new `ActionButton` namespace to `messages/es.json` containing the action labels and the accessible button label.
- Update `ActionButton` to resolve labels via `useTranslations` keyed by each action's stable `key`, instead of carrying a literal `label` in the `STAFF_ACTIONS` config.
- Localize the placeholder screen names (Attendance, Daily Report, Tasks, Admin Options) so they read from the same source, keeping screen titles consistent with the menu labels.
- No behavior, routing, role-gating, or feature-flag logic changes — strictly a text-source change.

## Capabilities

### New Capabilities
<!-- None -->

### Modified Capabilities
- `plus-button-actions`: The action labels, the plus button's accessible label, and the placeholder screen names are now sourced from the i18n message catalog rather than hardcoded English literals.

## Impact

- `src/components/common/ActionButton.tsx` — replace hardcoded `label` literals and `aria-label` with `next-intl` lookups.
- `messages/es.json` — add an `ActionButton` namespace with action labels and the accessible label.
- Placeholder screens for Attendance, Daily Report, Tasks, and Admin Options — render their displayed name from i18n.
- No new dependencies; uses the existing `next-intl` setup (`src/i18n/request.ts`).
