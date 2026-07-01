## Purpose
Ensures parents in the Feed can only see and select their own children, and that switching the selected child correctly re-scopes Feed messages to that child's group.

## Requirements

### Requirement: Parent child selector scoped to guardianship
When a parent is logged in, the Feed child selector SHALL list only children for whom that parent has a `child_guardians` relationship. The list SHALL NOT include children belonging to other families.

#### Scenario: Parent with one child sees only that child
- **WHEN** a parent who is guardian of exactly one child opens the Feed
- **THEN** the child selector shows exactly that one child and no others

#### Scenario: Parent with multiple children sees only their own
- **WHEN** a parent who is guardian of two children opens the Feed
- **THEN** the child selector shows exactly those two children and no children from other families

#### Scenario: Server-side enforcement independent of client query
- **WHEN** an authenticated parent queries `child_guardians` directly (bypassing the app's `getUserChildren` client filter)
- **THEN** the database SHALL return only rows where that parent is the `guardian_id`, not all rows in the table

#### Scenario: Admin and existing admin pages remain unaffected
- **WHEN** an admin user loads the children or parents management pages
- **THEN** all children/parent-guardian relationships SHALL remain visible to the admin, unchanged from current behavior

### Requirement: Single-select child context
The Feed child selector SHALL allow selecting exactly one child at a time, never multiple children simultaneously.

#### Scenario: Selecting a child replaces the previous selection
- **WHEN** a parent has child A selected and selects child B
- **THEN** the selector's active selection becomes child B only, and child A is no longer selected

### Requirement: Feed messages scoped to the selected child's group
Switching the selected child in the Feed selector SHALL scope the displayed Feed messages to that child's group only, excluding messages from groups of the parent's other children.

#### Scenario: Switching children re-scopes the Feed
- **WHEN** a parent switches the child selector from child A (in group X) to child B (in group Y)
- **THEN** the Feed SHALL display only group Y's messages (plus any direct messages to the parent), and no longer display group X's messages
