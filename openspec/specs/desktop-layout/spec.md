## Purpose

Defines the desktop layout adaptation for authenticated routes, including the responsive app shell, collapsible sidebar navigation, unified content width, and desktop two-pane messages layout.

## Requirements

### Requirement: Shared responsive app shell for authenticated routes

The system SHALL render all authenticated routes (feed, messages, admin, attendance, tasks, reports) inside a single shared app shell. The shell SHALL provide a persistent sidebar on desktop viewports and SHALL NOT alter the layout or chrome of mobile viewports below the desktop breakpoint.

#### Scenario: Authenticated route renders inside the shell on desktop
- **WHEN** an authenticated user opens any of feed, messages, admin, attendance, tasks, or reports on a desktop viewport
- **THEN** the page renders inside the shared shell with the sidebar visible and the page content in the main region

#### Scenario: Mobile viewport keeps current layout
- **WHEN** an authenticated user opens any authenticated route on a viewport below the desktop breakpoint
- **THEN** the sidebar is not rendered and the page layout matches the pre-existing mobile behavior

#### Scenario: Public routes are not wrapped by the shell
- **WHEN** any user opens the login page or an auth callback page
- **THEN** the page renders without the app shell sidebar

### Requirement: Sidebar navigation items are role and feature-flag gated

The sidebar SHALL display navigation items according to the same role and PostHog feature-flag matrix used by the plus button's staff actions, with a single shared source of truth for that gating logic. Feed and Messages SHALL be visible to all roles. Attendance, Attendance Report, Daily Report, and Tasks SHALL be visible to staff roles only and each SHALL be hidden when its dedicated flag (`admin_options_attendance`, `admin_options_attendance_report`, `admin_options_reports`, `admin_options_tasks`) is disabled or still loading (`undefined`). The Admin item SHALL be visible only to admins.

#### Scenario: Admin sidebar shows all enabled sections
- **WHEN** an admin views the sidebar and all per-action flags are enabled
- **THEN** the sidebar shows Feed, Messages, Attendance, Attendance Report, Daily Report, Tasks, and Admin items

#### Scenario: Teacher sidebar excludes Admin
- **WHEN** a teacher views the sidebar and all per-action flags are enabled
- **THEN** the sidebar shows Feed, Messages, Attendance, Attendance Report, Daily Report, and Tasks
- **AND** the sidebar does NOT show an Admin item

#### Scenario: Parent sidebar shows only Feed and Messages
- **WHEN** a parent views the sidebar
- **THEN** the sidebar shows only Feed and Messages items

#### Scenario: Disabled or loading flag hides its sidebar item
- **WHEN** a staff user views the sidebar and `admin_options_tasks` is disabled or still loading
- **THEN** the Tasks item is not shown in the sidebar

#### Scenario: Attendance Report flag disabled hides its sidebar item
- **WHEN** a staff user views the sidebar and `admin_options_attendance_report` is disabled or still loading
- **THEN** the Attendance Report item is not shown in the sidebar

#### Scenario: Selecting a sidebar item navigates to its route
- **WHEN** a user selects a sidebar item
- **THEN** the system navigates to that item's route

### Requirement: Active route is highlighted in the sidebar

The sidebar SHALL visually highlight the navigation item corresponding to the current route.

#### Scenario: Current section is highlighted
- **WHEN** a user is on `/attendance` or any of its sub-routes on a desktop viewport
- **THEN** the Attendance sidebar item is rendered in an active/highlighted state

#### Scenario: Unrelated items are not highlighted
- **WHEN** a user is on `/feed`
- **THEN** no sidebar item other than Feed is highlighted

### Requirement: Unified desktop content width

On desktop viewports, every authenticated page SHALL render its content inside a centered, width-constrained main region provided by the shell. The previous left-aligned fixed-width columns and full-bleed stretching SHALL be removed.

#### Scenario: Feed content is centered and constrained on desktop
- **WHEN** a user opens the feed on a desktop viewport
- **THEN** the feed content is centered horizontally within the main region and does not stretch to the full viewport width

#### Scenario: Attendance, tasks, and reports are no longer full-bleed
- **WHEN** a user opens attendance, tasks, or reports on a desktop viewport
- **THEN** the page content is centered and width-constrained instead of stretching edge to edge

#### Scenario: Mobile width behavior is unchanged
- **WHEN** a user opens any authenticated route below the desktop breakpoint
- **THEN** content occupies the full viewport width as before

### Requirement: Messages two-pane layout on desktop

On desktop viewports, the messages section SHALL display the contacts list and the selected conversation side by side. On mobile, the existing drill-down flow (list, then conversation) SHALL be preserved.

#### Scenario: Desktop shows list and conversation together
- **WHEN** a user opens a conversation on a desktop viewport
- **THEN** the contacts list remains visible in one pane and the conversation renders in the adjacent pane

#### Scenario: Desktop without a selected conversation shows an empty state
- **WHEN** a user opens the messages list on a desktop viewport without selecting a contact
- **THEN** the conversation pane displays an empty state

#### Scenario: Mobile keeps drill-down navigation
- **WHEN** a user below the desktop breakpoint opens a conversation from the contacts list
- **THEN** the conversation replaces the list view as it does today

### Requirement: Action button coexists with the desktop shell

The floating action button SHALL remain available on desktop viewports and SHALL NOT overlap the sidebar or the constrained content in a way that blocks interaction. Mobile-only clearance padding SHALL NOT create extra empty space on desktop.

#### Scenario: Action button is usable on desktop
- **WHEN** a user opens the feed on a desktop viewport
- **THEN** the action button is visible and can be activated without overlapping the sidebar

#### Scenario: Mobile clearance padding does not apply on desktop
- **WHEN** a user opens a page that reserves space for the action button on a desktop viewport
- **THEN** the mobile-only clearance padding is not applied

### Requirement: Sidebar chrome is collapsible

The sidebar SHALL include a toggle that collapses it to icon-only mode and expands it back to full width. The toggle button SHALL be positioned overlapping the right edge of the sidebar so the border is hidden. In collapsed mode the sidebar SHALL display only navigation icons and the user avatar, hiding item labels and the user's name.

#### Scenario: Collapsing the sidebar
- **WHEN** a user clicks the collapse toggle on a desktop viewport
- **THEN** the sidebar shrinks to icon-only width, labels and the user name are hidden, and the toggle button remains visible overlapping the edge

#### Scenario: Expanding the sidebar
- **WHEN** a user clicks the expand toggle on a collapsed desktop sidebar
- **THEN** the sidebar returns to full width and labels/name are shown

### Requirement: Sidebar displays the app icon and app name

The sidebar header SHALL display the app icon (`/icon.png`) and the localized app name "Encanto App" instead of the previous brand logo and "Encanto" text.

#### Scenario: Sidebar header shows app icon and name
- **WHEN** the sidebar is rendered on a desktop viewport
- **THEN** the header shows the app icon image and the text "Encanto App"

### Requirement: Sidebar user avatar opens the avatar edit modal

The user avatar in the sidebar footer SHALL be clickable and SHALL open the existing avatar edit modal, allowing the user to upload or remove their profile picture. The avatar image SHALL be resolved via a signed URL from the stored avatar path.

#### Scenario: Clicking the sidebar avatar opens the edit modal
- **WHEN** a user clicks their avatar in the sidebar footer
- **THEN** the avatar edit modal opens

#### Scenario: Sidebar avatar renders the signed image
- **WHEN** the user has an avatar stored
- **THEN** the sidebar avatar renders the signed image URL

### Requirement: Sidebar text is localized

All sidebar text — item labels, accessible labels, empty-state messages, app name, and toggle labels introduced by this capability — SHALL be sourced from the `next-intl` message catalog rather than hardcoded literals.

#### Scenario: Sidebar labels come from the message catalog
- **WHEN** the sidebar is rendered
- **THEN** every item label is read from the i18n catalog and no label is a hardcoded literal

#### Scenario: Locale determines sidebar language
- **WHEN** the active locale resolves to Spanish
- **THEN** the sidebar labels display their Spanish translations
