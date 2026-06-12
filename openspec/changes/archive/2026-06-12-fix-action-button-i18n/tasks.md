## 1. Add i18n messages

- [x] 1.1 Add an `ActionButton` namespace to `messages/es.json` with `triggerLabel` and an `actions` object keyed by each action key (`attendance`, `daily-report`, `tasks`, `messages`, `admin-options`) and Spanish values per design.md
- [x] 1.2 Verify the JSON remains valid (no trailing commas, correct nesting)

## 2. Update ActionButton component

- [x] 2.1 In `src/components/common/ActionButton.tsx`, remove the `label` field from the `ActionItem` type and from each entry in `STAFF_ACTIONS`
- [x] 2.2 Add `const t = useTranslations("ActionButton")` and resolve each menu label via `t(\`actions.${key}\`)`
- [x] 2.3 Replace the menu item `aria-label={label}` with the translated label, and replace the trigger `aria-label="actions"` with `t("triggerLabel")`
- [x] 2.4 Replace the fallback-button `aria-label="actions"` with `t("triggerLabel")` so the flag-off path is also localized

## 3. Localize placeholder screens

- [x] 3.1 In `src/app/attendance/page.tsx`, source the `pageTitle` and `<h1>` text from `ActionButton.actions.attendance` via `getTranslations` (server component)
- [x] 3.2 Apply the same change to `src/app/daily-report/page.tsx` using `ActionButton.actions.daily-report`
- [x] 3.3 Apply the same change to `src/app/tasks/page.tsx` using `ActionButton.actions.tasks`
- [x] 3.4 Apply the same change to `src/app/admin-options/page.tsx` using `ActionButton.actions.admin-options`

## 4. Verify

- [x] 4.1 Run `pnpm lint` and confirm no new errors
- [x] 4.2 Run `pnpm build` and confirm it compiles with no missing-translation errors
- [x] 4.3 Manually verify (or reason through) that the teacher menu, admin menu (including Admin Options), the trigger label, and each placeholder screen display the Spanish labels from the catalog
- [x] 4.4 Confirm no behavior, routing, role-gating, or feature-flag logic changed
