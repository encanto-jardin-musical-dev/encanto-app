## 1. Warm routes in global setup

- [ ] 1.1 In `e2e/fixtures/global-setup.ts`, add a warm-up pass that issues one unauthenticated `GET` per top-level route the suite navigates to (`/`, `/feed`, `/messages`, `/tasks`, `/reports`, `/attendance`)
- [ ] 1.2 Reuse the already-imported `playwrightRequest` module to issue the requests, and give each a generous timeout (e.g. 60s)
- [ ] 1.3 Swallow per-request errors so a warm-up failure never fails the run — compilation errors must still surface on the test's own navigation
- [ ] 1.4 Call the warm-up **after** `seedFixtures()` (so fixture ids exist) and **before** the per-role storage states are written, disposing the request context in a `finally`
- [ ] 1.5 Add a comment stating *why* the warm-up exists (CI runs `pnpm dev`, so the first request to a route compiles it) and that compilation is auth-independent

## 2. Size the redirect assertions honestly

- [ ] 2.1 In `e2e/specs/auth.spec.ts`, add an explicit timeout (e.g. 30_000ms) to the `toHaveURL(/\/feed$/)` assertion
- [ ] 2.2 Add a matching explicit timeout to the second URL assertion in the same spec
- [ ] 2.3 Note in a comment that a `supabase.auth.getUser()` round-trip to GoTrue remains even on a warm server, so the timeout is deliberate rather than a workaround

## 3. Verify

- [ ] 3.1 Confirm `npx tsc --noEmit` is clean and `npx eslint e2e/` reports nothing new
- [ ] 3.2 Push and confirm the CI e2e job reports **0 flaky** — a flaky count of zero is the acceptance signal, not merely "job passed"
- [ ] 3.3 Confirm the e2e job's wall-clock does not regress versus the ~7m23s baseline on PR #131
- [ ] 3.4 Confirm no application source file changed (`git diff --name-only main...HEAD` touches only `e2e/`)

## 4. Follow-up (out of scope here — do not do in this change)

- [ ] 4.1 Do **not** convert `/` to a server-side redirect; recorded as an explicit non-goal in `proposal.md` (D3) because it changes user-visible behaviour and deserves its own design pass
- [ ] 4.2 Consider widening the warm-up list to dynamic detail routes (`/messages/[senderID]`, `/attendance/[groupId]`, `/tasks/[groupId]`, `/reports/[groupId]`) only if a flake is observed there — speculative for now
- [ ] 4.3 Optionally evaluate `pnpm build && pnpm start` in CI instead of `pnpm dev` as a separate change; it would remove cold compilation entirely but changes CI cost and caching for the whole suite

> Verification note: e2e runs in CI, not locally. A local run leaves `attendance`/`tasks`/`messages` residue that the pre-existing `teardownFixtures` FK-ordering bug cannot delete, which poisons the next seed with a `children_document_type_document_number_key` duplicate. Do not run the Playwright suite against the local stack; push and read the CI e2e job instead.