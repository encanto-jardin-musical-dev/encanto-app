import { test, expect } from '@playwright/test';
import fs from 'node:fs';
import { FIXTURES_PATH } from '../fixtures/global-setup';

/**
 * Runs under the "teacher" project only (see playwright.config.ts testMatch).
 *
 * The daily-report scenario also opens a second browser context using the
 * "parent" storageState file directly (rather than relying on parent.spec.ts
 * happening to run after this test) so that "a parent can see a report their
 * child's teacher posted" is verified deterministically within one test,
 * regardless of cross-project/spec execution order.
 *
 * Attachments are NOT exercised on the report/task forms here: while those
 * forms have an upload control, keeping this suite to the happy path per
 * design.md's non-goals (no exhaustive edge-case chasing) is preferred, and
 * message-composer attachments specifically require the `attachments_enabled`
 * PostHog flag, which is not force-enabled for e2e (see
 * src/lib/posthog/client.ts) — only the admin_options_* flags are.
 */

const fixtures = JSON.parse(fs.readFileSync(FIXTURES_PATH, 'utf-8')) as {
  parent: { userId: string };
  teacher: { userId: string };
  groupId: string;
  childId: string;
};

const GROUP_NAME = 'E2E Test Group';
const CHILD_NAME = 'E2E Child';

test('teacher can clock a child in and out', async ({ page }) => {
  await page.goto('/attendance');
  await page.getByRole('link', { name: GROUP_NAME }).click();
  await expect(page).toHaveURL(new RegExp(`/attendance/${fixtures.groupId}$`));

  // Default mode is clock-in; the fixture child starts un-clocked-in.
  const childCard = page.getByRole('button', { name: CHILD_NAME });
  await expect(childCard).toBeVisible();
  await childCard.click();
  await page.getByRole('button', { name: 'Guardar' }).click();

  await expect(page.getByText('0/1 presentes')).toHaveCount(0);
  await expect(page.getByText('1/1 presentes')).toBeVisible();

  // Switch to clock-out mode and clock the same child back out.
  await page.getByRole('radio', { name: 'Salida' }).click();
  const clockOutCard = page.getByRole('button', { name: CHILD_NAME });
  await expect(clockOutCard).toBeVisible();
  await clockOutCard.click();
  await page.getByRole('button', { name: 'Guardar' }).click();

  await expect(page.getByText('0/1 presentes')).toBeVisible();
});

test('teacher can post a daily report visible to the child\'s parent', async ({
  page,
  browser,
}) => {
  const reportTitle = `Reporte e2e ${Date.now()}`;

  await page.goto('/reports');
  await page.getByRole('button', { name: 'Agregar reporte' }).click();
  await expect(page).toHaveURL(/\/reports\/new$/);

  // HeroUI's Select renders a hidden native <select> alongside its visible
  // trigger button, both carrying the "Grupo" accessible label — getByLabel
  // matches both and trips Playwright's strict mode. Scope to the visible
  // trigger (role="button") to disambiguate.
  await page.getByRole('button', { name: /Grupo/ }).click();
  await page.getByRole('option', { name: GROUP_NAME }).click();

  await page.getByLabel('Título').fill(reportTitle);
  await page.getByRole('button', { name: 'Guardar reporte' }).click();

  await expect(page).toHaveURL(/\/reports$/);
  await expect(page.getByText(reportTitle)).toBeVisible();

  // Cross-role check: the report shows up in the guardian's feed.
  const parentContext = await browser.newContext({ storageState: 'e2e/.auth/parent.json' });
  try {
    const parentPage = await parentContext.newPage();
    await parentPage.goto('/feed');
    await expect(parentPage.getByText(reportTitle)).toBeVisible({ timeout: 15_000 });
  } finally {
    await parentContext.close();
  }
});

test('teacher can create a task for their group', async ({ page }) => {
  const taskTitle = `Tarea e2e ${Date.now()}`;

  await page.goto('/tasks');
  await page.getByRole('button', { name: 'Agregar tarea' }).click();
  await expect(page).toHaveURL(/\/tasks\/new$/);

  await page.getByLabel('Título').fill(taskTitle);
  // HeroUI's Select renders a hidden native <select> alongside its visible
  // trigger button, both carrying the "Grupo" accessible label — getByLabel
  // matches both and trips Playwright's strict mode. Scope to the visible
  // trigger (role="button") to disambiguate.
  await page.getByRole('button', { name: /Grupo/ }).click();
  await page.getByRole('option', { name: GROUP_NAME }).click();

  await page.getByRole('button', { name: 'Guardar tarea' }).click();

  await expect(page).toHaveURL(/\/tasks$/);
  await expect(page.getByText(taskTitle)).toBeVisible();
});

test('teacher can message the group guardian', async ({ page }) => {
  await page.goto('/messages');
  const parentContact = page.getByRole('link', { name: /Parent E2E/ });
  await expect(parentContact).toBeVisible();
  await parentContact.click();

  await expect(page).toHaveURL(new RegExp(`/messages/${fixtures.parent.userId}$`));

  const messageText = `Hola acudiente, e2e ${Date.now()}`;
  await page.getByPlaceholder('Mensaje').fill(messageText);
  await page.getByRole('button', { name: 'submit message' }).click();

  await expect(page.getByText(messageText)).toBeVisible();
  await expect(page.getByPlaceholder('Mensaje')).toHaveValue('');
});
