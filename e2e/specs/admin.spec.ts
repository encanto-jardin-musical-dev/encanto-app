import { test, expect } from '@playwright/test';
import fs from 'node:fs';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database.types';
import { FIXTURES_PATH } from '../fixtures/global-setup';

const fixtures = JSON.parse(fs.readFileSync(FIXTURES_PATH, 'utf-8')) as {
  admin: { userId: string };
  teacherlessGroupId: string;
  childId: string;
};

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

test('admin can clock a child in and out in a teacherless group', async ({ page }) => {
  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('Local Supabase credentials are required to clean up the attendance fixture.');
  }

  const hostname = new URL(supabaseUrl).hostname;
  if (hostname !== 'localhost' && hostname !== '127.0.0.1') {
    throw new Error('Attendance write verification is restricted to local Supabase.');
  }

  const cleanupClient = createClient<Database>(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  try {
    await page.goto('/attendance');

    const teacherlessGroup = page.getByRole('link', { name: 'E2E Teacherless Group' });
    await expect(teacherlessGroup).toBeVisible();
    await teacherlessGroup.click();
    await expect(page).toHaveURL(new RegExp(`/attendance/${fixtures.teacherlessGroupId}$`));

    const childCard = page.getByRole('button', { name: 'E2E Child' });
    await expect(childCard).toBeVisible();
    await expect(page.getByText('0/1 presentes')).toBeVisible();
    await childCard.click();
    await page.getByRole('button', { name: 'Guardar' }).click();
    await expect(page.getByText('1/1 presentes')).toBeVisible();

    await page.getByRole('radio', { name: 'Salida' }).click();
    await page.getByRole('button', { name: 'E2E Child' }).click();
    await page.getByRole('button', { name: 'Guardar' }).click();
    await expect(page.getByText('0/1 presentes')).toBeVisible();
  } finally {
    const { error } = await cleanupClient
      .from('attendance')
      .delete()
      .eq('child_id', fixtures.childId)
      .eq('recorded_by', fixtures.admin.userId);

    if (error) {
      throw new Error(`Failed to clean up local attendance fixture: ${error.message}`);
    }
  }
});
