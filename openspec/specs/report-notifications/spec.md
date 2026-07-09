# report-notifications

## Purpose

Push notification fan-out to guardians on report creation, and in-app toast for foregrounded users on other screens.

## Requirements

### Requirement: Push notification on new report

When a report is created, the system SHALL notify the guardians who can see it via the existing FCM push pipeline: for a group-wide report, all guardians of children in the report's group; for a single-child report, only that child's guardians. The report author SHALL NOT be notified. The notification SHALL carry the report's title and identify itself as a report so that tapping it (from the background service worker) opens the report's detail screen at `/reports/[groupId]/[reportId]`. Report notifications SHALL be delivered through the existing `push` edge function via a database webhook on report insertion, without altering the behavior of message notifications.

#### Scenario: Guardians notified of a group-wide report
- **WHEN** a staff user creates a group-wide report
- **THEN** a push notification is sent to the registered devices of all guardians of children in that group
- **AND** the author receives no notification

#### Scenario: Only the targeted child's guardians notified
- **WHEN** a staff user creates a single-child report
- **THEN** push notifications go only to that child's guardians

#### Scenario: Tapping the notification opens the report
- **WHEN** a guardian taps the report push notification while the app is in the background or closed
- **THEN** the app opens at that report's detail screen

#### Scenario: Message notifications unaffected
- **WHEN** a message is inserted after the report webhook is deployed
- **THEN** message push notifications continue to be delivered as before

### Requirement: Foreground toast for new reports

When a guardian has the app in the foreground and a report notification arrives, the system SHALL show an in-app toast announcing the new report instead of a system notification, unless the user is already viewing that report's detail screen. The toast SHALL offer navigation to the report's detail screen.

#### Scenario: Toast on another screen
- **WHEN** a guardian is using the app on any screen other than the report's detail and a new report notification arrives
- **THEN** an in-app toast appears announcing the new report
- **AND** activating the toast navigates to the report's detail screen

#### Scenario: No toast on the report's own detail
- **WHEN** a guardian is already viewing the report's detail screen when its notification arrives
- **THEN** no toast is shown
