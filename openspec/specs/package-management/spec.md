# package-management

## Purpose

Defines the supported package manager (pnpm), the single source-of-truth lockfile, the pinned package-manager version, dependency-override behavior, lifecycle-script expectations, and post-migration integrity verification (build + lint + critical runtime flows).

## Requirements

### Requirement: pnpm is the supported package manager

The project SHALL use pnpm as its sole supported package manager. The `package.json` MUST declare a pinned pnpm version via the `packageManager` field so that local, CI, and deployment environments resolve identical pnpm versions.

#### Scenario: Installing dependencies with pnpm

- **WHEN** a contributor runs `pnpm install` at the repository root
- **THEN** dependencies MUST install successfully using the version of pnpm declared in the `packageManager` field

#### Scenario: package.json declares a pinned package manager

- **WHEN** `package.json` is inspected
- **THEN** it MUST contain a `packageManager` field of the form `pnpm@<x.y.z>` with an explicit version

### Requirement: pnpm-lock.yaml is the single source-of-truth lockfile

The repository SHALL maintain exactly one committed lockfile, `pnpm-lock.yaml`. The npm lockfile `package-lock.json` MUST NOT be present in the repository.

#### Scenario: Repository contains only the pnpm lockfile

- **WHEN** the repository tree is inspected
- **THEN** `pnpm-lock.yaml` MUST exist at the root
- **AND** `package-lock.json` MUST NOT exist at the root

#### Scenario: Installs are reproducible from the lockfile

- **WHEN** dependencies are installed in a CI or deployment context with `pnpm install --frozen-lockfile`
- **THEN** the install MUST succeed without modifying `pnpm-lock.yaml`
- **AND** the install MUST fail if `package.json` and `pnpm-lock.yaml` are out of sync

### Requirement: Dependency overrides are preserved under pnpm

The dependency version overrides previously expressed in the npm-standard top-level `overrides` field SHALL be preserved using pnpm's `overrides` configuration in `pnpm-workspace.yaml`, keeping the resolved versions of overridden packages identical to the pre-migration tree. (pnpm 11 reads dependency settings from `pnpm-workspace.yaml`; the `package.json` `pnpm` field is ignored.)

#### Scenario: React type overrides remain pinned

- **WHEN** dependencies are installed with pnpm
- **THEN** `@types/react` and `@types/react-dom` MUST resolve to the versions specified by the `overrides` block in `pnpm-workspace.yaml`
- **AND** the top-level npm `overrides` field MUST NOT be relied upon

### Requirement: Lifecycle scripts run under pnpm

All package lifecycle and developer scripts (including `prebuild`, `build`, `dev`, `lint`, and `start`) SHALL run correctly when invoked via pnpm, with no behavioral difference from the npm-based workflow.

#### Scenario: Prebuild generates the Firebase service worker

- **WHEN** `pnpm run build` is executed
- **THEN** the `prebuild` script MUST run first and regenerate `public/firebase-messaging-sw.js`
- **AND** the production build MUST complete successfully

### Requirement: Migration preserves resolved dependency versions

Migrating from npm to pnpm SHALL NOT change the resolved versions of any dependency. The pnpm lockfile MUST be derived from the existing npm lockfile so that the installed dependency tree matches the pre-migration baseline.

#### Scenario: No incidental version changes during migration

- **WHEN** `pnpm-lock.yaml` is generated from the existing `package-lock.json`
- **THEN** each resolved dependency version MUST match the version that was installed under npm

### Requirement: Application integrity is verified after migration

After migrating to pnpm, the application SHALL pass a production build and lint with pnpm, and its critical user flows SHALL be verified manually, since no automated test suite exists.

#### Scenario: Verifying build and lint after migration

- **WHEN** dependencies have been installed with pnpm
- **THEN** `pnpm run build` MUST complete successfully
- **AND** `pnpm run lint` MUST complete without new errors

#### Scenario: Verifying critical runtime flows after migration

- **WHEN** the migrated application is run locally with pnpm
- **THEN** authentication, realtime messaging, push notification registration, and service-worker installation/offline behavior MUST function without regression

### Requirement: Deployment installs with pnpm

The deployment pipeline (Vercel) SHALL install dependencies using pnpm and the committed `pnpm-lock.yaml`, using the pinned `packageManager` version. Because Vercel otherwise falls back to its built-in pnpm (pnpm 9, which cannot read the pnpm 11 `pnpm-workspace.yaml`), the install and build commands in `vercel.json` MUST invoke pnpm through Corepack (`corepack pnpm …`) so the pinned version is used.

#### Scenario: Vercel install uses the pinned pnpm version

- **WHEN** a deployment is triggered on Vercel
- **THEN** the install step MUST invoke pnpm via `corepack pnpm install --frozen-lockfile`
- **AND** the install log MUST report the pinned `packageManager` version
- **AND** the build MUST complete successfully using `pnpm-lock.yaml`
