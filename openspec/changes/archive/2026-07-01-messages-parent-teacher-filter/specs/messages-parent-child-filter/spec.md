## ADDED Requirements

### Requirement: Child filter is visible only to parents with multiple children
The Messages contacts list SHALL render a row of toggleable child-filter chips (one per child, labeled with the child's full name) below the search bar when the current user's role is `parent` AND that parent has more than one child. Parents with zero or one child SHALL NOT see this row.

#### Scenario: Filter chips are visible for a parent with multiple children
- **WHEN** the current user's role is `parent` and they have two or more children
- **THEN** the contacts list SHALL render a row of child-filter chips, one per child

#### Scenario: Filter chips are hidden for a parent with one or zero children
- **WHEN** the current user's role is `parent` and they have exactly one child, or none
- **THEN** the contacts list SHALL NOT render any child-filter chips

#### Scenario: Filter chips are hidden for non-parent users
- **WHEN** the current user's role is `admin` or `teacher`
- **THEN** the contacts list SHALL NOT render any child-filter chips

### Requirement: Selecting a child scopes the contacts list to that child's group teachers
Selecting a child-filter chip SHALL restrict the contacts list to admins (always shown) plus only the teachers of groups that selected child belongs to. Selecting the active chip again SHALL deactivate the filter and restore the full list of all the parent's children's group teachers.

#### Scenario: Activating a child filter restricts the teacher list
- **WHEN** a parent taps an inactive child chip
- **THEN** that chip SHALL become visually active AND the contacts list SHALL show only admins plus the teachers of that child's group(s)

#### Scenario: Deactivating the active child filter restores the full list
- **WHEN** a parent taps the currently active child chip
- **THEN** that chip SHALL become visually inactive AND the contacts list SHALL show admins plus teachers from all of the parent's children's groups again

#### Scenario: Only one child chip can be active at a time
- **WHEN** a parent taps a child chip while a different chip is already active
- **THEN** the previously active chip SHALL become inactive AND the newly tapped chip SHALL become active

#### Scenario: Child filter is applied at the data layer
- **WHEN** a child filter is active
- **THEN** the contacts query SHALL call `get_profiles_by_guardian` with that child's id (not post-fetch client filtering)

#### Scenario: Name search combines with an active child filter
- **WHEN** a parent types into the search bar while a child filter is active
- **THEN** the list SHALL show only contacts whose full name contains the typed text AND who belong to the currently filtered result set
