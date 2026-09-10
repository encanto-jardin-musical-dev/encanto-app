import path from 'node:path';
import fs from 'node:fs';
import { createClient } from '@supabase/supabase-js';
import { request as playwrightRequest, type FullConfig } from '@playwright/test';
import { seedFixtures, type SeededFixtures } from './seed';

// This project is ESM ("type": "module"), so __dirname isn't available here.
const AUTH_DIR = path.join(import.meta.dirname, '..', '.auth');
export const FIXTURES_PATH = path.join(AUTH_DIR, 'fixtures.json');

async function signIn(email: string, password: string) {
  const anon = createClient(
    process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  const { data, error } = await anon.auth.signInWithPassword({ email, password });

  if (error || !data.session) {
    throw new Error(`Failed to sign in fixture user ${email}: ${error?.message}`);
  }

  return data.session;
}

async function saveStorageState(
  baseURL: string,
  role: 'parent' | 'teacher' | 'admin',
  session: { access_token: string; refresh_token: string }
) {
  const secret = process.env.E2E_TEST_AUTH_SECRET;
  if (!secret) {
    throw new Error('E2E_TEST_AUTH_SECRET must be set to authenticate fixture users for e2e.');
  }

  const context = await playwrightRequest.newContext({ baseURL });

  const response = await context.post('/api/test/session', {
    headers: { 'x-e2e-secret': secret },
    data: {
      access_token: session.access_token,
      refresh_token: session.refresh_token,
    },
  });

  if (!response.ok()) {
    throw new Error(`Failed to establish session for ${role}: ${response.status()} ${await response.text()}`);
  }

  await context.storageState({ path: path.join(AUTH_DIR, `${role}.json`) });
  await context.dispose();
}

export default async function globalSetup(config: FullConfig) {
  fs.mkdirSync(AUTH_DIR, { recursive: true });

  const fixtures: SeededFixtures = await seedFixtures();
  const baseURL = config.projects[0]?.use?.baseURL ?? 'http://localhost:3000';

  for (const role of ['parent', 'teacher', 'admin'] as const) {
    const { email, password } = fixtures[role];
    const session = await signIn(email, password);
    await saveStorageState(baseURL, role, session);
  }

  fs.writeFileSync(FIXTURES_PATH, JSON.stringify(fixtures, null, 2));
}
