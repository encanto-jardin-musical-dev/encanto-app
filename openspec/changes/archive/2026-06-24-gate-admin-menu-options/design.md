## Context

The plus button menu is implemented in `src/components/common/ActionButton.tsx`. It already:

- Gates the whole sub-options menu behind the PostHog flag `action_button_options` via `useFeatureFlagEnabled`.
- Filters actions by role (`adminOnly` for the admin-options entry).
- Renders each action from a static `STAFF_ACTIONS` array, resolving labels through `next-intl`.

This change adds per-action PostHog flags for three of the staff actions (Attendance, Daily Report, Tasks) so they can be released independently. The pattern (`useFeatureFlagEnabled`) is already established in this file and in `MessageInput.tsx`, so no new infrastructure is needed.

## Goals / Non-Goals

**Goals:**
- Show Attendance, Daily Report, and Tasks only when their respective flags (`admin_options_attendance`, `admin_options_reports`, `admin_options_tasks`) are `true`.
- Treat disabled and loading (`undefined`) flag states as "hidden", consistent with the existing menu-level fallback semantics.
- Keep Messages always visible to staff and keep Admin Options gated only by role.

**Non-Goals:**
- No changes to the menu-level `action_button_options` flag or the parent/teacher/admin role logic.
- No changes to the destination screens or routes.
- No backend, schema, or i18n catalog changes (labels already exist).
- No PostHog flag creation in code — flags are configured in the PostHog dashboard.

## Decisions

**Decision: Attach an optional `flag` field to each action definition.**
Add an optional `flag?: string` to the `ActionItem` type and set it on the three gated actions. The component evaluates a map of flag → boolean and filters out any action whose `flag` is set but not `true`. Rationale: keeps the action list declarative and the filter logic in one place; actions without a `flag` (Messages, Admin Options) are unaffected.

- *Alternative considered*: separate boolean checks inline per action. Rejected — more branching and harder to keep in sync with the array.

**Decision: Evaluate all flags unconditionally at the top of the component.**
React hooks (`useFeatureFlagEnabled`) must be called unconditionally and in stable order, so each flag is read with its own hook call regardless of role. The results are combined into a lookup keyed by flag name. Rationale: complies with the Rules of Hooks; the small number of flags makes a fixed set of calls acceptable.

**Decision: Hidden = flag not strictly `true`.**
Use `=== true` comparison so both `false` and `undefined` (still loading) hide the action, matching the existing menu-level fallback that treats `undefined` as off. Rationale: avoids briefly flashing actions before flags resolve.

## Risks / Trade-offs

- **Flags not created in PostHog → actions never appear** → Document the three flag names in the proposal/tasks; default-off behavior is intentional and safe.
- **Flag-loading flicker** → Mitigated by the strict `=== true` check; actions appear only once their flag resolves to true.
- **Adding hooks could reorder existing hook calls** → Add the new `useFeatureFlagEnabled` calls alongside the existing one near the top of the component, before any early returns, preserving stable hook order.

## Migration Plan

1. Ship the code change with all three flags off by default (or non-existent) in PostHog — the three actions stay hidden, the rest of the menu is unchanged.
2. Create `admin_options_attendance`, `admin_options_reports`, and `admin_options_tasks` in PostHog.
3. Enable each flag (per cohort or globally) as the corresponding feature is ready.
4. Rollback: disable the flag in PostHog to hide an action again; no deploy required.
