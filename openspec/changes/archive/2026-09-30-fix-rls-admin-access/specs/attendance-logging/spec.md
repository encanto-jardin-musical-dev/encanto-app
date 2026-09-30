## MODIFIED Requirements

### Requirement: Group picker scoped by role

The `/attendance` page SHALL list only groups the current staff user is authorized to access: a teacher SHALL see groups assigned to them through `group_teachers`; an admin SHALL see every group, including groups with no assigned teacher, and SHALL be able to filter by teacher. The database SHALL enforce the same read boundary on `groups` and associated `child_groups` rows so direct Supabase API requests cannot expose other groups to a teacher. Required guardian access to the groups of their own children SHALL remain available outside the staff attendance flow.

#### Scenario: Teacher reads only assigned groups

- **WHEN** a teacher queries attendance groups or `groups` directly
- **THEN** only groups linked to that teacher through `group_teachers` are returned

#### Scenario: Teacher cannot bypass group filter

- **WHEN** a teacher requests a known group ID for a group to which they are not assigned
- **THEN** the group and its child-group links are not returned by RLS

#### Scenario: Admin reads all groups

- **WHEN** an admin opens the group picker with no teacher filter or queries groups directly
- **THEN** all groups are available, including groups with no assigned teacher

### Requirement: Staff-only database access

The database SHALL enforce attendance access independently of the client UI. Admins SHALL be able to read children, group membership, and attendance across all groups. Teachers SHALL be able to read children and attendance only when the child is linked through `child_groups` to at least one group assigned to that teacher through `group_teachers`. Teachers SHALL be able to INSERT or UPDATE attendance only for such children. The `attendance` row is child-scoped (it has no `group_id`), so a teacher assigned to any group containing that child is authorized for that child's attendance row. Guardian reads SHALL remain limited to each guardian's own linked children; parents SHALL have no attendance access. Anonymous users SHALL NOT read child records or attendance. Row deletion SHALL NOT be granted.

#### Scenario: Admin reads and records attendance across groups

- **WHEN** an admin reads attendance or records attendance for a child in any group, including a teacherless group
- **THEN** the operation is permitted

#### Scenario: Assigned teacher reads and records attendance

- **WHEN** a teacher reads or records attendance for a child linked to one of the teacher's assigned groups
- **THEN** the SELECT, INSERT, or UPDATE is permitted

#### Scenario: Teacher cannot read another group's child or attendance

- **WHEN** a teacher queries a child or attendance row for a child who is not linked to any of the teacher's assigned groups, including by supplying a known child ID directly
- **THEN** the child and attendance row are not returned, and writes are rejected by RLS

#### Scenario: Attendance write cannot change to an unauthorized child

- **WHEN** a teacher inserts or updates attendance with a child ID outside all of the teacher's assigned groups
- **THEN** the write is rejected by the applicable `WITH CHECK` policy

#### Scenario: Guardian remains scoped to their own child

- **WHEN** a guardian reads child or group data through the existing guardian access path
- **THEN** only data associated with that guardian's linked children is returned

#### Scenario: Parent and anonymous attendance access is denied

- **WHEN** a parent queries or writes attendance, or an anonymous user queries children or attendance
- **THEN** no protected rows are returned and writes are rejected

#### Scenario: Attendance deletion remains unavailable

- **WHEN** an admin or teacher attempts to delete an attendance row
- **THEN** the database rejects the operation
