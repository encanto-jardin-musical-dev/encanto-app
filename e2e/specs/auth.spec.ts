import { test, expect } from '@playwright/test';
import fs from 'node:fs';
import { FIXTURES_PATH } from '../fixtures/global-setup';

/**
 * Runs under all three projects (see playwright.config.ts testMatch) since
 * every role's session should land on the same /feed home route — the app
 * has no per-role home route, only per-role nav/content differences.
 */

const fixtures = JSON.parse(fs.readFileSync(FIXTURES_PATH, 'utf-8')) as {
  parent: { userId: string };
  teacher: { userId: string };
  admin: { userId: string };
};

const DISPLAY_NAME: Record<'parent' | 'teacher' | 'admin', string> = {
  parent: 'Parent E2E',
  teacher: 'Teacher E2E',
  admin: 'Admin E2E',
};

test('magic-link session bypass lands the user on /feed with role-appropriate nav', async ({
  page,
}, testInfo) => {
  const role = testInfo.project.name as 'parent' | 'teacher' | 'admin';
  expect(fixtures[role].userId).toBeTruthy();

  await page.goto('/');
  await expect(page).toHaveURL(/\/feed$/);

  // Scoped to the sidebar's user-label region: a bare getByText(name) also
  // matches the feed heading "Hola, {name}" (substring match), which is a
  // separate element and trips Playwright's strict-mode check.
  await expect(
    page.getByLabel('Usuario actual').getByText(DISPLAY_NAME[role], { exact: true })
  ).toBeVisible();

  const nav = page.getByRole('navigation', { name: 'Navegación principal' });
  await expect(nav.getByRole('link', { name: 'Inicio' })).toBeVisible();
  await expect(nav.getByRole('link', { name: 'Mensajes' })).toBeVisible();

  if (role === 'admin') {
    await expect(nav.getByRole('link', { name: 'Administrar' })).toBeVisible();
  } else {
    await expect(nav.getByRole('link', { name: 'Administrar' })).toHaveCount(0);
  }

  if (role === 'parent') {
    await expect(nav.getByRole('link', { name: 'Asistencia' })).toHaveCount(0);
    await expect(nav.getByRole('link', { name: 'Tareas' })).toHaveCount(0);
  } else {
    // teacher/admin, with admin_options_* flags force-enabled for e2e
    await expect(nav.getByRole('link', { name: 'Asistencia' })).toBeVisible();
    await expect(nav.getByRole('link', { name: 'Tareas' })).toBeVisible();
  }
});
