## ADDED Requirements

### Requirement: Admin users can filter contacts by role
The messages contacts list SHALL display a row of toggleable role-filter chips (Admin, Teacher, Parent) below the search bar when the current user's role is `admin`. Selecting a chip sets it as the active filter and restricts the contacts query to users whose role matches. Selecting the active chip again deactivates the filter and restores the full contacts list.

#### Scenario: Filter chips are visible only to admins
- **WHEN** the current user's role is `admin`
- **THEN** the contacts list SHALL render a row of role-filter chips (Admin, Teacher, Parent) below the search bar

#### Scenario: Filter chips are hidden for non-admin users
- **WHEN** the current user's role is `teacher` or `parent`
- **THEN** the contacts list SHALL NOT render any role-filter chips

#### Scenario: Activating a role filter restricts the list
- **WHEN** the admin taps an inactive role chip
- **THEN** that chip SHALL become visually active AND the contacts list SHALL show only contacts whose role matches the selected role

#### Scenario: Deactivating the active role filter restores the full list
- **WHEN** the admin taps the currently active role chip
- **THEN** that chip SHALL become visually inactive AND the contacts list SHALL show all contacts again

#### Scenario: Only one role chip can be active at a time
- **WHEN** the admin taps a role chip while a different chip is already active
- **THEN** the previously active chip SHALL become inactive AND the newly tapped chip SHALL become active

#### Scenario: Role filter is applied at the data layer
- **WHEN** a role filter is active
- **THEN** the contacts query SHALL fetch only profiles whose role equals the active filter value (not post-fetch client filtering)

#### Scenario: Name search combines with active role filter
- **WHEN** a role filter is active AND the admin types in the search bar
- **THEN** the list SHALL show only contacts that match both the active role AND the name search query

#### Scenario: Each role chip displays a localized label
- **WHEN** the filter chips row renders
- **THEN** each chip SHALL display the localized role label (`Administrador`, `Maestro`, `Acudiente`) from the `MessagesContacts.filter` translation namespace

#### Scenario: Active chip shows a dismiss icon
- **WHEN** a role chip is active
- **THEN** the chip SHALL display an `XMarkIcon` after the label to signal it can be dismissed by tapping

#### Scenario: Skeleton placeholders shown while loading
- **WHEN** the contacts query is pending (initial load or role filter change)
- **THEN** the list area SHALL display skeleton placeholder rows matching the contact card shape, while the search bar and filter chips remain visible and interactive
