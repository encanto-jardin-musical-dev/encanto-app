import { defineConfig, devices } from '@playwright/test';

const PORT = process.env.PORT ?? '3000';
const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? `http://localhost:${PORT}`;

export default defineConfig({
  testDir: './e2e/specs',
  // All projects share one `pnpm dev` server and one local Supabase/Postgres
  // instance (not one per worker), so parallel workers race the same app
  // instance and produce flaky failures (auth redirects, RLS-scoped reads
  // returning stale data) under load. Single-worker keeps the suite reliable
  // at the cost of some speed — acceptable for this suite's current size.
  fullyParallel: false,
  workers: 1,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: 'html',
  globalSetup: './e2e/fixtures/global-setup.ts',
  use: {
    baseURL,
    trace: 'on-first-retry',
  },
  webServer: {
    command: 'pnpm dev',
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    // Playwright merges this with process.env itself (config.webServer.env
    // does not replace it), so only the addition needs to be listed here.
    env: {
      NEXT_PUBLIC_E2E_FEATURE_FLAGS:
        'admin_options_attendance,admin_options_reports,admin_options_tasks',
    },
  },
  // Each project only runs the specs written for that role's storageState:
  // `auth.spec.ts` runs under all three (it asserts the same "lands on
  // /feed" behavior with role-appropriate differences), while
  // parent/teacher/admin/permissions specs are scoped to the one role they
  // need. Without this, every spec would run once per project against every
  // role's session.
  projects: [
    {
      name: 'parent',
      testMatch: /(auth|parent|permissions)\.spec\.ts/,
      use: { ...devices['Desktop Chrome'], storageState: 'e2e/.auth/parent.json' },
    },
    {
      name: 'teacher',
      testMatch: /(auth|teacher)\.spec\.ts/,
      use: { ...devices['Desktop Chrome'], storageState: 'e2e/.auth/teacher.json' },
    },
    {
      name: 'admin',
      testMatch: /(auth|admin)\.spec\.ts/,
      use: { ...devices['Desktop Chrome'], storageState: 'e2e/.auth/admin.json' },
    },
  ],
});
