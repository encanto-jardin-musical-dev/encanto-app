## Context

CI provisions the app with `webServer.command: 'pnpm dev'` (`playwright.config.ts`) — a development server, not a production build. Next.js therefore compiles each route **on first request**, and `reuseExistingServer` is false in CI, so every run starts cold.

`auth.spec.ts` is the most exposed spec for three compounding reasons:

1. **It is the literal first test of the run.** Projects are ordered parent → teacher → admin, and `auth.spec.ts` runs under all three, so the `parent` instance is first. It absorbs 100% of the cold-start cost with no warm cache.
2. **It asserts a client-side redirect.** `src/app/page.tsx` is `'use client'` and unconditionally renders the logged-out landing ("Bienvenidos" / "Iniciar Sesión"). `<AuthRedirect />` then, in a `useEffect`, calls `supabase.auth.getUser()` — a network round-trip to GoTrue — and only then calls `router.push('/feed')`. So `page.goto('/')` resolves as soon as the landing paints, and the redirect is still pending.
3. **`/feed` is the heaviest route in the app.** It uses parallel routes (`@group`, `@user`), the root providers including `UserHydrator`, and the message/task/report query hooks.

The 5-second default budget on `expect(page).toHaveURL(/\/feed$/)` must therefore cover hydration, a GoTrue round-trip, a client-side navigation, and the first-ever compile of `/feed`. On a loaded CI runner that exceeds 5s.

**The confirming evidence** is the shape of the failure across two CI runs on PR #131: it failed on attempt 1 and passed on retry, both times, reporting as "1 flaky". A genuinely racy assertion would pass and fail roughly evenly across retries. A one-time warm-up cost produces exactly this pattern — attempt 1 pays it, and the dev server's compile cache makes every subsequent attempt instant.

A downloaded CI artifact confirms the end state of the failed attempt is the logged-out landing page, not a misrouted page:

```yaml
- main:
  - heading "Bienvenidos" [level=2]
  - button "Iniciar Sesión"
```

`retries: 2` currently converts this from a hard failure into "1 flaky", which is why it has gone unnoticed.

## Goals / Non-Goals

**Goals:**

- The suite reports no flake from cold application start-up.
- The root cause (cold compilation inside a timed assertion) is fixed, not just given a bigger timeout.
- Genuine failures in the redirect path surface as failures instead of being absorbed by retries.
- Net wall-clock time does not regress.

**Non-Goals:**

- No server-side redirect for `/` (see D3).
- No change to `retries: 2`, and no attempt to eliminate all flakiness — genuine network variance is expected and retries are the right tool for it.
- No `teardownFixtures` rework; that FK-ordering defect is separate and pre-existing.
- No application source changes at all.

## Decisions

### D1 — Warm routes in `globalSetup`, after seeding and before tests

Add a warm-up pass to `e2e/fixtures/global-setup.ts` that issues one unauthenticated `GET` per route the suite enters, so on-demand compilation happens before any test asserts. Playwright's `globalSetup` is the correct home: it already seeds fixtures and establishes sessions, runs exactly once, and runs before the first test.

Compilation is triggered by the route match, not by authentication, so unauthenticated requests are sufficient and require no fixture credentials. The existing `playwrightRequest` import makes this a few lines. Warming the dynamic detail routes (`/messages/[senderID]`, `/attendance/[groupId]`, `/tasks/[groupId]`, `/reports/[groupId]`) is possible too — fixture ids are known post-seed — but that is speculative: only `/feed` has a demonstrated cold-start problem, so start with the top-level routes and add detail routes only if a flake shows up there.

*Alternative:* a dedicated `beforeAll` in each spec. Rejected — it duplicates the work per project (the spec runs under all three) and puts shared setup in the wrong place.

*Alternative:* build the app (`pnpm build && pnpm start`) in CI instead of `pnpm dev`. Rejected for this change: it changes CI cost and caching behaviour for the entire suite, a much bigger lever than the problem warrants. Worth revisiting separately if suite duration becomes a concern.

### D2 — Raise the timeout on the redirect assertions, don't just warm

Warm-up removes the compilation cost, but a `supabase.auth.getUser()` round-trip to GoTrue remains on every run, and that call is genuinely network-dependent. Setting an explicit timeout (~30s) on the two `toHaveURL` assertions in `auth.spec.ts` makes the spec's tolerance explicit and self-documenting instead of silently depending on a global default that was never sized for a cold start.

This is defence in depth, not the primary fix — D1 is. Both together, because either alone leaves a plausible flake path.

### D3 — Leave the client-side redirect alone

Making `/` redirect server-side would remove the client-side race entirely: `page.goto('/')` would resolve already at `/feed`, and no amount of server slowness could strand the test on the landing page.

It is deferred because it is an **application behaviour change**, not a test-infrastructure fix: an authenticated user would stop seeing the landing page at all, which is a product-visible difference. `AuthRedirect`'s docstring also records that it is a client component specifically so its parent can use `useTranslations`, so a server-side variant needs its own design pass. Bundling it here would make this change hard to review and impossible to revert independently.

### D4 — Keep retries, and make them informative

`retries: 2` stays: CI runners have real network variance and retries are the correct mitigation for that. The goal is that this failure mode stops reaching the retry counter at all, so a future "1 flaky" again means something worth looking at.

## Risks / Trade-offs

- **Warm-up adds a fixed cost to every run** → one cheap GET per route, a few seconds against a suite that takes minutes; the saved cold compile in the first test should more than offset it. If wall-clock regresses, the routes can be narrowed to `/feed` alone.
- **A route missed by the warm-up still flakes** → mitigated by D2's timeout; and the flake would name the specific route, which is a cheap signal for adding it to the list.
- **Global setup timeouts are easy to get wrong** → give each warm-up request a generous timeout and swallow per-request failures, since a warm-up that errors must not fail the run. Compilation errors will still surface on the test's own navigation.
- **Fixing this could unmask a real regression** → that is the intent, but worth stating plainly: if a genuine redirect bug is currently hiding behind retries, this change will make it visible. That is a good outcome, not a regression of this change.