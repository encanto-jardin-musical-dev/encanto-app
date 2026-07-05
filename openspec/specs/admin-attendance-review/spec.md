# admin-attendance-review

## Purpose

Provides an admin-only, school-wide view of today's attendance so administrators can see which children are currently present across all groups and perform single-child check-out corrections.

## Requirements

### Requirement: Admin attendance overview access

The `/admin/attendance` screen SHALL render its content only when the PostHog feature flag `admin_options_attendance` evaluates to `true` AND the current user's role is admin. A flag value of `false` or `undefined` (still loading), or any role other than admin (including teacher), SHALL be treated as disabled.

#### Scenario: Admin with flag enabled
- **WHEN** an admin with `admin_options_attendance` enabled navigates to `/admin/attendance`
- **THEN** the attendance overview renders

#### Scenario: Teacher is denied
- **WHEN** a teacher navigates to `/admin/attendance` even with the flag enabled
- **THEN** the overview does not render

#### Scenario: Flag disabled or loading
- **WHEN** an admin navigates to `/admin/attendance` while the flag is disabled or still loading
- **THEN** the overview does not render

### Requirement: All-groups attendance grouped by group

The overview SHALL list every group that has at least one child who is currently present (checked-in but not yet checked-out) today, each as a labeled section showing only those currently present children. Groups with no currently present children SHALL NOT appear. Children with no attendance record today (absent) or who are already checked-out SHALL NOT be listed on this screen.

#### Scenario: Groups with activity are listed
- **WHEN** three groups have at least one currently present child today and two groups have none
- **THEN** the overview shows exactly the three groups with present children as sections, each listing only its children who are still here

#### Scenario: Absent and already-departed children are not shown
- **WHEN** a group has 10 children, 6 have checked in, and 2 of those 6 have already checked out
- **THEN** that group's section lists exactly the 4 children who are still present

### Requirement: Single-child check-out with confirmation

Tapping a child who is currently present (has an open check-in with no matching check-out) SHALL open a confirmation showing the child's name and check-in time with a "Registrar salida" action. Confirming SHALL record that child's check-out via the existing check-out mechanism, called for that single child. Children who are not currently present SHALL NOT be displayed on this screen.

#### Scenario: Recording a check-out
- **WHEN** an admin taps a present child and confirms "Registrar salida"
- **THEN** that child's check-out is recorded and the child disappears from the overview (no longer present) without a full page reload

#### Scenario: Re-entry is supported
- **WHEN** a child checked out earlier today and then re-enters the building
- **THEN** a new check-in record can be created for the same child on the same day
- **AND** the child appears again on the overview as currently present

#### Scenario: Cancelling leaves the record unchanged
- **WHEN** an admin taps a checked-in child and dismisses the confirmation without confirming
- **THEN** no check-out is recorded

#### Scenario: Children not currently present are not visible
- **WHEN** a child has no open check-in record (never checked in or already checked out)
- **THEN** that child does not appear on the screen at all

#### Scenario: Re-entered children are visible again
- **WHEN** a child checked out earlier today and then checked in again
- **THEN** that child appears on the screen as currently present

### Requirement: Localized copy

All user-facing text on the admin attendance overview SHALL come from the `messages/es.json` catalog via `next-intl`; no copy SHALL be hardcoded in components.

#### Scenario: Spanish catalog
- **WHEN** the admin attendance overview renders
- **THEN** every label (screen title, group section, confirmation modal text and action) resolves from the `es.json` catalog
