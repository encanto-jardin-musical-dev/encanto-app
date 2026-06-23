## ADDED Requirements

### Requirement: Screen-aware action button

The admin entity screens SHALL render a floating action button whose icon and behavior change according to the current screen context. On a list screen the button SHALL represent an "Add" action that navigates to the corresponding create screen. On a create or edit form screen the button SHALL represent a "Save" action that submits the form. On a detail screen the button SHALL represent an "Edit" action that navigates to the corresponding edit screen. The button's accessible label SHALL be sourced from the i18n message catalog for its current action.

#### Scenario: Add action on a list screen
- **WHEN** the admin is on the children list screen
- **THEN** the action button shows an add icon and, when activated, navigates to the create screen (`/admin/children/new`)

#### Scenario: Save action on a form screen
- **WHEN** the admin is on the create or edit form screen
- **THEN** the action button shows a save icon and, when activated, submits the form

#### Scenario: Edit action on a detail screen
- **WHEN** the admin is on a child detail screen
- **THEN** the action button shows an edit icon and, when activated, navigates to that child's edit screen

#### Scenario: Accessible label reflects the action
- **WHEN** the action button is rendered in any context
- **THEN** its accessible label is sourced from the i18n catalog and matches the current action (add, save, or edit)

### Requirement: Design system alignment for the action button

The contextual action button SHALL be built with the app's existing HeroUI components and Heroicons, using established conventions (an icon-only floating button with an `onPress` handler and an accessible label from the i18n catalog), consistent with the rest of the app.

#### Scenario: Button uses design-system primitives
- **WHEN** the contextual action button is rendered
- **THEN** it uses HeroUI components and Heroicons consistent with the existing floating action button styling and exposes an accessible label from the i18n catalog
