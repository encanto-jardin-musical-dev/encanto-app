import type { TypedSupabaseClient } from '@/utils/supabase/client';

export async function getProfileById(
  client: TypedSupabaseClient,
  id: string
) {
  const { data, error } = await client
    .from('profiles')
    .select('id, first_name, last_name, role, avatar_url')
    .eq('id', id)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to fetch profile: ${error.message}`);
  }

  return data;
}
