# Spec: Admin Detail Cross-Navigation

## Purpose

TBD

## Requirements

### Requirement: Group detail links to related teachers and children
On the group detail screen, each related teacher chip and each related child chip SHALL act as a navigation link to that entity's own admin detail screen.

#### Scenario: Navigating to a teacher from a group
- **WHEN** an admin viewing a group's detail taps a teacher chip
- **THEN** the app navigates to that teacher's detail screen at `/admin/teachers/{teacherId}`

#### Scenario: Navigating to a child from a group
- **WHEN** an admin viewing a group's detail taps a child chip
- **THEN** the app navigates to that child's detail screen at `/admin/children/{childId}`

### Requirement: Child detail links to related groups and parents
On the child detail screen, each related group chip and each related parent (guardian) chip SHALL act as a navigation link to that entity's own admin detail screen.

#### Scenario: Navigating to a group from a child
- **WHEN** an admin viewing a child's detail taps a group chip
- **THEN** the app navigates to that group's detail screen at `/admin/groups/{groupId}`

#### Scenario: Navigating to a parent from a child
- **WHEN** an admin viewing a child's detail taps a parent (guardian) chip
- **THEN** the app navigates to that parent's detail screen at `/admin/parents/{parentId}`

### Requirement: Teacher detail links to related groups
On the teacher detail screen, each related group chip SHALL act as a navigation link to that group's admin detail screen.

#### Scenario: Navigating to a group from a teacher
- **WHEN** an admin viewing a teacher's detail taps a group chip
- **THEN** the app navigates to that group's detail screen at `/admin/groups/{groupId}`

### Requirement: Parent detail links to related children
On the parent detail screen, each related child chip SHALL act as a navigation link to that child's admin detail screen.

#### Scenario: Navigating to a child from a parent
- **WHEN** an admin viewing a parent's detail taps a child chip
- **THEN** the app navigates to that child's detail screen at `/admin/children/{childId}`

### Requirement: Empty related sets remain non-navigable
When a detail screen has no related entities of a given type, the corresponding section SHALL display its empty-state label and SHALL NOT render any navigable chips.

#### Scenario: No related entities to navigate to
- **WHEN** an admin views a detail screen whose related set of a given type is empty
- **THEN** the section shows its empty-state label and presents no tappable chips
