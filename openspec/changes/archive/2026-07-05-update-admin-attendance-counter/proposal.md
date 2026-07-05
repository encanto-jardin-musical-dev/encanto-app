# Proposal: update-admin-attendance-counter

## Why

The admin dashboard's "Asistencia de hoy" panel still shows two mocked metrics — Jardín (50/100) and Talleres (30/100) — from `src/lib/mock/adminAssistance.ts`, whose own TODO says to replace it once attendance tracking exists. Attendance logging shipped (PR #116), so the mock can finally be retired: Talleres is no longer wanted as a metric, and Jardín should show the real count.

> Scope decision (made without user confirmation — override before apply if wrong): the request only explicitly asked to delete Talleres; wiring Jardín to live data was chosen because it fulfills the mock's TODO in the same change and matches "update the counter."

## What Changes

- Remove the **Talleres** (workshops) metric from the admin summary panel, its `workshops` entry in the mock, and its `assistance.workshops` i18n key.
- Wire the remaining **Jardín** metric to live data: `children currently present (checked-in and not checked-out) / total children`, using the same Bogota-local "today" as the attendance feature (`todayDateString` in `src/utils/dates.ts`).
- Delete `src/lib/mock/adminAssistance.ts` entirely (nothing else consumes it).
- New query + hook following the established pattern: `src/queries/attendance/get-today-present-count.ts` and a `UseTodayPresentCountQuery` hook; the `total` side reuses the panel's existing `useChildrenCountQuery`.

## Capabilities

### New Capabilities

<!-- none -->

### Modified Capabilities

- `admin-options-page`: the "Today assistance with mocked data" requirement becomes a single live Jardín metric (Workshops removed, mock provider retired); the "Localized text source" requirement drops the Workshops label from its enumeration.

## Impact

- **Code**: `src/components/admin/AdminSummaryPanel.tsx` (one metric, live data), `src/lib/mock/adminAssistance.ts` (deleted), new `src/queries/attendance/get-today-present-count.ts` + `src/hooks/UseTodayPresentCountQuery.ts`.
- **i18n**: remove `AdminOptionsPage.assistance.workshops` from `messages/es.json`.
- **Database**: none — reads the existing `attendance` table under the staff SELECT policy already in place (admins can read all rows).
- **No impact** on the attendance logging screens, messaging, feed, or push notifications.
