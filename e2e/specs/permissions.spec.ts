import { test, expect } from '@playwright/test';
import fs from 'node:fs';
import { FIXTURES_PATH } from '../fixtures/global-setup';

/**
 * Runs under the "parent" project only (see playwright.config.ts testMatch).
 *
 * The shared admin layout enforces the role boundary on the server. RLS
 * remains an independent data-access boundary for direct API requests.
 */

const fixtures = JSON.parse(fs.readFileSync(FIXTURES_PATH, 'utf-8')) as {
  childId: string;
};

test('parent cannot use the admin-only nav item', async ({ page }) => {
  await page.goto('/feed');
  const nav = page.getByRole('navigation', { name: 'Navegación principal' });
  await expect(nav.getByRole('link', { name: 'Administrar' })).toHaveCount(0);
});

test('parent is redirected away from admin child routes', async ({ page }) => {
  await page.goto(`/admin/children/${fixtures.childId}`);

  await expect(page).toHaveURL(/\/feed$/);
  await expect(page.getByRole('heading', { name: 'Niños' })).toHaveCount(0);
});

test('anonymous user is redirected to login from admin routes', async ({ page }) => {
  await page.context().clearCookies();
  await page.goto('/admin/children');

  await expect(page).toHaveURL(/\/login(?:\?.*)?$/);
  await expect(page.getByRole('heading', { name: 'Niños' })).toHaveCount(0);
});
