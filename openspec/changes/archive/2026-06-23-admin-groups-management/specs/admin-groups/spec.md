## ADDED Requirements

### Requirement: Admin can browse and search groups
The system SHALL provide an admin-only Groups list screen at `/admin/groups` that lists all groups with their image and name, supports searching by name, and navigates to a group's detail when a row is selected.

#### Scenario: Viewing the groups list
- **WHEN** an admin opens `/admin/groups`
- **THEN** the system displays a navigation bar titled "Grupos" with a back route to `/admin`, a search input, and a scrollable list of groups each showing the group image (or a placeholder) and name

#### Scenario: Searching groups by name
- **WHEN** the admin types text into the search input
- **THEN** the list is filtered (debounced, case-insensitive) to groups whose name matches the entered text

#### Scenario: Empty list
- **WHEN** there are no groups matching the current search
- **THEN** the system shows an empty-state message instead of list rows

#### Scenario: Opening a group from the list
- **WHEN** the admin taps a group row
- **THEN** the system navigates to that group's detail screen at `/admin/groups/{groupID}`

#### Scenario: Starting group creation from the list
- **WHEN** the admin taps the Action Button on the list screen
- **THEN** the system navigates to the create-group screen at `/admin/groups/new`

### Requirement: Admin can create a group
The system SHALL provide a create-group screen at `/admin/groups/new` where the admin enters a required name, an optional image, and an optional teacher, and persists a new group.

#### Scenario: Creating a group with only a name
- **WHEN** the admin enters a non-empty name, leaves image and teacher empty, and taps the save Action Button
- **THEN** the system creates the group with that name and navigates to the new group's detail screen, showing a success toast

#### Scenario: Creating a group with an image and a teacher
- **WHEN** the admin enters a name, selects an image file, selects a teacher, and taps save
- **THEN** the system uploads the image, stores its reference and the assigned `teacher_id` on the group, and navigates to the group detail

#### Scenario: Missing required name
- **WHEN** the admin taps save with an empty name
- **THEN** the system marks the name field invalid and does not create a group

#### Scenario: Invalid image file
- **WHEN** the admin selects an image that exceeds the size limit or is an unsupported type
- **THEN** the system shows a validation error and does not create the group

### Requirement: Admin can view group detail
The system SHALL provide a group detail screen at `/admin/groups/{groupID}` that displays the group image, name, the assigned teacher (if any), and the children belonging to the group.

#### Scenario: Viewing a group with a teacher and children
- **WHEN** the admin opens the detail of a group that has an assigned teacher and member children
- **THEN** the system displays the group image and name, the teacher's name/avatar, and a list of the children in the group

#### Scenario: Viewing a group without a teacher or children
- **WHEN** the admin opens a group that has no teacher and no children
- **THEN** the system displays the image and name and indicates there is no teacher and no children, without error

#### Scenario: Editing from detail
- **WHEN** the admin taps the Action Button on the detail screen
- **THEN** the system navigates to the edit screen at `/admin/groups/{groupID}/edit`

### Requirement: Admin can edit and delete a group
The system SHALL provide an edit screen at `/admin/groups/{groupID}/edit` that pre-fills the group's current name, image, and teacher, lets the admin update them or delete the group, and persists the changes.

#### Scenario: Updating a group
- **WHEN** the admin changes the name, image, or teacher and taps save
- **THEN** the system persists the updated values and navigates back to the group detail with a success toast

#### Scenario: Removing the group image
- **WHEN** the admin removes the existing image and taps save
- **THEN** the system clears the group's image reference

#### Scenario: Deleting a group
- **WHEN** the admin confirms deletion in the confirmation dialog
- **THEN** the system deletes the group and navigates back to the groups list with a success toast

### Requirement: Group management is restricted to admins
The system SHALL enforce that only authenticated users with the admin role can create, update, or delete groups.

#### Scenario: Admin write access
- **WHEN** an admin performs a create, update, or delete on a group
- **THEN** the operation is permitted by the existing admin RLS policies on the `groups` table

#### Scenario: Non-admin write attempt
- **WHEN** a non-admin user attempts to create, update, or delete a group
- **THEN** the database rejects the write via RLS
