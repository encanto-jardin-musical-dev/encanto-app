## ADDED Requirements

### Requirement: Children list with search and lazy loading

The system SHALL provide a children list screen at `/admin/children` that displays children ordered alphabetically by name. The list SHALL load lazily in pages of 20 records per request, fetching additional pages as the user scrolls. The screen SHALL provide a search input that filters the list by child name. Each list row SHALL display the child's avatar, name, and parent name.

#### Scenario: Initial page loads 20 children alphabetically
- **WHEN** an admin opens `/admin/children`
- **THEN** the system displays the first 20 children ordered alphabetically by name, each row showing avatar, name, and parent name

#### Scenario: Scrolling loads the next page
- **WHEN** the admin scrolls to the end of the loaded children
- **THEN** the system requests the next 20 children and appends them to the list

#### Scenario: Searching filters the list
- **WHEN** the admin types a query into the search input
- **THEN** the system filters the children list by name and shows matching results, paginated 20 at a time

#### Scenario: Empty results
- **WHEN** a search yields no matching children
- **THEN** the system displays a localized empty-state message instead of rows

### Requirement: Add child

The system SHALL provide an Add Children screen at `/admin/children/new` with a form to create a child. The required fields SHALL be the identity document (document type and document number), names, last names, gender, birth date, and address. The avatar and the groups selection SHALL be optional, and a child SHALL be creatable with no avatar image and no groups selected. The form SHALL NOT collect or require parents/guardians. On submit the system SHALL create a `children` record and, when one or more groups are selected, link them. The system SHALL show a success toast on success and an error toast on failure, preserving the form state on failure.

#### Scenario: Creating a child with only required fields succeeds
- **WHEN** the admin fills only the required fields (no avatar, no groups) and submits the Add Children form
- **THEN** the system creates the child record, shows a localized success toast, and navigates away from the empty form

#### Scenario: Creating a child with optional groups succeeds
- **WHEN** the admin completes the required fields, optionally selects one or more groups, and submits
- **THEN** the system creates the child record, links the selected groups, and shows a localized success toast

#### Scenario: Creating a child fails
- **WHEN** the submission fails (e.g., a server error)
- **THEN** the system shows a localized error toast and keeps the entered form data

#### Scenario: Required fields enforced
- **WHEN** the admin submits the form with a required field missing
- **THEN** the system indicates the missing field and does not submit
- **AND** a missing avatar or no selected groups does NOT block submission

### Requirement: Child detail

The system SHALL provide a child detail screen at `/admin/children/[childID]` that displays the child's identity (gender, name and last name, document type and number, birth date, address), a Groups section listing the groups the child belongs to, and a Parents section listing the child's guardians with name and email.

#### Scenario: Viewing a child's detail
- **WHEN** the admin navigates to a child's detail screen
- **THEN** the system displays the child's identity fields, the child's groups, and the child's parents with name and email

#### Scenario: Child with no groups or parents
- **WHEN** a child has no linked groups or guardians
- **THEN** the system renders the Groups and Parents sections without error, showing them as empty

### Requirement: Edit child

The system SHALL provide an edit screen at `/admin/children/[childID]/edit` presenting the child form prefilled with the child's current data. The avatar and groups SHALL remain optional, and the child SHALL be saveable with no avatar and no groups selected. The form SHALL NOT collect or require parents/guardians. On submit the system SHALL update the `children` record and reconcile the linked groups (including removing all group links when none are selected). The system SHALL show a success toast on success and an error toast on failure, preserving the form state on failure.

#### Scenario: Editing a child succeeds
- **WHEN** the admin changes fields on the prefilled edit form and submits
- **THEN** the system updates the child record, reconciles the group links, and shows a localized success toast

#### Scenario: Removing all groups on edit succeeds
- **WHEN** the admin deselects all groups on the edit form and submits
- **THEN** the system updates the child record, removes all of its group links, and shows a localized success toast

#### Scenario: Editing a child fails
- **WHEN** the update fails
- **THEN** the system shows a localized error toast and keeps the edited form data

### Requirement: Localized text for children management

All user-facing text on the children management screens — screen titles, the search placeholder, every form field label and placeholder, gender and document-type option labels, section headers (Groups, Parents), empty-state messages, and toast messages — SHALL be sourced from the app's i18n message catalog (`next-intl`) rather than hardcoded literals.

#### Scenario: Labels come from the catalog
- **WHEN** any children management screen is rendered
- **THEN** every title, label, placeholder, and toast message is read from the i18n catalog
- **AND** no user-facing text is a hardcoded literal in the components
