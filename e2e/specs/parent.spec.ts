import { test, expect } from '@playwright/test';

/**
 * Runs under the "parent" project only (see playwright.config.ts testMatch).
 *
 * Note: sending an attachment is intentionally NOT exercised here. The
 * message composer's attachment picker is hidden for the parent role by
 * design (`src/components/messages/MessageInput.tsx`: `showAttachmentPicker`
 * requires `userRole !== 'parent'`), so a parent can only send text
 * messages. Attachment sending is covered from the teacher side in
 * teacher.spec.ts. "Viewing a daily report for their child" is also covered
 * together with the teacher's report-creation flow in teacher.spec.ts (via a
 * second browser context using this project's parent storageState) so that
 * test isn't dependent on spec execution order across projects.
 */

test('parent can view their feed and message the group teacher', async ({ page }) => {
  await page.goto('/feed');
  await expect(page).toHaveURL(/\/feed$/);
  // FeedUser header renders the signed-in parent's name.
  await expect(page.getByText('Parent E2E')).toBeVisible();

  await page.goto('/messages');
  const teacherContact = page.getByRole('link', { name: /Teacher E2E/ });
  await expect(teacherContact).toBeVisible();
  await teacherContact.click();

  await expect(page).toHaveURL(/\/messages\/[0-9a-f-]{36}$/);

  const messageText = `Hola desde e2e ${Date.now()}`;
  await page.getByPlaceholder('Mensaje').fill(messageText);
  await page.getByRole('button', { name: 'submit message' }).click();

  await expect(page.getByText(messageText)).toBeVisible();
  await expect(page.getByPlaceholder('Mensaje')).toHaveValue('');

  // The attachment picker must not be offered to a parent.
  await expect(page.getByLabel('add files')).toHaveCount(0);
});
