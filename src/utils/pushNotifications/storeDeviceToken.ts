'use server';

import { createClient } from '@/utils/supabase/server';

// Upserts a device FCM token for the authenticated user into device_push_tokens.
// Skips the upsert if the token is unchanged and last_seen_at was updated recently
// (< 24h) — the caller (client-side) guards this with localStorage; this server
// action always performs the upsert when called.
export const storeDeviceToken = async (token: string): Promise<void> => {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) throw authError ?? new Error('Not authenticated');

  const { error } = await supabase.from('device_push_tokens').upsert(
    {
      user_id: user.id,
      token,
      user_agent:
        typeof window !== 'undefined' ? window.navigator.userAgent : undefined,
      last_seen_at: new Date().toISOString(),
    },
    { onConflict: 'token' }
  );

  if (error) throw new Error(`Failed to store device token: ${error.message}`);
};
