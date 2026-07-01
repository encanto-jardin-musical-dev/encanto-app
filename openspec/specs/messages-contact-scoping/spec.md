# messages-contact-scoping Specification

## Purpose
TBD - created by archiving change fix-parent-messages-contact-list. Update Purpose after archive.
## Requirements
### Requirement: Parent contacts are scoped to their children's group teachers plus all admins
The `get_profiles_by_guardian()` database function SHALL return, for the calling parent (`auth.uid()`), exactly: every profile with `role = 'admin'`, and every profile with `role = 'teacher'` who is assigned (via `group_teachers`) to at least one group that at least one of the parent's children (via `child_guardians` and `child_groups`) belongs to. No other profiles SHALL be returned.

#### Scenario: Parent sees teachers from their children's groups
- **WHEN** a parent with a child enrolled in a group calls `get_profiles_by_guardian()`
- **THEN** the result SHALL include every teacher assigned to that group via `group_teachers`

#### Scenario: Parent does not see teachers outside their children's groups
- **WHEN** a parent calls `get_profiles_by_guardian()`
- **THEN** the result SHALL NOT include any teacher whose only group assignments are to groups none of the parent's children belong to

#### Scenario: Parent sees all admins regardless of group
- **WHEN** any parent calls `get_profiles_by_guardian()`
- **THEN** the result SHALL include every profile with `role = 'admin'`, independent of the parent's children or groups

#### Scenario: Parent does not see other parents
- **WHEN** a parent calls `get_profiles_by_guardian()`
- **THEN** the result SHALL NOT include any profile with `role = 'parent'`

#### Scenario: Parent with no children still sees admins
- **WHEN** a parent with no linked children calls `get_profiles_by_guardian()`
- **THEN** the result SHALL include every admin profile AND SHALL NOT include any teacher profile

#### Scenario: Parent with children in multiple groups sees the union of teachers
- **WHEN** a parent's children belong to more than one group
- **THEN** the result SHALL include every teacher assigned to any of those groups, without duplicates

