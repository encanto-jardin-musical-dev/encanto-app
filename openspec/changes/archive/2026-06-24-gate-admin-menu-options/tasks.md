## 1. Gate actions behind per-action flags

- [x] 1.1 In `src/components/common/ActionButton.tsx`, add an optional `flag?: string` field to the `ActionItem` type.
- [x] 1.2 Set the flag on the gated actions in `STAFF_ACTIONS`: `attendance` → `admin_options_attendance`, `daily-report` → `admin_options_reports`, `tasks` → `admin_options_tasks`. Leave `messages` and `admin-options` without a `flag`.
- [x] 1.3 At the top of the component (before any early return, preserving hook order), call `useFeatureFlagEnabled` for each of the three flags and build a `flagState` lookup keyed by flag name.
- [x] 1.4 Extend the `actions` filter so an action is included only when (`!action.flag` OR `flagState[action.flag] === true`) AND the existing `adminOnly`/role check passes.

## 2. Verification

- [x] 2.1 Manually verify: with all three flags enabled, a teacher sees Attendance, Daily Report, Tasks, Messages; an admin additionally sees Admin Options.
- [x] 2.2 Manually verify: disabling `admin_options_tasks` hides only the Tasks action; Messages and (for admins) Admin Options remain visible.
- [x] 2.3 Manually verify: while a per-action flag is still loading (`undefined`), its action does not flash into view.
- [x] 2.4 Run `pnpm lint` and confirm no new lint or type errors in `ActionButton.tsx`.
