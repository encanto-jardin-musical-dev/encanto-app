# Tasks: update-admin-attendance-counter

## 1. Data layer

- [x] 1.1 Add `src/queries/attendance/get-today-present-count.ts`: HEAD count on `attendance` where `attendance_date = todayDateString()` and `check_in` is not null, with explicit error handling
- [x] 1.2 Add `src/hooks/UseTodayPresentCountQuery.ts` with query key `['today-present-count', todayDateString()]`

## 2. Panel update

- [x] 2.1 Update `src/components/admin/AdminSummaryPanel.tsx`: remove the Talleres `AssistanceMetric`, wire the Jardín metric to `UseTodayPresentCountQuery` (current) and the existing `useChildrenCountQuery` (total), rendering the panel's "—" placeholder while either is loading
- [x] 2.2 Delete `src/lib/mock/adminAssistance.ts` and its import

## 3. i18n

- [x] 3.1 Remove `AdminOptionsPage.assistance.workshops` from `messages/es.json` (keep `title` and `childCare`)

## 4. Verification

- [x] 4.1 Run `pnpm lint` and `npx tsc --noEmit`; confirm no remaining references to `adminAssistance` or `assistance.workshops`
- [x] 4.2 Verify on `/admin` as admin: single Jardín metric shows live `present/total` consistent with the attendance log screen's counter for today
