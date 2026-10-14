## ADDED Requirements

### Requirement: Attendance report screen is feature-flagged and staff-only

The system SHALL provide an attendance report screen at `/attendance-report`. The screen SHALL be accessible only when the PostHog feature flag `admin_options_attendance_report` evaluates to `true` and the user's role is teacher or admin. While the user session or the flag value is still loading, the screen SHALL render no report content. When the flag is disabled or the user is a parent, the system SHALL show the not-found page.

#### Scenario: Teacher with flag enabled opens the report
- **WHEN** a teacher opens `/attendance-report` and `admin_options_attendance_report` is enabled
- **THEN** the system displays the attendance report screen with a localized title

#### Scenario: Flag disabled shows not-found
- **WHEN** an admin opens `/attendance-report` and `admin_options_attendance_report` is disabled
- **THEN** the system shows the not-found page

#### Scenario: Parent cannot access the report
- **WHEN** a parent opens `/attendance-report` with the flag enabled
- **THEN** the system shows the not-found page

#### Scenario: Flag still loading renders nothing
- **WHEN** a staff user opens `/attendance-report` and the flag value is `undefined`
- **THEN** the system renders no report content and does not show the not-found page yet

### Requirement: Group selection is scoped by role

The report SHALL require the user to select exactly one group. A teacher SHALL only be offered groups assigned to them. An admin SHALL be offered every group, including groups with no assigned teacher. The system SHALL NOT offer an "all groups" option.

#### Scenario: Teacher sees only assigned groups
- **WHEN** a teacher assigned to groups A and B opens the group selector
- **THEN** the selector lists A and B only

#### Scenario: Admin sees all groups
- **WHEN** an admin opens the group selector
- **THEN** the selector lists every group ordered by name and no "all groups" option

### Requirement: Single child selection

A report SHALL be generated for exactly one child. After a group is selected, the system SHALL list that group's children ordered by name and the user SHALL select one of them. No child SHALL be preselected. The child selector SHALL be disabled until a group is selected, and changing the group SHALL clear the selected child. The system SHALL NOT offer a whole-group or multi-child report.

#### Scenario: Selecting a group lists its children
- **WHEN** a staff user selects a group with 12 children
- **THEN** the child selector lists the 12 children with none selected

#### Scenario: Only one child can be selected
- **WHEN** the user selects child A and then child B
- **THEN** only child B is selected

#### Scenario: Changing the group clears the child
- **WHEN** a child is selected and the user selects a different group
- **THEN** the child selection is cleared and the new group's children are listed

### Requirement: Date range selection with presets

The report SHALL offer the date range presets Today, Last 7 days, This month, Last month, and Custom. The default preset SHALL be Last 7 days. Preset ranges SHALL be computed from the school's local calendar day (`America/Bogota`) and SHALL be inclusive of both ends. Choosing Custom SHALL show a date range picker. The range end SHALL NOT be before its start, and the range SHALL NOT exceed 90 days inclusive.

#### Scenario: Default range is last 7 days
- **WHEN** a staff user opens the report on 2026-10-13 (school time)
- **THEN** the selected range is 2026-10-07 to 2026-10-13

#### Scenario: This month preset
- **WHEN** the user selects "This month" on 2026-10-13
- **THEN** the selected range is 2026-10-01 to 2026-10-13

#### Scenario: Last month preset
- **WHEN** the user selects "Last month" on 2026-10-13
- **THEN** the selected range is 2026-09-01 to 2026-09-30

#### Scenario: Custom range at the limit
- **WHEN** the user picks a custom range of exactly 90 days
- **THEN** the range is valid and Generate can be enabled

#### Scenario: Custom range exceeding the limit
- **WHEN** the user picks a custom range of 91 days or more
- **THEN** the system shows a localized validation message and the Generate action is disabled

### Requirement: Generating the report

The Generate action SHALL be enabled only when a group and a child are selected and the date range is valid. Pressing Generate SHALL fetch the report for the current selection. If any filter changes after a report is generated, the system SHALL clear the displayed results until the user generates again, so displayed rows always match the visible filters.

#### Scenario: Generate disabled without a child
- **WHEN** a group is selected but no child is selected
- **THEN** the Generate action is disabled

#### Scenario: Generating shows a loading state
- **WHEN** the user presses Generate with a valid selection
- **THEN** the system shows a loading indicator until the report rows arrive

#### Scenario: Changing a filter clears stale results
- **WHEN** a report is displayed and the user changes the date range
- **THEN** the displayed rows are cleared until the user presses Generate again

### Requirement: Report data contract and authorization

The report data SHALL be served by the database function `get_attendance_report(child_id, from, to)` executing with the caller's privileges so that attendance row-level security applies. The function SHALL return one row per attendance record of the given child with a check-in whose attendance date is within the range, including attendance date, check-in, and check-out. Rows SHALL be ordered by attendance date descending (most recent day first), then check-in ascending. The function SHALL reject callers that are not staff, ranges whose end precedes the start, and ranges longer than 90 days inclusive.

#### Scenario: Teacher requests a child outside their groups
- **WHEN** a teacher calls the function for a child not in any group assigned to them
- **THEN** the function returns no rows

#### Scenario: Multiple check-ins on the same day
- **WHEN** a child checked in at 07:00, out at 12:00, and in again at 14:00 on the same day
- **THEN** the report contains two rows for that date, the 07:00 row first

#### Scenario: Most recent day first
- **WHEN** the child has records on 2026-10-08 and 2026-10-10
- **THEN** the 2026-10-10 rows are listed before the 2026-10-08 rows

#### Scenario: Parent calls the function
- **WHEN** a parent calls `get_attendance_report`
- **THEN** the function raises an error and returns no data

#### Scenario: Invalid range
- **WHEN** the function is called with `to` earlier than `from`, or with a span longer than 90 days
- **THEN** the function raises an error

### Requirement: In-app report display

The generated report SHALL show the selected child's full name as its heading, the date range, and the total number of rows. Each row SHALL display the attendance date, check-in time, and check-out time, and SHALL NOT display who recorded it. Rows SHALL be sorted by date descending (most recent day first) and, within the same date, by check-in time ascending. Times SHALL be displayed in the school timezone (`America/Bogota`). A row without a check-out SHALL show a localized "no check-out" placeholder. On viewports below the desktop breakpoint rows SHALL render as stacked cards; on desktop they SHALL render as a table. All labels SHALL come from the i18n catalog.

#### Scenario: Displaying a complete row
- **WHEN** a row has check-in 2026-10-10T12:05:00Z and check-out 2026-10-10T21:30:00Z
- **THEN** the report shows the date 2026-10-10 with check-in 07:05 and check-out 16:30

#### Scenario: Open attendance row
- **WHEN** a row has no check-out
- **THEN** the check-out cell shows the localized "no check-out" placeholder

#### Scenario: Desktop table
- **WHEN** a staff user views a generated report on a desktop viewport
- **THEN** rows render in a table with columns for date, check-in, and check-out under a heading with the child's name

#### Scenario: Empty result
- **WHEN** the selected child has no attendance records in the range
- **THEN** the system shows a localized empty-state message and no Download action

#### Scenario: Error loading the report
- **WHEN** the report request fails
- **THEN** the system shows a localized error message with a retry action

### Requirement: Download report as CSV

When a generated report has at least one row, the system SHALL offer a Download action that saves a CSV file of the displayed rows. CSV SHALL be the only export format. The file SHALL be UTF-8 with a byte-order mark, contain localized column headers for date, check-in, and check-out in the on-screen order, use the same sort order and school-timezone formatting as the screen, quote fields per RFC 4180, and neutralize cells starting with `=`, `+`, `-`, or `@` to prevent formula injection. The file name SHALL include the child's name and the date range.

#### Scenario: Downloading a report
- **WHEN** a staff user presses Download on a report for child "Sofía Gómez" from 2026-10-01 to 2026-10-13
- **THEN** the browser saves a file named like `asistencia_sofia-gomez_2026-10-01_2026-10-13.csv` containing a header row and one line per displayed row

#### Scenario: Accented headers open correctly
- **WHEN** the CSV is opened in Excel
- **THEN** accented characters in headers and placeholders display correctly

#### Scenario: Formula-like content
- **WHEN** a cell value starts with `=`
- **THEN** the CSV cell is prefixed so spreadsheet apps treat it as text
