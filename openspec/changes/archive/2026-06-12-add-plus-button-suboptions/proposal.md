## Why

The floating action button (FAB / plus button) on the feed currently navigates directly to `/messages` for every user. Teachers and admins need quick access to multiple primary actions (Attendance, Daily Report, Tasks, Messages, Admin Options) from a single entry point, while parents only need to create new messages. Expanding the plus button into a role-aware set of sub-options gives staff a faster workflow without cluttering the parent experience.

## What Changes

- Replace the single-action plus button with a role-aware expandable menu of sub-options.
- For **teachers**: expanding the plus button reveals four actions — Attendance, Daily Report, Tasks, and Messages — each navigating to its own screen.
- For **admins**: expanding the plus button reveals those four actions plus an **Admin Options** action (admin-only).
- For **parents**: the plus button keeps its current behavior, navigating directly to create a new message (no sub-options menu).
- Add basic placeholder screens for each new destination (Attendance, Daily Report, Tasks, Admin Options) that display only the screen name for now.
- Gate the entire sub-options behavior behind a PostHog feature flag. When the flag is off, the plus button falls back to its current single-action behavior for all roles.
- Align the expanded menu and icons with the app design system using HeroUI components (`@heroui/react`) and Heroicons.

## Capabilities

### New Capabilities
- `plus-button-actions`: Role-aware floating action button that expands into contextual sub-options for staff (Attendance, Daily Report, Tasks, Messages for teachers and admins; Admin Options for admins only) and a direct new-message action for parents, gated behind a feature flag.

### Modified Capabilities
<!-- No existing capability specs cover the plus button; none modified. -->

## Impact

- **Component**: `src/components/common/ActionButton.tsx` (existing FAB; gains role logic, feature-flag gating, and an expandable menu).
- **Routing**: New placeholder route folders under `src/app/` for Attendance, Daily Report, Tasks, and Admin Options screens (Messages route already exists).
- **State / roles**: Reads `userRoleAtom` (`src/lib/store/user.ts`) and `USER_ROLES` (`src/lib/const.ts`).
- **Feature flags**: PostHog flag `action_button_options` consumed via `useFeatureFlagEnabled` (`posthog-js/react`); flag must be created in the PostHog dashboard.
- **Dependencies**: No new packages — uses existing `@heroui/react` and `@heroicons/react`.
- **Surface**: The FAB lives inside the feed parallel-route `@group` slot (`src/components/feed/FeedGroup.tsx`).

## QA / Reviewer Notes

- **Feature flag**: This feature is gated behind the PostHog flag `action_button_options`. To test the new behavior, enable `action_button_options` in the PostHog dashboard for your user/environment. With the flag **off** (or while it is still loading), the plus button keeps its current behavior — navigating directly to `/messages` for all roles.
- **Role behavior** (flag on): parents → direct new-message navigation (no menu); teachers → menu with Attendance, Daily Report, Tasks, Messages; admins → those four plus Admin Options.
