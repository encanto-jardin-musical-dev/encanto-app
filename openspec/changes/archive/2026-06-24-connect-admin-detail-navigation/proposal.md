## Why

Admin detail screens (group, child, teacher, parent) already display the entities related to the one being viewed — a group shows its teachers and children, a child shows its groups and parents, and so on. Today those related entities are rendered as static, non-interactive chips, so an admin who wants to inspect a related entity has to navigate back to a list and search for it manually. Making the chips tappable turns the detail screens into a connected graph the admin can browse directly.

## What Changes

- Make the related-entity chips on the four admin detail screens tappable so that selecting one navigates to that entity's own detail screen:
  - Group detail → tap a teacher navigates to that teacher's detail; tap a child navigates to that child's detail.
  - Child detail → tap a group navigates to that group's detail; tap a parent navigates to that parent's detail.
  - Teacher detail → tap a group navigates to that group's detail.
  - Parent detail → tap a child navigates to that child's detail.
- Extend the shared avatar chip primitive so a chip can optionally act as a navigation link, preserving its current visual appearance and its non-interactive behavior when no destination is provided.
- Keep all existing back-navigation, edit actions, and empty-state behavior unchanged.

## Capabilities

### New Capabilities
- `admin-detail-cross-navigation`: Tapping a related-entity chip on any admin detail screen navigates to that entity's detail screen, across groups, children, teachers, and parents.

### Modified Capabilities
- `admin-shared-ui`: The reusable avatar chip/section gains an optional navigable (link) mode so a chip can route to a destination while remaining visually unchanged and non-interactive by default.

## Impact

- **Components**: `src/components/common/EntityAvatarChip.tsx` (add optional link target), and the related-entity sections that render chips — `src/components/admin/groups/GroupDetail.tsx`, `src/components/admin/children/ChildGroupsSection.tsx`, `src/components/admin/children/ChildParentsSection.tsx`, `src/components/admin/teachers/TeacherGroupsSection.tsx`, `src/components/admin/parents/ParentChildrenSection.tsx`.
- **Routes**: No new routes; navigation targets existing detail routes `/admin/{teachers|children|groups|parents}/{id}`.
- **Data**: No query or schema changes; all related items already expose the `id` needed to build their detail URLs.
- **Navigation**: Uses the existing Next.js `Link` mechanism already used by admin list rows.
