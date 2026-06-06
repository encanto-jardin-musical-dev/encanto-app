import type { TypedSupabaseClient } from '@/utils/supabase/client';
import type { Database } from '@/types/database.types';

type UserRole = Database['public']['Enums']['user_role'];

export type ProfileByIdResult = {
  id: string;
  first_name: string;
  last_name: string;
  role: UserRole;
  avatar_url: string | null;
} | null;

export async function getProfileById(
  client: TypedSupabaseClient,
  id: string
): Promise<ProfileByIdResult> {
  const { data, error } = await client
    .from('profiles')
    .select('id, first_name, last_name, role, avatar_url')
    .eq('id', id)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to fetch profile: ${error.message}`);
  }

  return data as ProfileByIdResult;
}
