## 1. Feature flag setup

- [x] 1.1 Create the PostHog feature flag `action_button_options` in the PostHog dashboard
- [x] 1.2 Note the flag in the change docs so reviewers/QA know to enable it for testing

## 2. Placeholder screens

- [x] 2.1 Create `src/app/attendance/page.tsx` rendering only the screen name "Attendance"
- [x] 2.2 Create `src/app/daily-report/page.tsx` rendering only the screen name "Daily Report"
- [x] 2.3 Create `src/app/tasks/page.tsx` rendering only the screen name "Tasks"
- [x] 2.4 Create `src/app/admin-options/page.tsx` rendering only the screen name "Admin Options"
- [x] 2.5 Verify each placeholder route is reachable directly via its URL

## 3. ActionButton: role + flag logic

- [x] 3.1 In `src/components/common/ActionButton.tsx`, read the current role via `useAtom(userRoleAtom)` and import `USER_ROLES`
- [x] 3.2 Read the feature flag via `useFeatureFlagEnabled('action_button_options')`, treating `undefined` as off
- [x] 3.3 Implement fallback path: when flag is off/undefined, keep current `router.push("/messages")` behavior for all roles
- [x] 3.4 Implement parent path: when flag is on and role is `PARENT`, navigate directly to create a new message (no menu)
- [x] 3.5 Remove the now-resolved TODO comments

## 4. ActionButton: staff sub-options menu

- [x] 4.1 Add a HeroUI `Popover` with the existing plus `Button` as `PopoverTrigger`, shown only when flag is on and role is teacher/admin
- [x] 4.2 Define the action list (label, icon, route): Attendance→`/attendance` (`ClockIcon`), Daily Report→`/daily-report` (`ClipboardDocumentListIcon`), Tasks→`/tasks` (`DocumentCheckIcon`), Messages→`/messages` (`ChatBubbleLeftIcon`), Admin Options→`/admin-options` (`Cog6ToothIcon`)
- [x] 4.3 Restrict Admin Options to admins only: include it in the action list when role is `ADMIN`, exclude it for `TEACHER`
- [x] 4.4 Render each action in `PopoverContent` as an icon+label button with `aria-label` and `onPress` that calls `router.push(route)`
- [x] 4.5 Import the action icons from `@heroicons/react/24/outline` and size with Tailwind classes
- [x] 4.6 Ensure selecting an action closes the popover and navigates

## 5. Verification

- [x] 5.1 Manually verify: flag off → all roles navigate to messages (current behavior)
- [x] 5.2 Manually verify: flag on + parent → direct new-message navigation, no menu
- [x] 5.3 Manually verify: flag on + teacher → menu shows four actions (no Admin Options); flag on + admin → menu shows all five actions; each navigating to the correct screen
- [x] 5.4 Run `pnpm lint` and resolve any issues (fixed the broken lint setup for Next 16 / ESLint 9; this change's files pass clean — remaining lint errors are pre-existing in unrelated files)
- [x] 5.5 Run `pnpm build` to confirm the new routes and component compile
