## Why

The app has no `src/app/not-found.tsx`, so any unmatched or invalid URL (mistyped path, stale/expired link, bad deep link) falls through to Next.js's bare default 404 page — unstyled, no app theme, no navigation. A user who lands there has no way back into the app except editing the URL bar. There's also a stray placeholder at `src/app/error/page.tsx` (a real route at `/error` with hardcoded English "Page not found" text) that looks like an abandoned attempt at this and is not wired up as the actual 404 handler.

## What Changes

- Add `src/app/not-found.tsx` as the global catch-all 404 page, following the app's existing empty-state visual pattern (see `EmptyFeed.tsx`: centered layout, muted heroicon, `next-intl` copy) and using the same fonts/theme (`encanto` class, `Asap` font) already applied by the root layout — no new theming needed since `not-found.tsx` renders inside the existing root layout automatically.
- Add a primary HeroUI `Button` (or `next/link`-based CTA) on the page that navigates to `/feed`, the app's main authenticated landing route.
- Add the new translation keys under a `NotFound` namespace in `messages/es.json` (title/description/CTA label), per the project's Spanish-only i18n convention.
- Remove the stray, unstyled `src/app/error/page.tsx` placeholder route — it duplicates the intent of this change with hardcoded English text and no styling, and keeping a real `/error` route around after adding a proper `not-found.tsx` would be confusing dead code.
- Wire the message thread route (`src/app/messages/[senderID]/page.tsx`) to actually invoke Next's `notFound()` when the `senderID` param is a malformed UUID or a well-formed UUID with no matching `profiles` row, so it renders the new themed 404 page instead of a raw 500 (malformed input) or a degraded-but-200 thread view (nonexistent id). This is the first dynamic route wired to the "unmatched nested/dynamic route" requirement below — other dynamic routes are not covered by this change.
- Out of scope: no changes to `global-error.tsx` (the runtime error boundary) — this change only covers the "route not found" case, not thrown errors.

## Capabilities

### New Capabilities
- `not-found-page`: Defines that navigating to any unmatched route in the app SHALL render a themed 404 page with a way to navigate back to `/feed`, instead of Next.js's default unstyled 404.

### Modified Capabilities
(none — no existing spec currently covers 404/not-found behavior)

## Impact

- `src/app/not-found.tsx` — new file, the global 404 page.
- `src/components/common/BackToFeedButton.tsx` — new file, a `'use client'` wrapper around HeroUI's `Button as={Link}`, needed because `not-found.tsx` is a Server Component and HeroUI's Button/Link are client components (importing them directly caused a `createContext` RSC boundary error). Mirrors the existing `NavigationBar.tsx` client-wrapper pattern.
- `src/app/error/page.tsx` — removed (stray placeholder, not a real error boundary, superseded by this change).
- `src/app/messages/[senderID]/page.tsx` — modified to validate `senderID` (UUID format check + profile existence lookup via `getProfileById`) and call `notFound()` when invalid, using the server-side Supabase client (`@/utils/supabase/server`).
- `messages/es.json` — new `NotFound` translation namespace.
- No routing, middleware/proxy, or auth changes beyond the explicit `notFound()` call in the messages thread page — `not-found.tsx` itself is a passive Next.js convention file, picked up automatically for any unmatched route without further wiring.
