import { test, expect } from '@playwright/test';

/**
 * Runs under the "admin" project only (see playwright.config.ts testMatch).
 *
 * The dashboard shortcut tiles are buttons that push a route
 * (`src/components/admin/AdminShortcutTile.tsx`), not anchors, so they're
 * queried by button role rather than link role.
 */

test('admin can navigate the dashboard and management screens', async ({ page }) => {
  await page.goto('/admin');
  await expect(page.getByRole('heading', { name: 'Administrar' })).toBeVisible();

  await page.getByRole('button', { name: 'Grupos' }).click();
  await expect(page).toHaveURL(/\/admin\/groups$/);
  await expect(page.getByRole('heading', { name: 'Grupos' })).toBeVisible();
  await expect(page.getByText('E2E Test Group')).toBeVisible();

  await page.goBack();
  await page.getByRole('button', { name: 'Niños' }).click();
  await expect(page).toHaveURL(/\/admin\/children$/);
  await expect(page.getByRole('heading', { name: 'Niños' })).toBeVisible();
  await expect(page.getByText('E2E Child')).toBeVisible();

  await page.goBack();
  await page.getByRole('button', { name: 'Maestros' }).click();
  await expect(page).toHaveURL(/\/admin\/teachers$/);
  await expect(page.getByRole('heading', { name: 'Maestros' })).toBeVisible();
  await expect(page.getByText('Teacher E2E')).toBeVisible();

  await page.goBack();
  await page.getByRole('button', { name: 'Padres' }).click();
  await expect(page).toHaveURL(/\/admin\/parents$/);
  await expect(page.getByRole('heading', { name: 'Padres' })).toBeVisible();
  await expect(page.getByText('Parent E2E')).toBeVisible();
});
