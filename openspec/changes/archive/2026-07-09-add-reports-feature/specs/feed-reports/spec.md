## ADDED Requirements

### Requirement: Report cards in the parent feed

When the `admin_options_reports` feature flag is enabled, the feed SHALL include a report card for each report visible in the currently selected group context, merged with message and task cards into a single list ordered by creation date descending. For a parent, the visible reports are those of the selected child's group that are group-wide, plus those targeting the selected child; individual reports for other children SHALL NOT appear. Each report card SHALL render the first image attachment of the report as its background image (falling back to a neutral background when the report has no image attachment), overlaid with the author's name and avatar, the relative creation time, the report description clamped to two lines, and a "view more" call to action placed under the clamped description that navigates to the report's detail screen. The card SHALL NOT render like or comment actions.

#### Scenario: Parent sees reports for the selected child
- **WHEN** a parent with the flag enabled views the feed with a child selected
- **THEN** report cards for that child's group (group-wide) and for that child (individual) appear interleaved with messages and tasks by date
- **AND** individual reports targeting other children do not appear

#### Scenario: First image attachment is the card background
- **WHEN** a report with image attachments is rendered as a feed card
- **THEN** the first image attachment (in stored order) is displayed as the card's background

#### Scenario: Report without images falls back
- **WHEN** a report with no image attachments is rendered as a feed card
- **THEN** the card renders with a neutral fallback background and remains legible

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

The system SHALL provide a report detail screen at `/reports/[groupId]/[reportId]` that renders like a social media post: the report's image attachments at the top, followed by the author and relative creation time, and the title and full description at the bottom. Non-image attachments SHALL be listed as downloadable items. The screen SHALL be read-only — no edit, delete, like, or comment actions. Access SHALL be limited to users who can read the report (staff, or guardians per the report's visibility); a user without access navigating directly to the URL SHALL see the not-found page.

#### Scenario: Parent opens a report from the feed
- **WHEN** a parent taps a report card or its "view more" call to action
- **THEN** the detail screen shows the images at the top and the description at the bottom in read-only form
- **AND** no edit, delete, like, or comment actions are displayed

#### Scenario: Parent cannot open a report they lack access to
- **WHEN** a parent navigates directly to a report detail URL for a report not visible to them
- **THEN** the system renders the not-found page
