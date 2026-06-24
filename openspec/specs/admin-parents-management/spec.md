# Spec: Admin Parents Management

## Purpose

Provides admin screens and operations for managing parent profiles: listing, creating, viewing, editing, deleting, re-sending invitations, and storing parent avatars with owner-scoped policies.

## Requirements

### Requirement: Parents list with search and lazy loading

The system SHALL provide a parents list screen at `/admin/parents` that displays parents (profiles with `role = 'parent'`) ordered alphabetically by last name then first name. The list SHALL load lazily in pages of 20 records per request, fetching additional pages as the user scrolls. The screen SHALL provide a search input that filters the list by name. Each list row SHALL display the parent's avatar, the parent's name, and the name(s) of the child or children the parent is linked to.

#### Scenario: Initial page loads 20 parents alphabetically
- **WHEN** an admin opens `/admin/parents`
- **THEN** the system displays the first 20 parents ordered alphabetically by last name then first name, each row showing avatar, parent name, and linked child name(s)

#### Scenario: Scrolling loads the next page
- **WHEN** the admin scrolls to the end of the loaded parents
- **THEN** the system requests the next 20 parents and appends them to the list

#### Scenario: Searching filters the list
- **WHEN** the admin types a query into the search input
- **THEN** the system filters the parents list by first or last name and shows matching results, paginated 20 at a time

#### Scenario: Empty results
- **WHEN** a search yields no matching parents
- **THEN** the system displays a localized empty-state message instead of rows

### Requirement: Add parent

The system SHALL provide an Add Parent screen at `/admin/parents/new` with a form to create a parent. The required fields SHALL be the identity document (document type and document number), names, last names, and email. Phone and avatar SHALL be optional, and children assignment SHALL be optional, so a parent SHALL be creatable with no children linked, no phone, and no avatar image. The children section SHALL be modeled as repeatable rows, each row pairing a child with a relationship (`father`, `mother`, or `other`), allowing the parent to be linked to multiple children with a distinct relationship per child. On submit the system SHALL create the parent through the `admin-create-user` edge function with `role = 'parent'`, which SHALL send an invitation email (magic link redirecting to `/auth/callback`) to the provided address and insert the `profiles` row as part of the same operation. For each child row the system SHALL create a `child_guardians` link writing the parent's profile id as `guardian_id`, the row's `child_id`, and the row's relationship. When an avatar is provided, the system SHALL upload it and store its path on the parent's profile. The system SHALL show a success toast on success and an error toast on failure, preserving the form state on failure. The system SHALL NOT track or display the parent's account verification status.

#### Scenario: Creating a parent sends an invitation email
- **WHEN** the admin submits a valid Add Parent form
- **THEN** the system creates the parent and an invitation email containing a magic link (redirecting to `/auth/callback`) is sent to the parent's email address as part of the same create operation

#### Scenario: Creating a parent with only required fields succeeds
- **WHEN** the admin fills only the required fields (document, names, last names, email; no children, no phone, no avatar) and submits the Add Parent form
- **THEN** the system creates the parent via the edge function, sends the invitation email, shows a localized success toast, and navigates to the new parent's detail screen

#### Scenario: Creating a parent linked to multiple children with distinct relationships
- **WHEN** the admin completes the required fields, adds two child rows — e.g. one child as `father` and another as `mother` — optionally picks an avatar, and submits
- **THEN** the system creates the parent, uploads the avatar when provided, and writes one `child_guardians` link per row with the parent's id as `guardian_id` and that row's relationship, and shows a localized success toast

#### Scenario: Creating a parent with a duplicate email fails with a specific message
- **WHEN** the admin submits the Add Parent form with an email that already belongs to an existing user
- **THEN** the system shows a localized error toast indicating the email is already registered and keeps the entered form data

#### Scenario: Creating a parent fails
- **WHEN** the submission fails (e.g., the edge function returns an error or a server error occurs)
- **THEN** the system shows a localized error toast and keeps the entered form data

#### Scenario: Required field validation
- **WHEN** the admin submits the form with a missing required field (document type, document number, names, last names, or a valid email)
- **THEN** the system marks the invalid fields, does not submit, and keeps the entered data

#### Scenario: Each child row requires both a child and a relationship
- **WHEN** the admin adds a child row but leaves the child unselected or the relationship unset
- **THEN** the system marks the incomplete row, does not submit, and keeps the entered data

#### Scenario: The same child cannot be linked twice
- **WHEN** the admin attempts to add a child row for a child already present in another row
- **THEN** the system prevents the duplicate selection so each child appears at most once for the parent

### Requirement: Parent detail with linked children

The system SHALL provide a parent detail screen at `/admin/parents/[parentID]` that displays the parent's identity (avatar, name and last name, document type and number, email if available, phone if available) and the children the parent is linked to through `child_guardians`. Linked children SHALL be displayed as avatar chips showing each child's name. The screen SHALL provide an edit action that navigates to the edit screen.

#### Scenario: Viewing a parent's detail
- **WHEN** an admin opens `/admin/parents/[parentID]` for an existing parent
- **THEN** the system displays the parent's avatar, name, document type and number, email and phone when available, and the children they are linked to as avatar chips, each derived from the parent's `child_guardians` links

#### Scenario: Parent with no children
- **WHEN** the parent is linked to no children
- **THEN** the system displays the identity header and a localized empty state for children

#### Scenario: Navigating to edit
- **WHEN** the admin activates the edit action on the detail screen
- **THEN** the system navigates to `/admin/parents/[parentID]/edit`

### Requirement: Resend parent invitation

The system SHALL provide a "Resend invitation" action on the parent detail screen so an admin can re-send the account setup email to a parent who has not yet logged in. The action SHALL invoke a server-side operation that resolves the parent's email from auth records (the email is not exposed to the client), and SHALL only be available to admins. When the parent has already accepted the invitation (account is active), the system SHALL inform the admin that no email was sent. The system SHALL show a localized success toast when an invitation is re-sent and a localized error toast on failure.

#### Scenario: Resending an invitation to a pending parent
- **WHEN** an admin activates "Resend invitation" for a parent who has not yet logged in
- **THEN** the system re-sends the invitation email (magic link) to that parent and shows a localized success toast

#### Scenario: Resending when the parent is already active
- **WHEN** an admin activates "Resend invitation" for a parent who has already logged in
- **THEN** the system does not send an email and informs the admin that the parent's account is already active

#### Scenario: Resending fails
- **WHEN** the resend operation fails (e.g., a server error)
- **THEN** the system shows a localized error toast

#### Scenario: Only admins can resend
- **WHEN** a non-admin attempts to invoke the resend operation
- **THEN** the system rejects the request and does not send an email

### Requirement: Edit parent

The system SHALL provide an Edit Parent screen at `/admin/parents/[parentID]/edit` that reuses the parent form pre-filled with the parent's current values, including one child row per existing `child_guardians` link with its relationship. Editable fields SHALL be document type and number, names, last names, phone, avatar, and the parent's child rows (each a child + relationship). The email field SHALL NOT be editable. On submit the system SHALL update the `profiles` record, reconcile child links via `child_guardians` (inserting new rows, removing deleted rows, and updating the relationship of kept rows, always writing the parent's id as `guardian_id`), and apply avatar changes (new, removed, or unchanged). The system SHALL show a success toast on success and an error toast on failure, preserving the form state on failure.

#### Scenario: Editing a parent's fields succeeds
- **WHEN** the admin changes editable fields and submits the edit form
- **THEN** the system updates the `profiles` record, reconciles child links in `child_guardians`, shows a localized success toast, and navigates to the parent's detail screen

#### Scenario: Adding, removing, and re-relating children
- **WHEN** the admin adds new child rows, removes others, and changes the relationship on a kept row, then submits
- **THEN** the system inserts `child_guardians` links for added rows, removes links for removed rows, updates the relationship for kept rows, and keeps the parent's id as `guardian_id`

#### Scenario: Removing the avatar
- **WHEN** the admin removes the existing avatar and submits
- **THEN** the system clears the stored avatar and shows a localized success toast

#### Scenario: Editing a parent fails
- **WHEN** the update fails (e.g., a server error)
- **THEN** the system shows a localized error toast and keeps the entered form data

### Requirement: Delete parent

The system SHALL provide a delete action on the Edit Parent screen that requires confirmation through a modal before deleting, and deletion SHALL be available to admins only. On confirmation the system SHALL delete the parent through the `admin-delete-user` edge function, which deletes the parent's `auth.users` record and cascades to the `profiles` record and to the parent's `child_guardians` links. The system SHALL NOT delete any `children` rows. The system SHALL show a success toast and navigate back to the parents list on success, and an error toast on failure.

#### Scenario: Confirming deletion removes the parent and its child links but keeps the children
- **WHEN** the admin activates delete on the edit screen and confirms in the modal
- **THEN** the system deletes the parent's auth user and profile, the parent's `child_guardians` links are removed by cascade, the linked `children` rows remain, a localized success toast is shown, and the system navigates back to `/admin/parents`

#### Scenario: Cancelling deletion keeps the parent
- **WHEN** the admin opens the delete confirmation modal and cancels
- **THEN** the system makes no change and closes the modal

#### Scenario: Deletion fails
- **WHEN** the deletion fails (e.g., a server error occurs in `admin-delete-user`)
- **THEN** the system shows a localized error toast and does not navigate away

#### Scenario: Only admins can delete
- **WHEN** a non-admin attempts to invoke `admin-delete-user` for a parent
- **THEN** the system rejects the request and does not delete the parent

### Requirement: Parent avatar storage and self-service editing

Parent avatars SHALL be stored in a private `parent-avatars` storage bucket under a path keyed by the parent's profile id (`<parentID>/avatar.<ext>`). Storage policies SHALL allow administrators to upload, update, and delete any parent avatar, and SHALL allow an authenticated parent to upload, update, and delete the avatar within their own profile-id folder (where the first path segment equals their authenticated user id). Authenticated users SHALL be able to read parent avatars via signed URLs. The path stored on the parent's `profiles.avatar_url` SHALL be resolved to a signed URL for display.

#### Scenario: Admin sets a parent's avatar
- **WHEN** an admin uploads or replaces a parent's avatar
- **THEN** the storage write succeeds and the parent's `profiles.avatar_url` is updated

#### Scenario: Parent edits their own avatar
- **WHEN** an authenticated parent uploads, updates, or removes the avatar in their own profile-id folder
- **THEN** the storage write succeeds

#### Scenario: A parent cannot modify another user's avatar
- **WHEN** an authenticated parent attempts to write to a folder that is not their own profile-id folder
- **THEN** the storage policy rejects the write
