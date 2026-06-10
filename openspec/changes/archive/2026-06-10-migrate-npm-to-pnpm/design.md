## Context

The project is a Next.js 16 / React 19 PWA managed with npm. State today:

- `package.json` with `"type": "module"`, an `overrides` block pinning `@types/react`/`@types/react-dom`, and a `prebuild` lifecycle script (`node scripts/generate-firebase-sw.js`) that must run before `next build`.
- A committed `package-lock.json` (~545 KB) and flat `node_modules`.
- Node version managed via `.nvmrc` (`lts/*`) and `.tool-versions` (`nodejs 24.14.1`).
- Deployment on Vercel (`vercel.json` present, only contains rewrites—no install config).
- The only GitHub workflow (`supabase-keepalive.yml`) does not use npm.
- npm command references appear in docs (`README.md`, `CLAUDE.md`, `AGENTS.md`, `FIREBASE_SETUP.md`) and a `.claude/settings.local.json` permission allow-list.

Constraints: no automated test suite exists (per repo conventions), so verification is build + lint + manual smoke of critical flows. The migration must not change application behavior or dependency versions.

## Goals / Non-Goals

**Goals:**
- Make pnpm the single supported package manager with a deterministic `pnpm-lock.yaml`.
- Preserve the exact resolved dependency versions during migration (no incidental upgrades).
- Pin the pnpm version via `packageManager` so local and Vercel installs match.
- Keep all lifecycle scripts (`prebuild`, `build`, `dev*`, `lint`, `start*`) working under pnpm.
- Update docs/tooling so contributors and agents use pnpm.

**Non-Goals:**
- Upgrading any dependency versions (separate from this migration).
- Changing application source code or runtime behavior.
- Introducing a monorepo / pnpm workspaces structure.
- Adding a CI test pipeline.

## Decisions

**1. Use pnpm via Corepack with a pinned version in `packageManager`.**
Add `"packageManager": "pnpm@<x.y.z>"` to `package.json`. Vercel and Corepack respect this field, guaranteeing identical pnpm versions everywhere.
- *Alternative considered*: global pnpm install without pinning → rejected; risks version drift between dev and Vercel.

**2. Generate `pnpm-lock.yaml` via `pnpm import` then `pnpm install`, and delete `package-lock.json`.**
`pnpm import` translates the existing `package-lock.json` into `pnpm-lock.yaml`, preserving resolved versions, before deleting the npm lockfile.
- *Alternative considered*: fresh `pnpm install` from `package.json` ranges only → rejected; could resolve to newer patch/minor versions, diverging from the audited tree.

**3. Migrate `overrides` → `pnpm.overrides` in `package.json`.**
pnpm reads `pnpm.overrides`, not the npm-standard top-level `overrides`. The React type pins (`@types/react`, `@types/react-dom`) must be moved to keep resolution identical.
- *Alternative considered*: leave top-level `overrides` → rejected; pnpm ignores it, breaking the intended pins.

**4. Rely on Vercel lockfile auto-detection, with explicit settings as a fallback.**
Vercel detects `pnpm-lock.yaml` and uses pnpm automatically. If detection is insufficient, set the Install Command to `pnpm install --frozen-lockfile` in project settings. Avoid hard-coding install commands in `vercel.json` unless required.

**5. Use `--frozen-lockfile` in CI/deploy contexts.**
Ensures reproducible installs and fails fast if the lockfile is out of sync.

**6. Add an `.npmrc`/pnpm config only if needed for hoisting.**
pnpm's strict (non-hoisted) `node_modules` can surface phantom-dependency errors. If the build reveals undeclared transitive imports, add the missing dependency explicitly to `package.json` (preferred) rather than enabling `shamefully-hoist`. Use a config-level hoist override only as a last resort, documented in the change.

## Risks / Trade-offs

- **Phantom dependencies surface under pnpm's strict node_modules** → Run `pnpm install` then `pnpm run build` and `pnpm run lint`; for any "module not found" on an undeclared transitive package, add it as an explicit dependency. Avoid `shamefully-hoist` unless unavoidable.
- **Lifecycle/postinstall scripts (e.g., dependency build steps) blocked by pnpm** → pnpm may require approving build scripts (`pnpm approve-builds` / `pnpm.onlyBuiltDependencies`). Identify any package needing native build and allow-list it; verify `prebuild` Firebase SW generation output is unchanged.
- **Vercel uses a different pnpm version than local** → Pin via `packageManager`; confirm the deployed install log shows the pinned version.
- **Contributors keep using npm, creating a stray `package-lock.json`** → Remove the file, document pnpm-only workflow, and update the agent permission allow-list; optionally add a `preinstall` guard (`only-allow pnpm`) as a follow-up if drift occurs.
- **Resolved versions drift during migration** → Use `pnpm import` from the existing lockfile and `--frozen-lockfile` thereafter; diff the resolved tree against the npm baseline before committing.

## Migration Plan

1. Capture a baseline: confirm current `npm run build` + `npm run lint` pass and note resolved versions.
2. Enable Corepack / install pinned pnpm; add `packageManager` to `package.json`.
3. Run `pnpm import` to produce `pnpm-lock.yaml` from `package-lock.json`.
4. Move `overrides` → `pnpm.overrides`; delete `package-lock.json`.
5. Remove `node_modules`; run `pnpm install --frozen-lockfile`.
6. Resolve any phantom-dependency or build-script approval issues.
7. Run `pnpm run prebuild` (verify Firebase SW), `pnpm run build`, `pnpm run lint`.
8. Smoke-test critical flows (auth, realtime messaging, push registration, SW/offline).
9. Update `.gitignore`, docs, and `.claude/settings.local.json`.
10. Configure/verify Vercel install with pnpm on a preview deployment.
11. Commit `package.json` + `pnpm-lock.yaml` (and removed `package-lock.json`); open PR.

**Rollback strategy**: revert the migration commit (restores `package-lock.json` and original `package.json`), delete `pnpm-lock.yaml`, run `npm install`. Revert Vercel install setting if it was changed.

## Open Questions

- Which exact pnpm version to pin in `packageManager`? (Recommend the latest stable pnpm 9.x at implementation time unless a constraint exists.)
- Is `shamefully-hoist` ever required, or can all phantom deps be resolved by explicit declaration? (Determine empirically during build.)
- Should a `preinstall: only-allow pnpm` guard be added now or deferred to a follow-up?
