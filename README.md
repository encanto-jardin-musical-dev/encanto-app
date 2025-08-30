# Encanto App

A Progressive Web App (PWA) for Encanto Jardín Musical, built with Next.js 15, React 19, and Supabase.

## Features

- **Progressive Web App**: Installable with offline capabilities
- **Real-time Messaging**: Live communication between parents and teachers
- **Push Notifications**: Browser-based notifications for new messages
- **Multi-language Support**: Internationalization with next-intl
- **Role-based Access**: Support for parents, teachers, and administrators

## Push Notifications Setup

This app includes web push notification functionality. To enable it, you need to:

1. **Generate VAPID Keys**: Create VAPID (Voluntary Application Server Identification) keys for your domain
2. **Environment Variables**: Add the following to your `.env.local` file:

```bash
NEXT_PUBLIC_VAPID_PUBLIC_KEY=your_vapid_public_key_here
```

3. **Service Worker**: The app includes a service worker (`public/sw.js`) that handles push notifications

### Generating VAPID Keys

You can generate VAPID keys using the web-push library:

```bash
npm install web-push -g
web-push generate-vapid-keys
```

### Testing Push Notifications

To test push notifications, you can use the browser's developer tools or send a test notification from your backend.

## Development

```bash
npm install
npm run dev
```

## Environment Variables

Create a `.env.local` file with the following variables:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Push Notifications
NEXT_PUBLIC_VAPID_PUBLIC_KEY=your_vapid_public_key

# Analytics
NEXT_PUBLIC_POSTHOG_KEY=your_posthog_key
NEXT_PUBLIC_POSTHOG_HOST=your_posthog_host

# Sentry
NEXT_PUBLIC_SENTRY_DSN=your_sentry_dsn
```

## Tech Stack

- **Frontend**: Next.js 15, React 19, TypeScript
- **Styling**: Tailwind CSS, HeroUI
- **State Management**: Jotai, TanStack React Query
- **Backend**: Supabase (PostgreSQL, Auth, Real-time)
- **Internationalization**: next-intl
- **Monitoring**: Sentry, PostHog
- **Deployment**: Vercel

## Project Structure

```
src/
├── app/                 # Next.js App Router pages
├── components/          # React components
├── hooks/              # Custom React hooks
├── lib/                # Utilities and configurations
├── queries/            # React Query definitions
├── types/              # TypeScript type definitions
└── utils/              # Utility functions
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

This project is private and proprietary to Encanto Jardín Musical.
