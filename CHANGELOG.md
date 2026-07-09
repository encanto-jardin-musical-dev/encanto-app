# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).
Main sections are `Added`, `Changed`, `Deprecated`, `Removed`, `Fixed`, and `Security`.

## [Unreleased]

## [1.2.0] - 2026-07-09

### Added

- Daily reports: staff can create group-wide or single-child reports (title, description, up to 4 attachments) at `/reports`, with single-child targeting restricted to attendance-verified children; the staff list is grouped by group for admins. Parents see report cards in the feed with an image background and clamped description, a dedicated "Reportes" filter, and a read-only report detail screen. Guardians are notified of new reports via push notification or an in-app toast.

### Changed

- The "+" button's Daily Report action now navigates to the real reports screen instead of a placeholder.

## [1.1.0] - 2026-07-07

### Added

- Admin dashboard for managing children, groups, teachers, and parents, with multi-teacher group assignments and navigable related-entity chips.
- Teacher/admin attendance: clock-in/clock-out logging, admin review, live counter, and multi-cycle support.
- Group tasks: staff task list, create/edit form, and detail screens scoped to assigned groups; parent feed task cards with a dedicated filter chip; hardened row-level security for the `tasks` table.
- Message attachments: image/PDF uploads with inline previews and S3-backed storage, paginated thread history via keyset pagination, per-child teacher contact filter, and admin role filter chips.
- Role-aware "+" action button with per-action PostHog feature flags and localized labels; themed global 404 page.
- Multi-device push notification support (FCM) and home active-session verification.

### Changed

- Migrated package manager from npm to pnpm; upgraded to Next.js 16 and React 19.2.
- Unified the contacts list UI with the admin card style.
- Lowered the shared message/task attachment cap to 4 files.

### Fixed

- Scoped the parent's child selector to their own guardianship.
- Fixed duplicate push notifications by sending data-only FCM payloads.
- Fixed the child form's guardian picker pre-filled id, the avatar edit modal button alignment, and a Turbopack production build failure.
- Fixed task attachment access for parents and guardians, and the feed action button's stacking order over feed cards.

## [1.0.0] - 2025-10-03

### Added

- Add messages module for handling user notifications and alerts.
- Add magic link authentication for passwordless login.
- Add posthog feature flagging for A/B testing and feature rollouts.
