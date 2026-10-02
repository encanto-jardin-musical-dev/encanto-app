## ADDED Requirements

### Requirement: Teacher group selector is enabled

A teacher SHALL be able to change the Feed's group selector. The selector SHALL list exactly the groups the teacher is assigned to through `group_teachers`, SHALL allow exactly one group to be selected at a time, and SHALL NOT be disabled for the teacher role.

#### Scenario: Teacher with one assigned group sees a single-option selector
- **WHEN** a teacher assigned to exactly one group opens the Feed
- **THEN** the group selector lists that group
- **AND** that group is selected
- **AND** the selector is interactive rather than disabled

#### Scenario: Teacher with multiple assigned groups can switch between them
- **WHEN** a teacher assigned to three groups opens the Feed
- **THEN** the group selector lists exactly those three groups
- **AND** the teacher can select any one of them
- **AND** selecting a group replaces the previous selection so exactly one group is selected at a time

#### Scenario: Teacher is never offered unassigned groups
- **WHEN** a teacher who is not assigned to group X opens the Feed
- **THEN** group X does not appear in the group selector

#### Scenario: Existing admin and parent selector behavior is unchanged
- **WHEN** an admin or a parent uses the group selector
- **THEN** their options, single-select behavior, and feed scoping behave as before

### Requirement: Feed content scoped to the selected teacher's group

While a group is selected, the Feed SHALL show messages, tasks, and reports for that group only. Changing the selected group SHALL re-scope all three, and the Feed SHALL NOT display content belonging to a previously selected group at any point during or after the switch.

#### Scenario: Switching groups re-scopes messages
- **WHEN** a teacher with group X selected switches to group Y
- **THEN** the Feed shows only messages addressed to the teacher with `group_id` equal to group Y, plus messages with no group (direct messages)
- **AND** no message from group X remains displayed

#### Scenario: Switching groups re-scopes tasks
- **WHEN** a teacher with group X selected switches to group Y and the `admin_options_tasks` feature flag is enabled
- **THEN** the Feed's task cards are tasks of group Y
- **AND** no task of group X remains displayed

#### Scenario: Switching groups re-scopes reports
- **WHEN** a teacher with group X selected switches to group Y and the `admin_options_reports` feature flag is enabled
- **THEN** the Feed's report cards are reports of group Y, including individual reports for any child of that group
- **AND** no report of group X remains displayed

#### Scenario: Previous group's content is never rendered mid-switch
- **WHEN** a teacher changes the selected group
- **THEN** the Feed does not render the previously selected group's messages, tasks, or reports while the newly selected group's content is loading

#### Scenario: Feature flags disabled leave the group context without effect
- **WHEN** the `admin_options_tasks` and `admin_options_reports` feature flags are disabled
- **THEN** changing the selected group still re-scopes messages
- **AND** no task or report queries are issued and no task or report cards are shown

#### Scenario: Realtime inserts from other groups do not appear
- **WHEN** a message, task, or report is inserted into a group other than the teacher's selected group
- **THEN** it does not appear in the teacher's Feed

### Requirement: Outgoing teacher messages carry the selected group

A message sent by a teacher SHALL be tagged with the group currently selected in the Feed group selector.

#### Scenario: Sent message is tagged with the selected group
- **WHEN** a teacher with group Y selected sends a message
- **THEN** the stored message's `group_id` is group Y
- **AND** a parent of a child in group Y sees that message in their feed

#### Scenario: Teacher with no assigned group cannot post a group message
- **WHEN** a teacher assigned to no groups attempts to send a message
- **THEN** the send is not attempted
- **AND** an error is surfaced to the teacher

### Requirement: Persisted group context reconciled against assigned groups

The group selection SHALL be persisted across sessions. On load, if the persisted selection is not among the groups currently offered to the signed-in user, the system SHALL reconcile it to the first offered group, or clear the selection when no groups are offered.

#### Scenario: Teacher unassigned from the persisted group falls back to a current group
- **WHEN** a teacher whose persisted selection is group X opens the Feed and is no longer assigned to group X
- **THEN** the selection is replaced with the first group the teacher is currently assigned to
- **AND** the Feed does not show group X's messages, tasks, or reports

#### Scenario: Persisted selection survives a reload while still assigned
- **WHEN** a teacher assigned to groups X and Y has group Y selected and reloads the app
- **THEN** group Y remains selected
- **AND** the Feed shows group Y's content without the teacher re-selecting it

#### Scenario: No assigned groups clears the selection
- **WHEN** a signed-in user has no selectable groups and the persisted selection refers to one
- **THEN** the persisted selection is cleared
- **AND** no group-scoped content is requested