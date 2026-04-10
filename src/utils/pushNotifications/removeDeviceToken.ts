'use server';

import { createClient } from '@/utils/supabase/server';

// Deletes the device FCM token for the authenticated user.
// Must be called before signing the user out so the DELETE is authenticated
// (RLS policy requires user_id = auth.uid()).
export const removeDeviceToken = async (token: string): Promise<void> => {
  if (!token) return;

  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) return; // Already signed out — nothing to delete

  const { error } = await supabase
    .from('device_push_tokens')
    .delete()
    .eq('user_id', user.id)
    .eq('token', token);

  if (error) {
    console.error('[removeDeviceToken] Failed to delete token:', error.message);
  }
};
