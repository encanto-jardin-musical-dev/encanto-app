# Spec: Dependency Security

## Purpose

Ensure the project's dependency tree remains free of critical and high-severity vulnerabilities with available fixes, that security upgrades stay within current major versions to limit regression risk, and that application integrity is verified after any dependency upgrade.

## Requirements

### Requirement: No unresolved critical or high vulnerabilities in dependencies

The project's dependency tree SHALL contain no critical- or high-severity vulnerabilities that have an available non-breaking fix. Any critical- or high-severity vulnerability that remains unresolved SHALL only be one that cannot be fixed without a major-version upgrade, and it MUST be documented as a deferred follow-up with its severity, package, and reason.

#### Scenario: Audit reports a fixable critical or high vulnerability

- **WHEN** `npm audit` reports a critical- or high-severity vulnerability with a non-breaking fix available
- **THEN** the dependency tree MUST be updated so that the vulnerability no longer appears in `npm audit`

#### Scenario: A high vulnerability has only a breaking fix

- **WHEN** `npm audit` reports a critical- or high-severity vulnerability whose only fix requires a major-version upgrade
- **THEN** the vulnerability MAY remain unresolved
- **AND** it MUST be recorded as a deferred follow-up identifying the package, severity, and reason for deferral

### Requirement: Direct dependency security upgrades stay within current major versions

Security-driven upgrades of direct dependencies SHALL remain within the dependency's current major version unless explicitly approved, to limit regression risk.

#### Scenario: Applying a security upgrade to a direct dependency

- **WHEN** a direct dependency is upgraded to remediate a vulnerability
- **THEN** the resulting version MUST share the same major version as the previously installed version
- **AND** any upgrade that crosses a major version MUST be excluded from this change and recorded as a follow-up

### Requirement: Application integrity is verified after dependency upgrades

After dependency upgrades, the application SHALL pass a production build and lint, and its critical user flows SHALL be verified manually, since no automated test suite exists.

#### Scenario: Verifying the build after upgrades

- **WHEN** dependency upgrades have been applied and installed
- **THEN** `npm run build` MUST complete successfully
- **AND** `npm run lint` MUST complete without new errors

#### Scenario: Verifying critical runtime flows after upgrades

- **WHEN** the upgraded application is run locally
- **THEN** authentication, realtime messaging, push notification registration, and service-worker installation/offline behavior MUST function without regression
