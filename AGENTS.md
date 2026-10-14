# AGENTS.md - Development Guidelines

## Build & Development Commands
- `pnpm dev` - Start development server (http://localhost:3000)
- `pnpm dev:https` - Start with HTTPS + Node inspector
- `pnpm build` - Build for production (runs `scripts/generate-firebase-sw.js` first)
- `pnpm lint` - Run ESLint
- `pnpm start` - Start production server
- **Note**: No test framework configured - check with user before adding tests

## Code Style Guidelines

### Imports & Organization
- Use `"use client"` directive for client components
- Group imports: React/Next.js, external libraries, internal modules
- Use `@/` prefix for all internal imports
- Follow conventional commit format with English language only

### TypeScript & Naming
- Strict TypeScript - avoid `any` types
- PascalCase for components and interfaces
- camelCase for variables and functions
- Use generated database types from `src/types/database.types.ts`
- Additional type files: `auth.types.ts`, `common.types.ts`, `hooks.types.ts`, `messages.types.ts`, `notifications.types.ts`
- Hooks use `Use` prefix (e.g., `UseGetUserGroupsQuery.ts`)
- `QueryParams` type in `hooks.types.ts` – use for all hook parameter shapes
- `UserRoles` type in `common.types.ts` – use `"admin" | "teacher" | "parent"`

### Component Patterns
- Export function components with explicit function declarations
- Use HeroUI components for consistent design
- Organize by feature in `src/components/{domain}/`
- Shared/reusable UI components live in `src/components/common/`
- Keep components small and focused

### State Management
- Jotai for global client state (in `src/lib/store/`)
- React Query for server state and data fetching
- Custom hooks in `src/hooks/` wrap React Query
- Query definitions in `src/queries/` organized by domain (`children/`, `feed/`, `groups/`, `messages/`, `parents/`, `shared/`, `teachers/`, `users/`)

### Feature Flags (PostHog)
- Use `useFeatureFlagEnabled` from `posthog-js/react` for client-side flags
- All flag hooks must run **unconditionally** and in a stable order (React rules)
- Treat both `false` and `undefined` (loading) as off via `=== true` check
- Current flags: `action_button_options`, `admin_options_attendance`, `admin_options_attendance_report`, `admin_options_reports`, `admin_options_tasks`
- Server-side tracking via `src/lib/posthog/server.ts` (`getPostHogServer`, `trackServerEvent`)

### Error Handling & Security
- Always handle Supabase query errors explicitly
- Use Row Level Security (RLS) policies - never disable RLS
- Validate environment variables on app startup
- Use TypedSupabaseClient for all database operations

## Architecture Notes
- Next.js 16 with App Router and React 19.2
- Package manager: **pnpm@11.5.2**
- Supabase for backend (auth, database, real-time) — client/server/middleware utils in `src/utils/supabase/`
- Auth session refresh via `src/proxy.ts` (called from middleware)
- Progressive Web App with push notifications (Firebase + Serwist)
- Internationalization via `next-intl` — locale files in `src/i18n/`
- Type-safe throughout with generated database types
- Monitoring: **Sentry** (`@sentry/nextjs`) + **PostHog** analytics/feature flags
- Animations: **Framer Motion**

## Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── (auth)/             # Auth route group
│   │   └── login/          # Login page
│   ├── auth/               # Supabase auth callbacks (callback/, confirm/)
│   ├── admin/              # Admin module (children/, groups/, teachers/, parents/)
│   ├── attendance/         # Attendance page
│   ├── attendance-report/  # Per-child attendance report + CSV export (staff, flagged)
│   ├── daily-report/       # Daily report page
│   ├── error/              # Error boundary page
│   ├── feed/               # Feed with parallel routes (@group, @user)
│   ├── messages/           # Messaging ([senderID])
│   ├── tasks/              # Tasks page
│   ├── layout.tsx          # Root layout
│   ├── providers.tsx       # App-level providers wrapper
│   ├── global-error.tsx    # Global error boundary
│   ├── manifest.ts         # PWA manifest
│   ├── sw.ts               # Service worker entry
│   └── page.tsx            # Root page
├── components/
│   ├── admin/              # Admin UI (children/, groups/, parents/, teachers/)
│   │   ├── AdminActionButton.tsx
│   │   ├── AdminShortcuts.tsx / AdminShortcutTile.tsx / AdminSummaryPanel.tsx
│   │   └── AssistanceMetric.tsx
│   ├── auth/               # Auth UI (AuthRedirect.tsx, LoginForm.tsx)
│   ├── common/             # Shared UI components
│   │   ├── ActionButton.tsx          # FAB with PostHog-gated sub-actions
│   │   ├── EntityAvatarChip.tsx      # Navigable chip (optional href → Link)
│   │   ├── EntityChipSection.tsx / EntityListItemLink.tsx / EntityMultiSelect.tsx
│   │   ├── ConfirmDeleteModal.tsx / AdminSearchBar.tsx / SearchBar.tsx
│   │   ├── ImagePicker.tsx / UserListItem.tsx / NavigationBar.tsx
│   │   └── NotificationSettingsPopover.tsx
│   ├── feed/               # Feed UI components
│   ├── messages/           # Messages UI components
│   └── providers/          # PushNotificationProvider.tsx, UserHydrator.tsx
├── hooks/                  # React Query hooks (UseXxxQuery / UseXxxMutation)
├── queries/                # Query definitions by domain
├── lib/
│   ├── const.ts            # App-wide constants (USER_ROLES, etc.)
│   ├── firebase/           # Firebase config (firebaseConfig.ts)
│   ├── posthog/            # PostHog client (client.ts), server (server.ts), SSR (ssr.ts)
│   ├── providers/          # JotaiProvider.tsx
│   ├── store/              # Jotai atoms (common.ts, feed.ts, messages.ts, user.ts)
│   └── mock/               # Mock data (adminAssistance.ts)
├── types/                  # TypeScript types
│   ├── database.types.ts   # Generated Supabase types (do not edit manually)
│   ├── common.types.ts     # UserRoles and shared types
│   ├── hooks.types.ts      # QueryParams type
│   ├── auth.types.ts / messages.types.ts / notifications.types.ts
├── utils/
│   ├── supabase/           # client.ts, server.ts, middleware.ts
│   ├── jotai/              # Jotai utilities
│   ├── pushNotifications/  # Push notification helpers
│   ├── uploadAdminAvatar.ts / uploadChildAvatar.ts / uploadGroupImage.ts
│   ├── uploadParentAvatar.ts / uploadTeacherAvatar.ts / uploadAttachment/
│   ├── imageStorage.ts
│   └── auth/               # actions.ts, validate.ts
├── i18n/                   # next-intl config (request.ts)
├── styles/                 # Global CSS (globals.css)
├── instrumentation.ts      # Next.js instrumentation (Sentry init)
└── proxy.ts                # Middleware proxy for Supabase session refresh
```

## Admin Module

The admin section lives under `src/app/admin/` with four managed entities:
- **Children** (`/admin/children`) — list, detail, create, edit
- **Groups** (`/admin/groups`) — list, detail, create, edit; supports multiple teachers per group
- **Teachers** (`/admin/teachers`) — list, detail, create, edit; with resend invite
- **Parents** (`/admin/parents`) — list, detail, create, edit; with resend invite

Admin shared UI components are in `src/components/admin/` and `src/components/common/`. Entity detail screens use `EntityAvatarChip` (with `href`) for navigable cross-entity chips.

## OpenSpec Workflow

This project uses an **OpenSpec** artifact workflow managed via `.pi/skills/`. Changes follow: proposal → design → tasks → implementation. Specs live in `openspec/specs/` and active changes in `openspec/changes/`.
