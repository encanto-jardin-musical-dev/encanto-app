import { test, expect } from '@playwright/test';
import fs from 'node:fs';
import { FIXTURES_PATH } from '../fixtures/global-setup';

/**
 * Runs under the "parent" project only (see playwright.config.ts testMatch).
 *
 * The admin management routes (`/admin`, `/admin/children/[childID]`, ...)
 * have no role gate at the route/layout level — access is enforced purely by
 * Supabase RLS on the underlying queries (see
 * src/hooks/UseChildByIdQuery.ts / src/queries/children/get-child-by-id.ts).
 * So the assertion here is "RLS hides the data" (the child detail renders
 * its not-found placeholder), not a redirect/403 — matching the "empty or
 * filtered result" branch of the permission-boundary requirement in
 * openspec/changes/add-automated-testing/specs/e2e-testing/spec.md.
 */

const fixtures = JSON.parse(fs.readFileSync(FIXTURES_PATH, 'utf-8')) as {
  childId: string;
};

test('parent cannot use the admin-only nav item', async ({ page }) => {
  await page.goto('/feed');
  const nav = page.getByRole('navigation', { name: 'Navegación principal' });
  await expect(nav.getByRole('link', { name: 'Administrar' })).toHaveCount(0);
});

test("parent cannot see another user's admin-scoped child data", async ({ page }) => {
  // Even the parent's OWN guardian child is admin/teacher-scoped data here —
  // RLS on the admin child-detail query should hide it for a parent role.
  await page.goto(`/admin/children/${fixtures.childId}`);

  await expect(page.getByText('E2E Child')).toHaveCount(0);
  // ChildDetail falls back to a bare "—" placeholder when the query returns
  // no row (see src/components/admin/children/ChildDetail.tsx).
  await expect(page.getByText('—')).toBeVisible();
});
