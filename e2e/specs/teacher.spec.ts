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
  parent2: { userId: string };
  teacher: { userId: string };
  groupId: string;
  secondGroupId: string;
  childId: string;
};

const GROUP_NAME = 'E2E Test Group';
const SECOND_GROUP_NAME = 'E2E Second Teacher Group';
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
  // Visit the feed first so the teacher's group context is established before
  // composing. A teacher's message is tagged with that context, and the composer
  // refuses to send without one — it is app-wide state hydrated by UserHydrator,
  // so this also avoids racing the hydration on a direct /messages navigation.
  await page.goto('/feed');
  await expect(page.getByRole('button', { name: /Grupos?/ })).toBeVisible();

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

test('teacher can switch the feed group selector and only sees that group', async ({
  page,
}) => {
  const taskTitle = `Tarea grupo 1 ${Date.now()}`;
  const secondTaskTitle = `Tarea grupo 2 ${Date.now()}`;

  // One task per assigned group so we can tell which group the feed is scoped to.
  for (const [title, groupName] of [
    [taskTitle, GROUP_NAME],
    [secondTaskTitle, SECOND_GROUP_NAME],
  ] as const) {
    await page.goto('/tasks');
    await page.getByRole('button', { name: 'Agregar tarea' }).click();
    await expect(page).toHaveURL(/\/tasks\/new$/);
    await page.getByLabel('Título').fill(title);
    await page.getByRole('button', { name: /Grupo/ }).click();
    await page.getByRole('option', { name: groupName }).click();
    await page.getByRole('button', { name: 'Guardar tarea' }).click();
    await expect(page).toHaveURL(/\/tasks$/);
  }

  await page.goto('/feed');

  // The selector is enabled and lists exactly the teacher's two groups.
  const selector = page.getByRole('button', { name: /Grupos?/ }).first();
  await expect(selector).toBeEnabled();
  await selector.click();
  await expect(page.getByRole('option', { name: GROUP_NAME })).toBeVisible();
  await expect(page.getByRole('option', { name: SECOND_GROUP_NAME })).toBeVisible();
  // A group the teacher is not assigned to must not be offered.
  await expect(page.getByRole('option', { name: 'E2E Teacherless Group' })).toHaveCount(0);

  // Select the first group explicitly rather than relying on the default:
  // `getUserGroups` has no ORDER BY, so which group lands at index 0 is not
  // guaranteed.
  await page.getByRole('option', { name: GROUP_NAME }).click();
  await expect(page.getByText(taskTitle)).toBeVisible({ timeout: 15_000 });
  await expect(page.getByText(secondTaskTitle)).toHaveCount(0);

  // Switching re-scopes the feed to the other group, with nothing left over.
  await selector.click();
  await page.getByRole('option', { name: SECOND_GROUP_NAME }).click();

  await expect(page.getByText(secondTaskTitle)).toBeVisible({ timeout: 15_000 });
  await expect(page.getByText(taskTitle)).toHaveCount(0);
});

test('message sent after switching groups is scoped to the selected group', async ({
  page,
  browser,
}) => {
  const messageText = `Mensaje grupo 2 ${Date.now()}`;

  // Point the teacher's feed context at the second group.
  await page.goto('/feed');
  const selector = page.getByRole('button', { name: /Grupos?/ }).first();
  await expect(selector).toBeEnabled();
  await selector.click();
  await page.getByRole('option', { name: SECOND_GROUP_NAME }).click();

  // Send to parent 2, who is a guardian of a child in that group.
  await page.goto('/messages');
  const parentContact = page.getByRole('link', { name: /Parent2 E2E/ });
  await expect(parentContact).toBeVisible();
  await parentContact.click();
  await expect(page).toHaveURL(new RegExp(`/messages/${fixtures.parent2.userId}$`));

  await page.getByPlaceholder('Mensaje').fill(messageText);
  await page.getByRole('button', { name: 'submit message' }).click();
  await expect(page.getByText(messageText)).toBeVisible();

  // Parent 2 (guardian in the selected group) sees it in their feed.
  const parent2Context = await browser.newContext({
    storageState: 'e2e/.auth/parent2.json',
  });
  try {
    const parent2Page = await parent2Context.newPage();
    await parent2Page.goto('/feed');
    await expect(parent2Page.getByText(messageText)).toBeVisible({ timeout: 15_000 });
  } finally {
    await parent2Context.close();
  }

  // Parent 1 (guardian in the other group) must not see it.
  const parent1Context = await browser.newContext({
    storageState: 'e2e/.auth/parent.json',
  });
  try {
    const parent1Page = await parent1Context.newPage();
    await parent1Page.goto('/feed');
    // Anchor on the sidebar user label (the pattern parent.spec.ts relies on)
    // so the feed has actually rendered before asserting absence. A parent's
    // group selector is labelled "Hij@", not "Grupo", so it is no use here.
    await expect(
      parent1Page.getByLabel('Usuario actual').getByText('Parent E2E', { exact: true })
    ).toBeVisible({ timeout: 15_000 });
    await expect(parent1Page.getByText(messageText)).toHaveCount(0);
  } finally {
    await parent1Context.close();
  }
});
