# feed-tasks

## ADDED Requirements

### Requirement: Task cards in the parent feed

When the `admin_options_tasks` feature flag is enabled, the feed SHALL include a task card for each task of the currently selected group context, merged with message cards into a single list ordered by creation date descending. For a parent, the selected group context is the group of the currently selected child, so a parent with children in different groups SHALL only see tasks for the selected child's group. Each task card SHALL display the task title, a description snippet, the due date, the relative creation time, and a "see more" affordance that navigates to the task's detail screen.

#### Scenario: Parent sees tasks for the selected child's group
- **WHEN** a parent with the flag enabled views the feed with a child selected
- **THEN** task cards for that child's group appear in the feed interleaved with messages by date
- **AND** tasks from other groups do not appear

#### Scenario: Switching the selected child switches tasks
- **WHEN** a parent with children in different groups changes the selected child
- **THEN** the feed's task cards update to the newly selected child's group

#### Scenario: Task card navigates to detail
- **WHEN** a user taps a task card's "see more" affordance
- **THEN** the system navigates to that task's detail screen

#### Scenario: Flag disabled hides task cards
- **WHEN** the `admin_options_tasks` flag is disabled or still loading
- **THEN** the feed shows no task cards and issues no task queries

### Requirement: Tasks feed filter

When the `admin_options_tasks` feature flag is enabled, the feed filters SHALL include an active "Tasks" chip alongside "All" and "Messages". Selecting "Tasks" SHALL show only task cards; selecting "Messages" SHALL show only message cards; selecting "All" SHALL show the merged list. The selected filter SHALL be visually distinguished. When the flag is disabled the "Tasks" chip SHALL remain disabled, and the "Reports" chip SHALL remain disabled regardless of the flag.

#### Scenario: Filtering the feed to tasks
- **WHEN** a user with the flag enabled selects the "Tasks" chip
- **THEN** only task cards are shown in the feed

#### Scenario: Returning to the full feed
- **WHEN** the user selects the "All" chip
- **THEN** messages and task cards are shown merged by date

#### Scenario: Flag disabled keeps chip inert
- **WHEN** the `admin_options_tasks` flag is disabled
- **THEN** the "Tasks" chip is disabled and cannot change the feed

### Requirement: Read-only task detail for parents

A parent SHALL be able to open a task's detail screen from the feed and view its full content — title, group name, dates, description, and attachments — without any edit or delete actions. Access SHALL be limited to tasks visible to the parent (tasks of groups their children belong to).

#### Scenario: Parent opens a task from the feed
- **WHEN** a parent taps a task card
- **THEN** the detail screen shows the full task content in read-only form
- **AND** no edit or delete actions are displayed

#### Scenario: Parent cannot open another group's task
- **WHEN** a parent navigates directly to a task detail URL for a group none of their children belong to
- **THEN** the system renders the not-found page
