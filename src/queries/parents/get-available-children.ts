import { TypedSupabaseClient } from '@/utils/supabase/client';

export type ChildOption = {
  id: string;
  first_name: string;
  last_name: string;
  avatar_url: string | null;
};

/**
 * Fetches all children as picker options, ordered alphabetically.
 */
export async function getAvailableChildren(
  client: TypedSupabaseClient
): Promise<ChildOption[]> {
  const { data, error } = await client
    .from('children')
    .select('id, first_name, last_name, avatar_url')
    .order('last_name', { ascending: true })
    .order('first_name', { ascending: true });

  if (error) {
    throw new Error(`Failed to fetch available children: ${error.message}`);
  }

  return (data ?? []).map((child) => ({
    id: child.id,
    first_name: child.first_name,
    last_name: child.last_name,
    avatar_url: child.avatar_url ?? null,
  }));
}
