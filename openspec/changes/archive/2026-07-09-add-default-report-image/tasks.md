## 1. Default assets folder

- [x] 1.1 Create `public/defaults/` and move `public/default-image-placeholder.jpg` into it as `public/defaults/report-cover.jpg`

## 2. Report feed card fallback

- [x] 2.1 In `src/components/feed/ReportFeedCard.tsx`, set `backgroundUrl` to `/defaults/report-cover.jpg` when the report has no image attachment (`firstImage` is null), replacing the `bg-gradient-to-br` fallback branch
- [x] 2.2 Manually verify in the feed: a report with an image attachment still shows that image, a report with only a PDF attachment shows the default cover, and a report with no attachments shows the default cover

## 3. Report detail fallback and PDF download CTA

- [x] 3.1 In `src/components/reports/ReportDetail.tsx`, split `attachments` into `imageAttachments` and `fileAttachments`; render the default cover image when `imageAttachments` is empty, and `MessageAttachments` with only `imageAttachments` otherwise
- [x] 3.2 Render `fileAttachments` below the title/description as a full-width primary-colored CTA button per file, with a download icon and explicit "Descargar {name}" label/aria-label, disabled/danger-styled on signing error
- [x] 3.3 Add the `ReportsPage.detail.downloadFile` translation key to `messages/es.json`

## 4. Staff report list child name

- [x] 4.1 Join `children(first_name, last_name)` into `getStaffReports` (`src/queries/reports/get-staff-reports.ts`) and add `children` to `StaffReportRow`
- [x] 4.2 In `ReportListItem.tsx`, render the child's full name below the title (theme primary color, secondary text weight) when the report targets a specific child; keep the title as the primary text and the date/child name secondary

## 5. Spec sync

- [x] 5.1 Run `/opsx:archive` to merge the `feed-reports` and `group-reports-management` delta specs into their main specs
