# Design — Add Reports Feature

## Context

Reports are the third feed content type after messages and tasks. Most building blocks already exist:

- **`daily_reports` table** exists but is unused by app code: `id`, `child_id` (nullable FK → children), `teacher_id` (FK → profiles), `content Json NOT NULL`, `attachments Json`, `report_date`, `created_at`. It has no `group_id`, no title/description columns, and no meaningful RLS.
- **Tasks feature** (`group-tasks-management` + `feed-tasks`) is the closest precedent: staff list/create screens under `/tasks`, `src/queries/tasks/*` + hooks, `TaskFeedCard`, `mergeFeedItems`, RLS via `is_staff`/`is_admin`/`group_teachers` (see `supabase/migrations/20260707211424_tasks_rls.sql`).
- **Attachments**: `src/utils/uploadAttachment/` with `validateAttachments` (max 4 files, 10 MB, JPEG/PNG/WEBP/PDF), signed-URL edge functions, and `UseAttachmentUrlsQuery` for rendering.
- **Push pipeline**: `push` edge function triggered by a DB webhook on `messages` INSERT; resolves guardians via `child_guardians` ⨝ `child_groups`, fans out to `device_push_tokens` via FCM v1. Foreground toasts in `PushNotificationProvider`.
- **Plus button**: "Daily Report" action already exists behind `admin_options_reports`, routing to the `/daily-report` placeholder.
- **Feed filters**: "Reportes" chip exists but is permanently disabled.
- **Attendance**: `attendance` table with `child_id`, `attendance_date`, `status` (`present`/`absent`/`late`).

## Goals / Non-Goals

**Goals:**

- Staff report CRUD (create, list, search) at `/reports`, `/reports/new`, gated by `admin_options_reports` + staff role.
- Group-wide or single-child reports; single-child reports only for children with attendance recorded (`present` or `late`) on the report date.
- Parent feed cards with first-image background, 2-line clamped description, "ver más" CTA; report detail at `/reports/[groupId]/[reportId]` with images on top, description below.
- Push notification to guardians on report INSERT; foreground toast when the app is open on another screen.

**Non-Goals:**

- Likes and comments on reports (explicitly deferred to a future feature).
- Report editing/deletion UI (list + create only for v1, matching the wireframe; DB policies still allow staff update/delete for future use).
- Multi-language support beyond `es.json`.
- Backfill/migration of existing `daily_reports` rows (table is empty/unused).

## Decisions

### D1 — Reshape `daily_reports` instead of creating a new table

The table is referenced nowhere in app code, so we repurpose it rather than leave a dead table plus a new one. Migration:

- Add `group_id uuid REFERENCES groups(id) ON DELETE CASCADE` — required for both report kinds (a single-child report still belongs to a group; the child's group at creation time).
- Add `title text NOT NULL`, `description text`.
- Drop `content Json` (unused; title/description replace it).
- Keep `child_id` nullable: `NULL` = group-wide report, set = single-child report.
- Keep `teacher_id` as the author column (same convention as `tasks.teacher_id`), `report_date` (defaults to `CURRENT_DATE`), `created_at`.
- `attachments Json` keeps the same shape as `tasks.attachments`/message attachments (array of `{ path, mimeType, name }`-style objects) so `UseAttachmentUrlsQuery` and the signed-URL edge functions work unchanged.

*Alternative considered*: new `reports` table + leaving `daily_reports` dead — rejected; two overlapping tables for the same concept invites confusion.

### D2 — RLS mirrors `tasks_rls` with a child-targeting refinement

- **SELECT**: staff (`is_staff(auth.uid())`), or a guardian linked via `child_guardians` ⨝ `child_groups` to the report's `group_id` — **and**, when `child_id` is set, only guardians of *that* child (parents must not see another child's individual report).
- **INSERT**: `teacher_id = auth.uid()` AND (admin, or teacher assigned to `group_id` via `group_teachers`).
- **UPDATE/DELETE**: admin, or assigned teacher of the group (parity with tasks, even though v1 UI doesn't expose them).

Attendance enforcement (single-child report requires attendance that day) is a **client-side form constraint**, not RLS — the child selector only offers children with a `present`/`late` attendance row for the report date. Encoding it in RLS would make the policy fragile (attendance corrections after the fact would strand reports).

### D3 — Routes and screens mirror the tasks feature

| Route | Screen | Access |
|---|---|---|
| `/reports` | Staff list: search input, report title + created date rows, FAB → `/reports/new`; for admins, rows are grouped under a header per group (alphabetical), teachers see a flat list | staff + flag |
| `/reports/new` | Create form: group select (role-scoped), child select ("Todos el grupo" default + attendance-present children of the selected group for today), title, description with character counter, "Add files" | staff + flag |
| `/reports/[groupId]/[reportId]` | Detail: Facebook-post layout — author + relative time header, image gallery on top, title + full description below. Read-only for everyone in v1 | staff + guardians of the group/child, flag |

The wireframe's create form shows only a child selector; since teachers can manage multiple groups, we add a group selector first (same as `TaskForm`) and scope the child options to it. The child selector's default option is "send to all" (group-wide report, `child_id = NULL`).

Non-staff or flag-off navigation to `/reports*` staff screens renders the not-found page (same pattern as `/tasks`). Report detail is additionally reachable by parents.

Since admins manage every group, a flat newest-first list mixes unrelated groups together and is hard to scan; the list is grouped by group name (client-side, from the existing `groups(name)` join already returned by `get-staff-reports`) with an alphabetically-sorted group header per section, reports newest-first within each. Teachers only ever see their own assigned group(s), so grouping headers add no value there and the flat list is kept.

### D4 — Data layer follows the query → hook → component pattern

New `src/queries/reports/`: `create-report.ts`, `get-group-reports.ts` (feed, scoped to group + optionally child-visible), `get-staff-reports.ts`, `get-report-by-id.ts`, plus `get-attended-children.ts` (children of a group with `present`/`late` attendance for a date — powers the child selector). Hooks: `UseCreateReportMutation`, `UseGroupReportsQuery`, `UseStaffReportsQuery`, `UseReportByIdQuery`, `UseAttendedChildrenQuery`. Query keys scoped (`['reports', groupId]`, etc.); mutations invalidate `['reports']`.

### D5 — Feed integration extends `mergeFeedItems` with a `report` item type

- `FeedItem` union gains `{ type: 'report'; createdAt; data: Report }`; `FeedFilter` gains `'reports'`; filter chip "Reportes" activates behind `admin_options_reports`.
- New `ReportFeedCard`: background = signed URL of the **first image-typed attachment** (attachments may include PDFs; the card uses the first image, falling back to a neutral gradient when none), overlaid author avatar + name, relative time, description clamped with `line-clamp-2`, "ver más" CTA below the clamp navigating to the detail route. Like/comment icons from the wireframe are **not rendered** (deferred feature).
- Parent scoping: reports for the selected child's group where `child_id IS NULL` **or** `child_id =` selected child (RLS already guarantees the guardian relationship; the query filters for the selected-child context like tasks do).

### D6 — Notifications reuse the existing push edge function via a second webhook

- New DB webhook `new_report` on `daily_reports` INSERT → existing `push` edge function (same shared secret header). The function branches on payload table: for reports it resolves recipients as guardians of the group (or of the single child when `child_id` is set) — the author is excluded — and sends FCM data messages with `type: 'report'`, `groupId`, `reportId`, title/body.
- `firebase-messaging-sw.js` background handler already displays data messages generically; notification click deep-links to `/reports/[groupId]/[reportId]`.
- `PushNotificationProvider` foreground handler: on `type === 'report'`, show a HeroUI toast (with a navigate action) unless the user is already viewing that report's detail route.

*Alternative considered*: separate `push-report` edge function — rejected; token loading, FCM auth, and cleanup logic would be duplicated.

### D7 — Attachment limits reuse `validateAttachments` unchanged

Max 4 files / 10 MB / JPEG, PNG, WEBP, PDF — identical to messages and tasks. Upload flow reuses `upload-attachment-url` + `sign-attachment-urls` edge functions and the existing storage bucket/prefix convention used by tasks (report-specific prefix, e.g. `reports/{reportId}/`).

## Risks / Trade-offs

- [Reports created for a group where the child's attendance is corrected later] → attendance gating is a creation-time UX constraint only; existing reports remain valid by design.
- [First attachment is a PDF, so no background image] → card falls back to a gradient background; form UI hints that the first image becomes the cover.
- [Webhook fan-out ordering: `push` function must not break message pushes] → branch strictly on webhook payload `table`; keep message path untouched; verify with the existing Bruno collection / manual test.
- [`daily_reports.content` drop is destructive] → table is unused in app code and has no production data consumers; migration is still written idempotently.
- [Feed volume grows with a third item type] → same in-memory merge as tasks; acceptable at current scale, pagination unification deferred.

## Migration Plan

1. Ship migration (reshape `daily_reports` + RLS) → `supabase db push` / apply to remote.
2. Regenerate `src/types/database.types.ts`.
3. Deploy updated `push` edge function; create the `new_report` webhook with the shared secret.
4. Ship app code; feature stays dark until `admin_options_reports` is enabled in PostHog (flag already gates the plus-button action and will gate the routes, feed chip, and cards).
5. Rollback: disable the flag (UI dark), delete the webhook (notifications stop); schema rollback not required.

## Open Questions

- None blocking. Report editing/deletion UI intentionally deferred; DB policies already permit it for a follow-up change.
