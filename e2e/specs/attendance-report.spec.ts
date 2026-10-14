import { test, expect } from '@playwright/test';
import fs from 'node:fs';
import { schoolDate } from '../fixtures/seed';

/**
 * Runs under the "teacher" project only (see playwright.config.ts testMatch).
 *
 * The fixture child has history seeded on the two previous days (see
 * seedFixtures): yesterday has a closed 07:00–12:00 cycle plus an open 14:00
 * cycle, two days ago has 08:00–16:00. The default "Últimos 7 días" preset
 * covers both regardless of the day of the month. The parent not-found check
 * opens a second context from the parent storageState, like teacher.spec.ts.
 */

const GROUP_NAME = 'E2E Test Group';
const CHILD_NAME = 'E2E Child';

/** YYYY-MM-DD -> DD/MM/YYYY (how the report formats dates). */
const toDisplayDate = (date: string) => date.split('-').reverse().join('/');

test('teacher generates and downloads an attendance report from the sidebar', async ({
  page,
}) => {
  // Desktop Chrome renders the sidebar, which lists the same staff actions as the plus menu.
  await page.goto('/feed');
  await page.getByRole('link', { name: 'Reporte de asistencia' }).click();
  await expect(page).toHaveURL(/\/attendance-report$/);

  // HeroUI's Select renders a hidden native <select> alongside its visible
  // trigger button, both carrying the same accessible label — scope to the
  // role="button" trigger to avoid strict-mode violations.
  await page.getByRole('button', { name: /Grupo/ }).click();
  await page.getByRole('option', { name: GROUP_NAME }).click();
  await page.getByRole('button', { name: /Niño/ }).click();
  await page.getByRole('option', { name: CHILD_NAME }).click();

  await page.getByRole('button', { name: 'Generar reporte' }).click();

  await expect(page.getByRole('heading', { name: CHILD_NAME })).toBeVisible();
  await expect(page.getByText('3 registros')).toBeVisible();

  // Most recent day first; within a day, check-in ascending.
  const yesterday = toDisplayDate(schoolDate(1));
  const twoDaysAgo = toDisplayDate(schoolDate(2));
  const rows = page.getByRole('row');
  await expect(rows.nth(1)).toContainText(yesterday);
  await expect(rows.nth(1)).toContainText('07:00');
  await expect(rows.nth(2)).toContainText(yesterday);
  await expect(rows.nth(2)).toContainText('14:00');
  await expect(rows.nth(2)).toContainText('Sin salida');
  await expect(rows.nth(3)).toContainText(twoDaysAgo);

  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Descargar CSV' }).click();
  const download = await downloadPromise;

  expect(download.suggestedFilename()).toMatch(
    /^asistencia_e2e-child_\d{4}-\d{2}-\d{2}_\d{4}-\d{2}-\d{2}\.csv$/
  );
  const csv = fs.readFileSync((await download.path())!, 'utf-8');
  const lines = csv.replace(/^﻿/, '').trim().split('\r\n');
  expect(lines[0]).toBe('Fecha,Entrada,Salida');
  expect(lines).toHaveLength(4);
});

test('a parent cannot open the attendance report', async ({ browser }) => {
  const parentContext = await browser.newContext({ storageState: 'e2e/.auth/parent.json' });
  try {
    const parentPage = await parentContext.newPage();
    await parentPage.goto('/attendance-report');
    await expect(parentPage.getByRole('button', { name: 'Generar reporte' })).toHaveCount(0);
    await expect(parentPage.getByText('Página no encontrada')).toBeVisible();
  } finally {
    await parentContext.close();
  }
});
