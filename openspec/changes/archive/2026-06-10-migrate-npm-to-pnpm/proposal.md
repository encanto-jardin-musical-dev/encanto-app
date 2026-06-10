## Why

The project currently uses npm with a large `package-lock.json` and a flat `node_modules`. Migrating to pnpm gives faster, deterministic installs, stricter dependency resolution (no phantom dependencies), and disk savings via a content-addressable store. Standardizing on pnpm now—before the dependency tree grows further—reduces install time locally and in CI/Vercel, and prevents accidental reliance on undeclared transitive packages.

## What Changes

- Adopt **pnpm** as the sole package manager; remove npm as the supported workflow.
- Generate `pnpm-lock.yaml` from the existing dependency tree and **remove `package-lock.json`**.
- Add `packageManager` field to `package.json` (Corepack-compatible) pinning a specific pnpm version.
- Migrate the `overrides` field in `package.json` to pnpm's `pnpm.overrides` equivalent (preserving the React/React-DOM type pins).
- Update `.gitignore` to ignore pnpm-specific artifacts (e.g., `.pnpm-store/`) and stop ignoring/expecting npm lockfile-only state where relevant.
- Configure Vercel to install with pnpm (auto-detected via lockfile, plus explicit `vercel.json`/project setting if needed).
- Update documentation and tooling that reference npm commands: `README.md`, `CLAUDE.md`, `AGENTS.md`, `FIREBASE_SETUP.md`, and `.claude/settings.local.json` allow-list.
- Verify lifecycle scripts (notably `prebuild` → `scripts/generate-firebase-sw.js`) run correctly under pnpm. **BREAKING** for contributors: developers must use `pnpm` commands instead of `npm`.

## Capabilities

### New Capabilities
- `package-management`: Defines the supported package manager (pnpm), the single source-of-truth lockfile, the pinned package-manager version, dependency-override behavior, and post-migration integrity verification (build + lint + critical runtime flows).

### Modified Capabilities
<!-- No existing capability's requirements change. dependency-security references npm commands but its requirements are about vulnerabilities, not the package manager; those command references are incidental and will be addressed via documentation updates, not requirement changes. -->

## Impact

- **Files**: `package.json` (add `packageManager`, move `overrides` → `pnpm.overrides`), remove `package-lock.json`, add `pnpm-lock.yaml`, `.gitignore`, `.npmrc`/`.pnpmrc` (if needed), `vercel.json` or Vercel project settings.
- **Docs**: `README.md`, `CLAUDE.md`, `AGENTS.md`, `FIREBASE_SETUP.md`.
- **Tooling/config**: `.claude/settings.local.json` permission allow-list (npm → pnpm).
- **CI/Deploy**: Vercel install/build step; `.github/workflows/` (currently only `supabase-keepalive.yml`, no npm usage—no change expected).
- **Lifecycle scripts**: `prebuild`/`build`/`dev`/`lint`/`start` must work via `pnpm run`.
- **Contributors**: Local workflow switches from `npm install` to `pnpm install`; requires pnpm available (via Corepack or global install).
- **No application source code changes** are expected.
