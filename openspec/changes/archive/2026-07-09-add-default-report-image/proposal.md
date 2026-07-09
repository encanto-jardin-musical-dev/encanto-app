## Why

Report feed cards, the report detail screen, and the staff report list all fell short of showing reports as complete, intentional records: feed cards without an image fell back to a plain gradient, the detail screen rendered nothing at all when a report had no image (or buried its PDF link above the title, unstyled), and the staff report list gave no indication that a report targeted a specific child. A default cover image gives every report card and detail screen a finished look, a clearer PDF download affordance makes file attachments actionable, and surfacing the child's name in the staff list lets staff scan for individual vs. group-wide reports at a glance.

## What Changes

- Move `public/default-image-placeholder.jpg` into a new `public/defaults/` folder (e.g. `public/defaults/report-cover.jpg`), establishing it as the home for any future default/fallback images.
- Update `ReportFeedCard` to render the default report cover image as the card background whenever the report has no image attachment among its attachments (no attachments at all, or attachments that are all non-image, e.g. a PDF only).
- Update `ReportDetail` to render the same default cover image (in place of rendering nothing) whenever the report has no image attachment, and to split attachment rendering: image attachments render above the header as before, while any PDF/file attachment renders as a primary-colored call-to-action button below the title/description, with a document-download icon and label that explicitly tells the user the file will download.
- Update the staff report list (`ReportListItem`) to show the target child's name below the report title, in the theme's primary color and secondary text weight, when the report targets a specific child; group-wide reports show no child name.
- Keep the existing behavior of using the report's first image attachment as the feed card background, and of rendering all image attachments in the detail screen, when at least one exists.

## Capabilities

### New Capabilities

(none)

### Modified Capabilities

- `feed-reports`: The "Report cards in the parent feed" requirement's "falls back to a neutral background" behavior changes — the fallback SHALL be a default cover image (served from the internal defaults asset folder) instead of a neutral gradient. The "Report detail screen" requirement changes to fall back to the same default cover when a report has no image attachments, and to render PDF attachments as a primary-colored download CTA below the title/description instead of as a plain downloadable listing above the header.
- `group-reports-management`: The "Staff report list" requirement changes to include the target child's name on individual-report list items.

## Impact

- Affected code: `src/components/feed/ReportFeedCard.tsx`, `src/components/reports/ReportDetail.tsx`, `src/components/reports/ReportListItem.tsx`, `src/queries/reports/get-staff-reports.ts`, `messages/es.json`, `public/default-image-placeholder.jpg` → `public/defaults/`.
- Affected spec: `openspec/specs/feed-reports/spec.md`, `openspec/specs/group-reports-management/spec.md`.
- No database, API, or dependency changes (the `children` join added to `getStaffReports` reuses the existing `daily_reports.child_id` foreign key, already read elsewhere).
