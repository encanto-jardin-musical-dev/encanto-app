## ADDED Requirements

### Requirement: Cold application start-up SHALL NOT cause an e2e flake

The e2e suite SHALL NOT report a test as flaky because the application had not finished starting up. Routes the suite exercises SHALL be compiled before any test asserts against them, so that on-demand compilation in the development server never falls inside a test's assertion budget.

#### Scenario: First test of a CI run does not pay compilation cost
- **WHEN** an e2e suite runs against a freshly started development server
- **THEN** the routes the suite navigates to have already been requested once before the first test executes
- **AND** the first test does not time out waiting for a route to compile

#### Scenario: Warm-up does not require authentication
- **WHEN** the warm-up requests are issued
- **THEN** they are issued without fixture credentials or a storage state
- **AND** route compilation is triggered by the route match rather than by authentication, so an unauthenticated request is sufficient

#### Scenario: A warm-up failure does not fail the run
- **WHEN** a warm-up request errors or times out
- **THEN** the suite still starts
- **AND** any real compilation problem surfaces when a test navigates to the route

#### Scenario: The redirect assertion no longer depends on server start-up
- **WHEN** a test asserts that navigating to the app root lands the user on the feed
- **THEN** the assertion carries an explicit timeout sized for server start-up and an authentication round-trip
- **AND** the test passes on its first attempt rather than only after a retry

### Requirement: Route warm-up SHALL run once, before any test

The warm-up SHALL execute during Playwright global setup, after fixtures are seeded and before any test runs, rather than being duplicated per spec or per project.

#### Scenario: Warm-up runs exactly once per suite
- **WHEN** the suite runs all three role projects
- **THEN** the warm-up requests are issued once during global setup
- **AND** they are not re-issued by individual specs

#### Scenario: Warm-up does not interfere with session setup
- **WHEN** global setup runs
- **THEN** fixture seeding and session establishment for each role still complete as before
- **AND** the warm-up does not require or alter any role's authentication state

### Requirement: Flake reporting SHALL remain meaningful

After this change, a reported flake SHALL indicate a genuine intermittent behaviour rather than application start-up cost. Retry configuration SHALL be retained for genuine network variance.

#### Scenario: Retries remain configured
- **WHEN** the suite runs in CI
- **THEN** tests are still retried on failure
- **AND** a test that passes only after a retry is still reported as flaky rather than passed outright