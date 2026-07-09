## Context

`ReportFeedCard` (`src/components/feed/ReportFeedCard.tsx`) picks the first attachment whose `contentType` starts with `image/` and uses it as the card's background via `useAttachmentUrlsQuery`. When no such attachment exists (no attachments, or a PDF-only report), it previously rendered a `bg-gradient-to-br from-primary-200 to-primary-400` fallback. `ReportDetail` (`src/components/reports/ReportDetail.tsx`) previously rendered nothing when a report had no attachments, and rendered `MessageAttachments` (images + PDF links, images first) unconditionally above the header otherwise — so a PDF-only report showed an unstyled file link above the title with no cover image at all. The staff report list (`ReportListItem.tsx`, backed by `getStaffReports`) showed only the title and creation date, with no indication of which reports targeted a specific child.

## Goals / Non-Goals

**Goals:**
- Introduce `public/defaults/` as the internal convention for default/fallback images, starting with the report cover image.
- Render that image as the background whenever a report has no image attachment, on both the feed card and the detail screen.
- On the detail screen, move any PDF/file attachment below the title and description and present it as an explicit download CTA rather than an unstyled link above the header.
- Surface the target child's name on staff report list items, with a clear text hierarchy (title primary, date and child name secondary).

**Non-Goals:**
- No admin/UI to configure or upload a custom default image — it's a static bundled asset.
- No changes to the `daily_reports` schema or attachment storage.
- No change to `MessageAttachments`'s own rendering (image grid, per-file error states) — `ReportDetail` now calls it with only the image subset of attachments and builds its own CTA markup for files, rather than modifying the shared component.

## Decisions

- **Asset location**: `public/defaults/report-cover.jpg` (renamed from `public/default-image-placeholder.jpg`). Mirrors the existing `public/brand/` and `public/icons/` subfolder convention, and the more specific name makes the file's purpose clear once more defaults are added later.
- **Feed card rendering approach**: reuse the existing background-image `<div>` styling path in `ReportFeedCard` — set `backgroundUrl` to the static `/defaults/report-cover.jpg` path when `firstImage` is null, instead of branching into a separate gradient-only code path. This keeps one rendering branch (image background) instead of two (image vs. gradient).
- **No signed URL needed**: the default image is a public static asset served directly by Next.js, so it bypasses `useAttachmentUrlsQuery` entirely — only real attachments go through signed-URL fetching.
- **Detail screen split**: `ReportDetail` now partitions `attachments` into `imageAttachments` and `fileAttachments`. When `imageAttachments` is empty, it renders the default cover (`next/image`, `fill`, `object-cover`) in the same slot `MessageAttachments` used to occupy; when non-empty, `MessageAttachments` renders only the image subset (its file-link branch is now unreachable from `ReportDetail`, since files are never passed to it). `fileAttachments` render separately, below the title/description, as an anchor styled as a full-width primary button (`bg-primary text-white`, `DocumentArrowDownIcon`, `download` attribute, an aria-label and visible label reading "Descargar {name}") so the affordance is unambiguous. A failed signed URL renders the same button disabled (`pointer-events-none`, danger colors) rather than a broken download.
- **Staff list child name**: `getStaffReports` joins `children(first_name, last_name)` (same relationship already used by `getGroupReports` for the parent feed) so `ReportListItem` can render the child's full name without a new query. No "Para" prefix — the name alone, in `text-primary` (theme blue) at `text-tiny`, placed on its own line below the title and above the date, both the child name and date kept visually secondary (`text-tiny`) to the title (`text-medium font-semibold`).

## Risks / Trade-offs

- [Renaming the file breaks any other reference] → Verified via grep that `default-image-placeholder.jpg` is not referenced anywhere in `src/`, so the rename is safe.
- [Hardcoded path string `/defaults/report-cover.jpg` in two components] → Acceptable for a single static default; if more defaults are added later, consider a small constants file, but that's out of scope here.
- [`ReportDetail` builds its own file-link markup instead of extending `MessageAttachments`] → Chosen because the CTA styling (full-width primary button, explicit download wording) is specific to the report detail screen and not desired in message bubbles; duplicating a small anchor block was simpler than adding a variant prop to the shared component.
