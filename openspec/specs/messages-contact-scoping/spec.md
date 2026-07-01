# messages-contact-scoping Specification

## Purpose
TBD - created by archiving change fix-parent-messages-contact-list. Update Purpose after archive.
## Requirements
### Requirement: Parent contacts are scoped to their children's group teachers plus all admins
The `get_profiles_by_guardian(p_child_id uuid default null)` database function SHALL return, for the calling parent (`auth.uid()`), exactly: every profile with `role = 'admin'`, and every profile with `role = 'teacher'` who is assigned (via `group_teachers`) to at least one group that at least one of the parent's children (via `child_guardians` and `child_groups`) belongs to. No other profiles SHALL be returned. When `p_child_id` is provided, the teacher branch SHALL be further restricted to groups that the specified child belongs to, still validated against `child_guardians` for the calling parent — a `p_child_id` that does not belong to the calling parent SHALL yield zero teacher rows (admins are still returned).

#### Scenario: Parent sees teachers from their children's groups
- **WHEN** a parent with a child enrolled in a group calls `get_profiles_by_guardian()` with no argument
- **THEN** the result SHALL include every teacher assigned to that group via `group_teachers`

#### Scenario: Parent does not see teachers outside their children's groups
- **WHEN** a parent calls `get_profiles_by_guardian()` with no argument
- **THEN** the result SHALL NOT include any teacher whose only group assignments are to groups none of the parent's children belong to

#### Scenario: Parent sees all admins regardless of group
- **WHEN** any parent calls `get_profiles_by_guardian()`, with or without `p_child_id`
- **THEN** the result SHALL include every profile with `role = 'admin'`, independent of the parent's children or groups

#### Scenario: Parent does not see other parents
- **WHEN** a parent calls `get_profiles_by_guardian()`
- **THEN** the result SHALL NOT include any profile with `role = 'parent'`

#### Scenario: Parent with no children still sees admins
- **WHEN** a parent with no linked children calls `get_profiles_by_guardian()`
- **THEN** the result SHALL include every admin profile AND SHALL NOT include any teacher profile

#### Scenario: Parent with children in multiple groups sees the union of teachers by default
- **WHEN** a parent's children belong to more than one group and `p_child_id` is not provided
- **THEN** the result SHALL include every teacher assigned to any of those groups, without duplicates

#### Scenario: Providing p_child_id scopes teachers to that child's groups only
- **WHEN** a parent calls `get_profiles_by_guardian(p_child_id => <their child's id>)`
- **THEN** the result SHALL include admins plus only the teachers of groups that specific child belongs to, excluding teachers of the parent's other children's groups

#### Scenario: Providing a child_id not owned by the calling parent yields no teachers
- **WHEN** a parent calls `get_profiles_by_guardian(p_child_id => <a child id not linked to them via child_guardians>)`
- **THEN** the result SHALL include only admins and zero teacher rows

