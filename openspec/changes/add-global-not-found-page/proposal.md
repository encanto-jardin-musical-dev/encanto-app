## Why

The app has no `src/app/not-found.tsx`, so any unmatched or invalid URL (mistyped path, stale/expired link, bad deep link) falls through to Next.js's bare default 404 page — unstyled, no app theme, no navigation. A user who lands there has no way back into the app except editing the URL bar. There's also a stray placeholder at `src/app/error/page.tsx` (a real route at `/error` with hardcoded English "Page not found" text) that looks like an abandoned attempt at this and is not wired up as the actual 404 handler.

## What Changes

- Add `src/app/not-found.tsx` as the global catch-all 404 page, following the app's existing empty-state visual pattern (see `EmptyFeed.tsx`: centered layout, muted heroicon, `next-intl` copy) and using the same fonts/theme (`encanto` class, `Asap` font) already applied by the root layout — no new theming needed since `not-found.tsx` renders inside the existing root layout automatically.
- Add a primary HeroUI `Button` (or `next/link`-based CTA) on the page that navigates to `/feed`, the app's main authenticated landing route.
- Add the new translation keys under a `NotFound` namespace in `messages/es.json` (title/description/CTA label), per the project's Spanish-only i18n convention.
- Remove the stray, unstyled `src/app/error/page.tsx` placeholder route — it duplicates the intent of this change with hardcoded English text and no styling, and keeping a real `/error` route around after adding a proper `not-found.tsx` would be confusing dead code.
- Out of scope: no changes to `global-error.tsx` (the runtime error boundary) — this change only covers the "route not found" case, not thrown errors.

## Capabilities

### New Capabilities
- `not-found-page`: Defines that navigating to any unmatched route in the app SHALL render a themed 404 page with a way to navigate back to `/feed`, instead of Next.js's default unstyled 404.

### Modified Capabilities
(none — no existing spec currently covers 404/not-found behavior)

## Impact

- `src/app/not-found.tsx` — new file, the global 404 page.
- `src/app/error/page.tsx` — removed (stray placeholder, not a real error boundary, superseded by this change).
- `messages/es.json` — new `NotFound` translation namespace.
- No routing, middleware/proxy, or auth changes — `not-found.tsx` is a passive Next.js convention file, picked up automatically for any unmatched route without further wiring.
