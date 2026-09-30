## ADDED Requirements

### Requirement: Admin routes require an authenticated admin role

Every route under `/admin` SHALL verify the current authenticated user and their `profiles.role` on the server before rendering its page. Unauthenticated users SHALL be redirected to `/login`. Authenticated users with no profile, a profile-query error, or a role other than `admin` SHALL be denied the admin page and redirected to `/feed`. Admin users SHALL be allowed through. Database RLS SHALL remain the independent data-access boundary.

#### Scenario: Unauthenticated user requests an admin route

- **WHEN** an unauthenticated user requests `/admin/children`
- **THEN** the request is redirected to `/login` without rendering admin content

#### Scenario: Non-admin user requests an admin route

- **WHEN** an authenticated parent or teacher requests any route under `/admin`
- **THEN** the request is redirected to `/feed` without rendering admin content

#### Scenario: Admin user requests an admin route

- **WHEN** an authenticated user whose profile role is `admin` requests `/admin/children`
- **THEN** the admin children page is rendered
