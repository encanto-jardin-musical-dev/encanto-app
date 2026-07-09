## 1. Database

- [x] 1.1 Write migration reshaping `daily_reports`: add `group_id uuid references groups(id) on delete cascade`, `title text not null`, `description text`; drop `content`; keep `child_id`, `teacher_id`, `attachments`, `report_date` (default `CURRENT_DATE`), `created_at`
- [x] 1.2 Add RLS policies in the same migration (mirroring `20260707211424_tasks_rls.sql`): SELECT for staff or guardians of the group with the single-child restriction (`child_id is null` or guardian of that child); INSERT requiring `teacher_id = auth.uid()` and admin-or-assigned-teacher; UPDATE/DELETE for admin-or-assigned-teacher — idempotent (`drop policy if exists`)
- [x] 1.3 Apply the migration and regenerate `src/types/database.types.ts` via `supabase gen types typescript`

## 2. Queries and hooks

- [x] 2.1 Create `src/queries/reports/create-report.ts` (insert with title, description, group_id, child_id, attachments, teacher_id) and `src/hooks/UseCreateReportMutation.ts` invalidating `['reports']`
- [x] 2.2 Create `src/queries/reports/get-staff-reports.ts` (reports of managed groups, newest first, joined author/group names) and `src/hooks/UseStaffReportsQuery.ts`
- [x] 2.3 Create `src/queries/reports/get-group-reports.ts` (feed query: reports of a group where `child_id is null` or `child_id = selectedChildId`, newest first) and `src/hooks/UseGroupReportsQuery.ts` keyed `['reports', groupId, childId]`
- [x] 2.4 Create `src/queries/reports/get-report-by-id.ts` and `src/hooks/UseReportByIdQuery.ts` (returns null → not-found handling on detail screen)
- [x] 2.5 Create `src/queries/reports/get-attended-children.ts` (children of a group with `present`/`late` attendance rows for a given date) and `src/hooks/UseAttendedChildrenQuery.ts`

## 3. Staff screens

- [x] 3.1 Create `/reports` route (`src/app/reports/page.tsx`) gated by `admin_options_reports` + staff role (not-found otherwise), with `ReportList`/`ReportListItem` components in `src/components/reports/`: search-by-title input, title + created date rows, FAB linking to `/reports/new` — mirror `src/app/tasks/page.tsx` + `TaskList`
- [x] 3.2 Create `/reports/new` route with `ReportForm` component: role-scoped group select, child select defaulting to "send to all" and listing only attendance-verified children (via `UseAttendedChildrenQuery`), required title, description with character counter, attachment picker
- [x] 3.3 Wire attachment upload in `ReportForm` reusing `validateAttachments` (max 4 / 10 MB / JPEG, PNG, WEBP, PDF) and the `upload-attachment-url` signed-URL flow with a `reports/` storage prefix, preserving attachment order; submit via `UseCreateReportMutation` and route back to `/reports` on success
- [x] 3.4 Update `STAFF_ACTIONS` in `src/components/common/ActionButton.tsx`: `daily-report` route `/daily-report` → `/reports`; remove the `/daily-report` placeholder page
- [x] 3.5 Group `/reports` list rows by group for admin users (alphabetical group headers, newest-first within each group); teachers keep the flat list since they manage at most their own group(s)

## 4. Report detail

- [x] 4.1 Create `/reports/[groupId]/[reportId]` route with `ReportDetail` component: image attachments on top (signed URLs via `UseAttachmentUrlsQuery`), author + relative time, title and full description below, non-image attachments listed as downloads; no edit/delete/like/comment actions; not-found when the query returns no row (RLS-filtered)

## 5. Feed integration

- [x] 5.1 Extend `FeedFilter` type in `src/lib/store/feed.ts` with `'reports'` and enable the "Reportes" chip in `FeedFilters.tsx` behind `admin_options_reports` (disabled when flag off/loading)
- [x] 5.2 Extend `mergeFeedItems.ts` with a `report` item type and reports filter handling
- [x] 5.3 Create `ReportFeedCard` in `src/components/feed/`: first image attachment as background (neutral gradient fallback), author avatar + name overlay, relative time, `line-clamp-2` description with "ver más" CTA underneath navigating to `/reports/[groupId]/[reportId]`; no like/comment icons
- [x] 5.4 Wire `UseGroupReportsQuery` into `FeedGroup`/`FeedUser` (flag-gated: no query when flag off) scoped to the selected child's group and child, and render `ReportFeedCard` items in the merged list

## 6. Notifications

- [x] 6.1 Extend `supabase/functions/push/index.ts` to branch on the webhook payload table: for `daily_reports` INSERT resolve recipients (group-wide → all guardians of children in the group; single-child → that child's guardians; exclude author) and send FCM data messages with `type: 'report'`, `groupId`, `reportId`, title/body — message path untouched
- [x] 6.2 Deploy the function and create the `new_report` database webhook on `daily_reports` INSERT with the `x-push-webhook-secret` header
- [x] 6.3 Ensure the background SW notification click for `type: 'report'` deep-links to `/reports/[groupId]/[reportId]` (update `scripts/generate-firebase-sw.js` if the click handler is type-specific)
- [x] 6.4 Extend `PushNotificationProvider.tsx` foreground handler: on `type === 'report'`, show a HeroUI toast with a navigate action unless the current route is that report's detail

## 7. i18n and polish

- [x] 7.1 Add all new keys to `messages/es.json` (reports list/search/empty state, form labels incl. "send to all", validation, detail, feed card "ver más", toast copy) and use them via `next-intl` — no hardcoded copy
- [x] 7.2 Run `pnpm lint` and fix any issues

## 8. Verification

- [x] 8.1 Verify end-to-end as staff: create a group-wide report and a single-child report (child selector only offers attendant children), see them at `/reports` (grouped by group with alphabetical headers as admin, flat list as teacher), search works within groups
- [x] 8.2 Verify as parent: report cards render with image background and 2-line clamp, "Reportes" filter works, detail shows images-top/description-bottom, other children's individual reports invisible; verify push notification arrives in background and toast in foreground
