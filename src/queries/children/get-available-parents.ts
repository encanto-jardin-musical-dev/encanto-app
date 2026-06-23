import { TypedSupabaseClient } from '@/utils/supabase/client';

export type ParentOption = {
  id: string;
  first_name: string;
  last_name: string;
  avatar_url: string | null;
};

export async function getAvailableParents(
  client: TypedSupabaseClient
): Promise<ParentOption[]> {
  const { data, error } = await client
    .from('profiles')
    .select('id, first_name, last_name, avatar_url')
    .eq('role', 'parent')
    .order('last_name', { ascending: true })
    .order('first_name', { ascending: true });

  if (error) {
    throw new Error(`Failed to fetch available parents: ${error.message}`);
  }

  return data ?? [];
}
