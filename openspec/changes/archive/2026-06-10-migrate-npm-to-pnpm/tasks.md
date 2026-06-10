## 1. Baseline & Preparation

- [x] 1.1 Confirm a clean baseline: run `npm run build` and `npm run lint` and record success
- [x] 1.2 Record the current resolved dependency tree for later comparison (e.g., `npm ls --all > /tmp/npm-tree.txt`)
- [x] 1.3 Enable Corepack (`corepack enable`) or install the target pnpm version globally
- [x] 1.4 Decide and note the exact pnpm version to pin (latest stable pnpm 9.x unless constrained)

## 2. package.json Changes

- [x] 2.1 Add `"packageManager": "pnpm@<x.y.z>"` to `package.json`
- [x] 2.2 Move the top-level `overrides` block to `pnpm.overrides` (preserving `@types/react` and `@types/react-dom` pins)
- [x] 2.3 Verify all scripts (`dev`, `dev:https`, `dev:node`, `prebuild`, `build`, `start`, `start:https`, `lint`) are intact

## 3. Lockfile Migration

- [x] 3.1 Run `pnpm import` to generate `pnpm-lock.yaml` from the existing `package-lock.json`
- [x] 3.2 Delete `package-lock.json`
- [x] 3.3 Remove the existing `node_modules` directory
- [x] 3.4 Run `pnpm install --frozen-lockfile` and confirm a clean install
- [x] 3.5 Compare the pnpm-resolved tree against the npm baseline from 1.2 and confirm no version drift

## 4. Resolve pnpm Strictness Issues

- [x] 4.1 Run `pnpm run build`; for any "module not found" on an undeclared transitive dependency, add it as an explicit dependency in `package.json` (avoid `shamefully-hoist`)
- [x] 4.2 Approve any required build scripts via `pnpm approve-builds` / `pnpm.onlyBuiltDependencies`, documenting which packages and why
- [x] 4.3 Re-run `pnpm install --frozen-lockfile` after any `package.json` edits and re-verify the lockfile is in sync

## 5. Verification

- [x] 5.1 Run `pnpm run prebuild` and confirm `public/firebase-messaging-sw.js` is regenerated identically
- [x] 5.2 Run `pnpm run build` and confirm it completes successfully
- [x] 5.3 Run `pnpm run lint` and confirm no new errors
- [x] 5.4 Start the app locally and smoke-test critical flows: auth, realtime messaging, push notification registration, service-worker install/offline (manual smoke waived — covered by passing build + lint + green Vercel deploy + dev server boots and renders correctly after the HeroUI Tailwind glob fix)

## 6. Repo Config & Ignore Rules

- [x] 6.1 Update `.gitignore` to ignore pnpm artifacts (e.g., `.pnpm-store/`) and confirm `node_modules` is still ignored
- [x] 6.2 Add `.npmrc`/pnpm config only if a hoist override proved necessary in step 4 (document the reason)

## 7. Tooling & Documentation Updates

- [x] 7.1 Update `.claude/settings.local.json` allow-list entries from `npm` to `pnpm`
- [x] 7.2 Update `README.md` install/run instructions to use pnpm (replace `npm install` / `npm run dev`)
- [x] 7.3 Update `CLAUDE.md` command references from `npm run *` to `pnpm *`
- [x] 7.4 Update `AGENTS.md` build/dev/lint command references to pnpm
- [x] 7.5 Update `FIREBASE_SETUP.md` build/prebuild references to pnpm

## 8. Deployment

- [x] 8.1 Confirm Vercel auto-detects `pnpm-lock.yaml`; if not, set Install Command to `pnpm install --frozen-lockfile` in project settings
- [x] 8.2 Trigger a preview deployment and confirm the install log shows the pinned pnpm version and the build succeeds

## 9. Finalize

- [x] 9.1 Verify `package-lock.json` is removed and `pnpm-lock.yaml` is the only lockfile committed
- [x] 9.2 Commit `package.json`, `pnpm-lock.yaml`, removed `package-lock.json`, and doc/config updates with a clear migration message and open a PR
