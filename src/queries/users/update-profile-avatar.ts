import { TypedSupabaseClient } from '@/utils/supabase/client';

/**
 * Updates only the avatar_url field of the caller's own profile.
 * Pass null to remove the avatar.
 */
export async function updateProfileAvatar(
  client: TypedSupabaseClient,
  userId: string,
  avatarPath: string | null
): Promise<void> {
  const { error } = await client
    .from('profiles')
    .update({ avatar_url: avatarPath })
    .eq('id', userId);

  if (error) {
    throw new Error(`Failed to update avatar: ${error.message}`);
  }
}
