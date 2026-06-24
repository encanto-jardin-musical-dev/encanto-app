import { Database } from '@/types/database.types';
import { TypedSupabaseClient } from '@/utils/supabase/client';

type Role = Database['public']['Enums']['user_role'];

export type ProfileOption = {
  id: string;
  first_name: string;
  last_name: string;
  avatar_url?: string | null;
};

/** Fetch profiles by role, ordered by last_name then first_name. */
export async function getProfilesByRole(
  client: TypedSupabaseClient,
  role: Role,
  opts: { withAvatar?: boolean } = {}
): Promise<ProfileOption[]> {
  if (opts.withAvatar) {
    const { data, error } = await client
      .from('profiles')
      .select('id, first_name, last_name, avatar_url')
      .eq('role', role)
      .order('last_name', { ascending: true })
      .order('first_name', { ascending: true });

    if (error) throw new Error(`Failed to fetch profiles with role '${role}': ${error.message}`);
    return data ?? [];
  }

  const { data, error } = await client
    .from('profiles')
    .select('id, first_name, last_name')
    .eq('role', role)
    .order('last_name', { ascending: true })
    .order('first_name', { ascending: true });

  if (error) throw new Error(`Failed to fetch profiles with role '${role}': ${error.message}`);
  return data ?? [];
}
