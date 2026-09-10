import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

/**
 * E2E-only endpoint: exchanges a Supabase access/refresh token pair for the
 * app's session cookies, so Playwright can log fixture users in without
 * driving the real magic-link email flow. Disabled unless E2E_TEST_AUTH_SECRET
 * is set (never set in production envs) and the caller presents it.
 */
export async function POST(request: NextRequest) {
  const secret = process.env.E2E_TEST_AUTH_SECRET;

  if (!secret || process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  if (request.headers.get('x-e2e-secret') !== secret) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { access_token, refresh_token } = await request.json();

  if (typeof access_token !== 'string' || typeof refresh_token !== 'string') {
    return NextResponse.json({ error: 'Missing tokens' }, { status: 400 });
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.setSession({ access_token, refresh_token });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
