## MODIFIED Requirements

### Requirement: Resend teacher invitation

The system SHALL provide a "Resend invitation" action on the teacher detail screen so an admin can re-send the account setup email to a teacher who has not yet logged in. The action SHALL invoke a server-side operation that resolves the teacher's email from auth records (the email is not exposed to the client), and SHALL only be available to admins. The server operation SHALL accept any invited non-admin profile (a profile whose `role` is `teacher` or `parent`) as its target, accepting the target's id under a generic `userId` field while continuing to accept the legacy `teacherId` field for backward compatibility. When the teacher has already accepted the invitation (account is active), the system SHALL inform the admin that no email was sent. The system SHALL show a localized success toast when an invitation is re-sent and a localized error toast on failure.

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

#### Scenario: Legacy and generic identifiers are both accepted
- **WHEN** the resend operation is invoked with the legacy `teacherId` field or with the generic `userId` field
- **THEN** the system resolves the same target profile and behaves identically, preserving backward compatibility for existing callers

## ADDED Requirements

### Requirement: Teacher avatar self-service editing

Teacher avatars are stored in the private `teacher-avatars` bucket under a path keyed by the teacher's profile id (`<teacherID>/avatar.<ext>`). In addition to the existing administrator policies, the storage policies SHALL allow an authenticated teacher to upload, update, and delete the avatar within their own profile-id folder (where the first path segment equals their authenticated user id). A teacher SHALL NOT be able to modify another user's avatar.

#### Scenario: Teacher edits their own avatar
- **WHEN** an authenticated teacher uploads, updates, or removes the avatar in their own profile-id folder
- **THEN** the storage write succeeds

#### Scenario: A teacher cannot modify another user's avatar
- **WHEN** an authenticated teacher attempts to write to a folder that is not their own profile-id folder
- **THEN** the storage policy rejects the write

#### Scenario: Admin avatar management is preserved
- **WHEN** an admin uploads, updates, or deletes any teacher's avatar
- **THEN** the storage write succeeds as before
