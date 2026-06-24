# Spec: Admin Teachers Management

## Purpose

Provides admin screens and operations for managing teacher profiles: listing, creating, viewing, editing, deleting, and re-sending invitations.

## Requirements

### Requirement: Teachers list with search and lazy loading

The system SHALL provide a teachers list screen at `/admin/teachers` that displays teachers (profiles with `role = 'teacher'`) ordered alphabetically by last name then first name. The list SHALL load lazily in pages of 20 records per request, fetching additional pages as the user scrolls. The screen SHALL provide a search input that filters the list by name. Each list row SHALL display the teacher's avatar, name, and role.

#### Scenario: Initial page loads 20 teachers alphabetically
- **WHEN** an admin opens `/admin/teachers`
- **THEN** the system displays the first 20 teachers ordered alphabetically by last name then first name, each row showing avatar, name, and role

#### Scenario: Scrolling loads the next page
- **WHEN** the admin scrolls to the end of the loaded teachers
- **THEN** the system requests the next 20 teachers and appends them to the list

#### Scenario: Searching filters the list
- **WHEN** the admin types a query into the search input
- **THEN** the system filters the teachers list by first or last name and shows matching results, paginated 20 at a time

#### Scenario: Empty results
- **WHEN** a search yields no matching teachers
- **THEN** the system displays a localized empty-state message instead of rows

### Requirement: Add teacher

The system SHALL provide an Add Teacher screen at `/admin/teachers/new` with a form to create a teacher. The required fields SHALL be the identity document (document type and document number), names, last names, role, and email. Phone, avatar, and groups selection SHALL be optional, and a teacher SHALL be creatable with no phone, no avatar image, and no groups selected. On submit the system SHALL create the teacher through the `admin-create-user` edge function, which SHALL send an invitation email (magic link) to the provided address and insert the `profiles` row as part of the same operation. When one or more groups are selected the system SHALL link them via `group_teachers`. When an avatar is provided, the system SHALL upload it and store its path on the teacher's profile. The system SHALL show a success toast on success and an error toast on failure, preserving the form state on failure. The system SHALL NOT track or display the teacher's account verification status.

#### Scenario: Creating a teacher sends an invitation email
- **WHEN** the admin submits a valid Add Teacher form
- **THEN** the system creates the teacher and an invitation email containing a magic link (redirecting to `/auth/callback`) is sent to the teacher's email address as part of the same create operation

#### Scenario: Creating a teacher with only required fields succeeds
- **WHEN** the admin fills only the required fields (document, names, last names, role, email; no phone, no avatar, no groups) and submits the Add Teacher form
- **THEN** the system creates the teacher via the edge function, sends the invitation email, shows a localized success toast, and navigates to the new teacher's detail screen

#### Scenario: Creating a teacher with optional groups and avatar succeeds
- **WHEN** the admin completes the required fields, optionally selects one or more groups, optionally picks an avatar, and submits
- **THEN** the system creates the teacher, uploads the avatar, links the selected groups via `group_teachers`, and shows a localized success toast

#### Scenario: Creating a teacher with a duplicate email fails with a specific message
- **WHEN** the admin submits the Add Teacher form with an email that already belongs to an existing user
- **THEN** the system shows a localized error toast indicating the email is already registered and keeps the entered form data

#### Scenario: Creating a teacher fails
- **WHEN** the submission fails (e.g., the edge function returns an error or a server error occurs)
- **THEN** the system shows a localized error toast and keeps the entered form data

#### Scenario: Required field validation
- **WHEN** the admin submits the form with a missing required field (document type, document number, names, last names, role, or a valid email)
- **THEN** the system marks the invalid fields, does not submit, and keeps the entered data

### Requirement: Teacher detail with group memberships

The system SHALL provide a teacher detail screen at `/admin/teachers/[teacherID]` that displays the teacher's identity (avatar, name and last name, document type and number, email if available, phone if available, role) and the groups the teacher belongs to. The screen SHALL provide an edit action that navigates to the edit screen.

#### Scenario: Viewing a teacher's detail
- **WHEN** an admin opens `/admin/teachers/[teacherID]` for an existing teacher
- **THEN** the system displays the teacher's avatar, name, document, phone, role, and the groups they belong to

#### Scenario: Teacher with no groups
- **WHEN** the teacher belongs to no groups
- **THEN** the system displays the identity header and a localized empty state for groups

#### Scenario: Navigating to edit
- **WHEN** the admin activates the edit action on the detail screen
- **THEN** the system navigates to `/admin/teachers/[teacherID]/edit`

### Requirement: Resend teacher invitation

The system SHALL provide a "Resend invitation" action on the teacher detail screen so an admin can re-send the account setup email to a teacher who has not yet logged in. The action SHALL invoke a server-side operation that resolves the teacher's email from auth records (the email is not exposed to the client), and SHALL only be available to admins. When the teacher has already accepted the invitation (account is active), the system SHALL inform the admin that no email was sent. The system SHALL show a localized success toast when an invitation is re-sent and a localized error toast on failure.

#### Scenario: Resending an invitation to a pending teacher
- **WHEN** an admin activates "Resend invitation" for a teacher who has not yet logged in
- **THEN** the system re-sends the invitation email (magic link) to that teacher and shows a localized success toast

#### Scenario: Resending when the teacher is already active
- **WHEN** an admin activates "Resend invitation" for a teacher who has already logged in
- **THEN** the system does not send an email and informs the admin that the teacher's account is already active

#### Scenario: Resending fails
- **WHEN** the resend operation fails (e.g., a server error)
- **THEN** the system shows a localized error toast

#### Scenario: Only admins can resend
- **WHEN** a non-admin attempts to invoke the resend operation
- **THEN** the system rejects the request and does not send an email

### Requirement: Edit teacher

The system SHALL provide an Edit Teacher screen at `/admin/teachers/[teacherID]/edit` that reuses the teacher form pre-filled with the teacher's current values. Editable fields SHALL be document type and number, names, last names, role, phone, avatar, and group assignments. The email field SHALL NOT be editable. On submit the system SHALL update the `profiles` record, reconcile group assignments via `group_teachers`, and apply avatar changes (new, removed, or unchanged). The system SHALL show a success toast on success and an error toast on failure, preserving the form state on failure.

#### Scenario: Editing a teacher's fields succeeds
- **WHEN** the admin changes editable fields and submits the edit form
- **THEN** the system updates the `profiles` record, reconciles group links, shows a localized success toast, and navigates to the teacher's detail screen

#### Scenario: Removing the avatar
- **WHEN** the admin removes the existing avatar and submits
- **THEN** the system clears the stored avatar and shows a localized success toast

#### Scenario: Editing a teacher fails
- **WHEN** the update fails (e.g., a server error)
- **THEN** the system shows a localized error toast and keeps the entered form data

### Requirement: Delete teacher

The system SHALL provide a delete action on the Edit Teacher screen that requires confirmation through a modal before deleting. On confirmation the system SHALL delete the teacher's `profiles` record. The system SHALL show a success toast and navigate back to the teachers list on success, and an error toast on failure.

#### Scenario: Confirming deletion removes the teacher
- **WHEN** the admin activates delete on the edit screen and confirms in the modal
- **THEN** the system deletes the teacher's profile, shows a localized success toast, and navigates back to `/admin/teachers`

#### Scenario: Cancelling deletion keeps the teacher
- **WHEN** the admin opens the delete confirmation modal and cancels
- **THEN** the system makes no change and closes the modal

#### Scenario: Deletion fails
- **WHEN** the deletion fails (e.g., the teacher is still referenced or a server error occurs)
- **THEN** the system shows a localized error toast and does not navigate away
