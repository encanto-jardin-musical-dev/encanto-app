## Context

The feed's floating action button lives in `src/components/common/ActionButton.tsx` (rendered inside the feed `@group` slot via `FeedGroup.tsx`). Today it is a single HeroUI `Button` that calls `router.push("/messages")` for everyone; the component already carries TODOs for role validation and per-role actions.

This change makes the button role-aware: staff (teacher/admin) get an expandable set of five actions, while parents keep the direct new-message behavior. The behavior is gated behind a PostHog feature flag so it can be rolled out safely, and each new staff action navigates to a placeholder screen.

Relevant existing conventions discovered during research:
- Roles: `userRoleAtom` (`src/lib/store/user.ts`) read via Jotai; compared against `USER_ROLES` (`src/lib/const.ts`) with values `"admin" | "teacher" | "parent"`.
- Feature flags: PostHog via `useFeatureFlagEnabled('<flag>')` from `posthog-js/react`; flags are created in the PostHog dashboard; `undefined` (still loading) is treated as `false`.
- Reveal-on-click UI: the established pattern is HeroUI `Popover` (see `NotificationSettingsPopover.tsx`). `Dropdown`/`useDisclosure` are not yet used in the repo.
- Icons: `@heroicons/react/24/outline` sized with Tailwind (`w-6 h-6`).
- Navigation: programmatic via `useRouter().push()` from `next/navigation`.

## Goals / Non-Goals

**Goals:**
- Expand the plus button into role-aware sub-options for teacher/admin: Attendance, Daily Report, Tasks, Messages, Admin Options.
- Keep the parent experience as a direct new-message action (no menu).
- Gate the whole behavior behind a single PostHog feature flag with a safe fallback to today's behavior when off or still loading.
- Add minimal placeholder screens for each new destination that render only the screen name.
- Use HeroUI components and Heroicons consistent with the existing design system.

**Non-Goals:**
- Implementing the actual functionality of Attendance, Daily Report, Tasks, or Admin Options screens (placeholders only).
- Per-option feature flags or per-option role granularity beyond the staff-vs-parent split.
- Changing parent messaging behavior or the Messages screen itself.
- Adding new dependencies, analytics events, or i18n strings beyond what the placeholders trivially need.

## Decisions

### Decision 1: Reveal mechanism — HeroUI `Popover` anchored to the FAB
Use a `Popover` with the existing plus `Button` as `PopoverTrigger`, and render the five staff actions inside `PopoverContent` as a vertical stack of icon+label buttons.

- **Why**: `Popover` is the only reveal-on-click pattern already in the codebase (`NotificationSettingsPopover.tsx`), keeping the change consistent and low-risk. It handles outside-click dismissal and positioning for free.
- **Alternatives considered**:
  - `Dropdown`/`DropdownMenu` — semantically a good fit, but introduces a new HeroUI component family not yet used here; defer to keep surface small.
  - Inline expanding row of buttons (matching the wireframe's horizontal layout) — more custom animation/layout work and accessibility handling; a vertical popover is simpler and still aligns with the design system. The wireframe communicates the *set of actions*, not a strict horizontal requirement.

### Decision 2: Role gating via `userRoleAtom` + `USER_ROLES`
Read the current role from `userRoleAtom`. If `role === PARENT`, the button keeps the direct `router.push` to create a new message. If `role === TEACHER || role === ADMIN`, the button opens the popover with the staff actions. The **Admin Options** action is admin-only: teachers see four actions (Attendance, Daily Report, Tasks, Messages), and admins see all five (the same four plus Admin Options).

- **Why**: Matches existing role-gating patterns (`MessageInput.tsx`, `FeedUser.tsx`). No new role source needed. Restricting Admin Options to admins keeps administrative entry points out of the teacher experience.

### Decision 3: Single feature flag wrapping the whole behavior
Use the PostHog flag `action_button_options` via `useFeatureFlagEnabled`. When the flag is `true`, apply the new role-aware behavior. When `false` or `undefined`, fall back to the current single-action `router.push("/messages")` for all roles.

- **Why**: Single flag keeps rollout/rollback trivial and the component logic readable; treating `undefined` as off avoids a flash of the new UI before flags resolve, consistent with `MessageInput.tsx`.
- **Alternative considered**: Multiple flags (one per option). Rejected as over-engineering for an initial rollout with placeholder screens.

### Decision 4: Placeholder screens as new App Router routes
Add new route folders under `src/app/` — Attendance, Daily Report, Tasks, Admin Options — each a `page.tsx` rendering only the screen name. Messages reuses the existing `/messages` route. Each staff action navigates via `router.push()`.

- **Why**: Mirrors how screens are added in the App Router; keeps placeholders trivial and replaceable. Route slugs use kebab-case (e.g. `/attendance`, `/daily-report`, `/tasks`, `/admin-options`).
- **Note**: The FAB sits inside the feed parallel-route `@group` slot; navigation uses `router.push` to top-level routes, so the parallel-route `default.tsx` contract on the feed is unaffected.

### Decision 5: Icon and label mapping
Map each action to a Heroicon from `@heroicons/react/24/outline`: Attendance → `ClockIcon`, Daily Report → `ClipboardDocumentListIcon`, Tasks → `DocumentCheckIcon`, Messages → `ChatBubbleLeftIcon` (or `EnvelopeIcon`), Admin Options → `Cog6ToothIcon`. Each button keeps an `aria-label` and uses `onPress`.

- **Why**: Matches the wireframe semantics and existing icon conventions.

## Risks / Trade-offs

- **Flag misconfiguration hides the feature** → Mitigation: explicit safe fallback to current behavior when flag is off/undefined; document the flag name so it can be created in the PostHog dashboard before rollout.
- **Role atom not yet hydrated on first render could briefly show parent behavior for staff** → Mitigation: this only affects the very first paint before `UserHydrator` runs; the popover opens on user interaction, by which point the role is hydrated. No destructive action occurs.
- **Popover vertical layout differs from the wireframe's horizontal row** → Mitigation: accepted trade-off for design-system consistency and simpler a11y; revisit layout if product requires the exact horizontal arrangement.
- **Placeholder routes are dead-ends** → Mitigation: clearly scoped as placeholders showing only the screen name; real screens land in follow-up changes.
- **Admin Options entry point** → Resolved: Admin Options is admin-only; teachers do not see it. Implemented as an additional role check when building the staff action list.
