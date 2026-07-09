# Add Reports Feature

## Why

Teachers currently have no way to share daily activity reports (photos + description of what the children did) with parents. The plus button already exposes a flag-gated "Daily Report" action and the feed has a disabled "Reportes" chip — both placeholders waiting for this feature. Reports close the daily communication loop between staff and parents alongside messages and tasks.

## What Changes

- Staff (teacher/admin) can create reports at `/reports/new` for a whole group or for a single child; single-child reports are restricted to children with attendance recorded on the report date.
- Staff get a report list screen at `/reports` with search and a FAB to create new reports (mirrors the tasks screens).
- Reports carry a title, a description, and up to 4 file attachments (same limits as message/task attachments); the first image attachment is the feed card's background image.
- Parents see report cards in the feed for the selected child's group (or targeted at that child), with the description clamped to two lines and a "ver más" CTA beneath it; the "Reportes" feed filter chip becomes active.
- A report detail screen at `/reports/[groupId]/[reportId]` renders like a Facebook post: images at the top, description below. Likes and comments are explicitly out of scope (future feature).
- Parents are alerted of new reports via push notification (background) or a toast (foreground on a non-feed screen), reusing the existing FCM pipeline.
- The plus button's "Daily Report" action navigates to `/reports` instead of the `/daily-report` placeholder.
- The existing, unused `daily_reports` table is reshaped (group targeting, title/description, author, attachments) with RLS policies.

## Capabilities

### New Capabilities

- `group-reports-management`: Staff creation, listing, and search of reports scoped to groups or attendance-verified single children, including `daily_reports` schema changes and RLS.
- `feed-reports`: Parent-facing report visibility — report feed cards (image background, 2-line description, "ver más"), the Reports feed filter, and the read-only Facebook-post-style report detail.
- `report-notifications`: Push notification fan-out to guardians on report creation, and in-app toast for foregrounded users on other screens.

### Modified Capabilities

- `plus-button-actions`: The Daily Report action's destination changes from the `/daily-report` placeholder to the real `/reports` screen.

## Impact

- **Database**: migration reshaping `daily_reports` (add `group_id`, `title`, `description`, rename/repurpose author column, drop unused `content` Json) + RLS policies; regenerated `src/types/database.types.ts`.
- **Routes**: new `/reports`, `/reports/new`, `/reports/[groupId]/[reportId]` app routes.
- **Feed**: `mergeFeedItems`, `FeedFilters`, `FeedGroup`/`FeedUser`, new `ReportFeedCard` component.
- **Queries/hooks**: new `src/queries/reports/*` + `Use*Query/Mutation` hooks following the established pattern.
- **Edge functions**: extend the push pipeline (new DB webhook on `daily_reports` INSERT; fan-out to guardian device tokens).
- **Notifications**: `PushNotificationProvider` foreground handling for report messages.
- **i18n**: new keys in `messages/es.json`.
- **Feature flag**: everything gated behind the existing `admin_options_reports` PostHog flag.
