# feed-reports

## Purpose

Parent-facing report visibility — report feed cards (image background, 2-line description, "ver más"), the Reports feed filter, and the read-only Facebook-post-style report detail.

## Requirements

### Requirement: Report cards in the parent feed

When the `admin_options_reports` feature flag is enabled, the feed SHALL include a report card for each report visible in the currently selected group context, merged with message and task cards into a single list ordered by creation date descending. For a parent, the visible reports are those of the selected child's group that are group-wide, plus those targeting the selected child; individual reports for other children SHALL NOT appear. Each report card SHALL render the first image attachment of the report as its background image, falling back to a default cover image when the report has no image attachment (no attachments, or only non-image attachments such as a PDF), overlaid with the author's name and avatar, the relative creation time, the report description clamped to two lines, and a "view more" call to action placed under the clamped description that navigates to the report's detail screen. The card SHALL NOT render like or comment actions.

#### Scenario: Parent sees reports for the selected child
- **WHEN** a parent with the flag enabled views the feed with a child selected
- **THEN** report cards for that child's group (group-wide) and for that child (individual) appear interleaved with messages and tasks by date
- **AND** individual reports targeting other children do not appear

#### Scenario: First image attachment is the card background
- **WHEN** a report with image attachments is rendered as a feed card
- **THEN** the first image attachment (in stored order) is displayed as the card's background

#### Scenario: Report without an image attachment falls back to the default cover
- **WHEN** a report with no image attachments (either no attachments, or only non-image attachments such as a PDF) is rendered as a feed card
- **THEN** the card renders the default cover image as its background
- **AND** the card remains legible

#### Scenario: Description clamps to two lines with view-more
- **WHEN** a report's description exceeds two lines on the feed card
- **THEN** the description is truncated at two lines
- **AND** a "view more" call to action appears under the description and navigates to the report detail

#### Scenario: Flag disabled hides report cards
- **WHEN** the `admin_options_reports` flag is disabled or still loading
- **THEN** the feed shows no report cards and issues no report queries

### Requirement: Reports feed filter

When the `admin_options_reports` feature flag is enabled, the feed filters' "Reports" chip SHALL become active alongside "All", "Messages", and "Tasks". Selecting "Reports" SHALL show only report cards; selecting "All" SHALL show the merged list including reports. When the flag is disabled the "Reports" chip SHALL remain disabled.

#### Scenario: Filtering the feed to reports
- **WHEN** a user with the flag enabled selects the "Reports" chip
- **THEN** only report cards are shown in the feed

#### Scenario: Flag disabled keeps chip inert
- **WHEN** the `admin_options_reports` flag is disabled
- **THEN** the "Reports" chip is disabled and cannot change the feed

### Requirement: Report detail screen

The system SHALL provide a report detail screen at `/reports/[groupId]/[reportId]` that renders like a social media post: the report's image attachments at the top when at least one exists, falling back to the default cover image in that position when the report has no image attachments, followed by the author and relative creation time, and the title and full description below. Non-image (PDF) attachments SHALL render below the title and description as a call-to-action button in the theme's primary color, with a document-download icon and a label that explicitly states the file will be downloaded. The screen SHALL be read-only — no edit, delete, like, or comment actions. Access SHALL be limited to users who can read the report (staff, or guardians per the report's visibility); a user without access navigating directly to the URL SHALL see the not-found page.

#### Scenario: Parent opens a report from the feed
- **WHEN** a parent taps a report card or its "view more" call to action
- **THEN** the detail screen shows the images (or default cover) at the top and the description below in read-only form
- **AND** no edit, delete, like, or comment actions are displayed

#### Scenario: Report without an image attachment shows the default cover
- **WHEN** a report with no image attachments (no attachments, or only a PDF) is opened
- **THEN** the default cover image renders at the top in place of the image attachments

#### Scenario: PDF attachment renders as a download CTA below the description
- **WHEN** a report has a PDF attachment
- **THEN** the PDF renders as a primary-colored button below the title and description, with a download icon and a label naming the file and stating it will download
- **AND** the file link does not render above the report header

#### Scenario: Failed attachment URL disables the CTA
- **WHEN** the signed URL for a PDF attachment fails to load
- **THEN** the CTA renders in a disabled, error-styled state instead of a broken download link

#### Scenario: Parent cannot open a report they lack access to
- **WHEN** a parent navigates directly to a report detail URL for a report not visible to them
- **THEN** the system renders the not-found page
