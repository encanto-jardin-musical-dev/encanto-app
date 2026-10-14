# Encanto App

A Progressive Web App (PWA) for Encanto Jardín Musical, built with Next.js 16, React 19, and Supabase.

## Features

- **Progressive Web App**: Installable with offline capabilities
- **Feed**: parent/group updates via Next.js parallel routes
- **Real-time Messaging**: Live communication between parents and teachers, with attachments
- **Daily Reports**: group or single-child updates with photos, PDF download
- **Attendance**: staff clock-in/clock-out logging, live counters
- **Attendance Report**: staff-only per-child report (group, child, date range up to 90 days) with CSV export, behind the `admin_options_attendance_report` flag
- **Tasks**: group task management for staff and parents
- **Push Notifications**: multi-device web push via Firebase Cloud Messaging
- **Admin Panel**: manage children, groups, teachers, parents, and data cleanup
- **Role-based Access**: parents, teachers, and administrators, enforced via Supabase RLS
- **Internationalization**: Spanish only, via next-intl (`messages/es.json`)

## Development

```bash
pnpm install
pnpm dev                    # http://localhost:3000
pnpm dev:https               # HTTPS + Node inspector, for PWA testing
```

## Environment Variables

Copy `.env.example` to `.env.local` and fill in the values. Key groups:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your_supabase_publishable_key

# Push Notifications (Firebase Cloud Messaging)
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=

# Analytics
NEXT_PUBLIC_POSTHOG_KEY=your_posthog_key
NEXT_PUBLIC_POSTHOG_HOST=your_posthog_host

# Sentry
NEXT_PUBLIC_SENTRY_DSN=your_sentry_dsn
```

See `.env.example` for the full list (including server-side Firebase credentials) and `firebase-env.example` for Firebase-specific setup notes.

### Push Notifications Setup

1. **Firebase project**: create a Firebase project and enable Cloud Messaging.
2. **Environment variables**: fill in the `NEXT_PUBLIC_FIREBASE_*` values above in `.env.local`.
3. **Service workers**: `public/sw.js` (built by Serwist from `src/app/sw.ts`) handles PWA caching; `public/firebase-messaging-sw.js` is generated at `pnpm prebuild` time by `scripts/generate-firebase-sw.js` and handles FCM background push. See `FIREBASE_SETUP.md` for details.

## Testing

Vitest (unit) and Playwright (e2e) are both set up — see `TESTING.md` for full conventions.

```bash
pnpm test                   # unit tests (Vitest), once
pnpm test:watch             # unit tests, watch mode
pnpm test:coverage          # unit tests with coverage (80% gate on src/queries/** and src/hooks/**)
pnpm test:e2e               # Playwright e2e suite (requires `supabase start`)
```

CI runs both suites on every PR to `main` (currently report-only, non-blocking, while the suite stabilizes) and can also be triggered manually from the Actions tab (`workflow_dispatch`).

## Tech Stack

- **Frontend**: Next.js 16 (App Router), React 19, TypeScript
- **Styling**: Tailwind CSS, HeroUI
- **State Management**: Jotai (client), TanStack React Query (server)
- **Backend**: Supabase (PostgreSQL, Auth, Realtime, Storage, Edge Functions)
- **PWA**: Serwist (main service worker) + Firebase Cloud Messaging (push)
- **Internationalization**: next-intl (Spanish only)
- **Monitoring**: Sentry, PostHog
- **Testing**: Vitest, Playwright
- **Deployment**: Vercel

## Project Structure

```
src/
├── app/                 # Next.js App Router pages
├── components/          # React components
├── hooks/               # Custom React hooks (wrap React Query)
├── lib/                 # Utilities and configurations
├── queries/             # Query/mutation functions (see CLAUDE.md's data-fetching pattern)
├── types/                # TypeScript type definitions
└── utils/               # Utility functions
e2e/
├── specs/                # Playwright specs
└── fixtures/             # Seed script, global setup, storage states
supabase/
├── migrations/           # SQL migrations
└── functions/            # Edge functions
```

## Contributing

1. Create a feature branch
2. Make your changes (see `CLAUDE.md` for architecture/data-fetching conventions)
3. Run `pnpm lint` and `pnpm test`
4. Submit a pull request — CI runs unit + e2e tests automatically

## License

This project is private and proprietary to Encanto Jardín Musical.
