import { TypedSupabaseClient } from '@/utils/supabase/client';

export async function getChildrenCount(client: TypedSupabaseClient): Promise<number> {
  const { count, error } = await client
    .from('children')
    .select('*', { count: 'exact', head: true });

  if (error) {
    throw new Error(`Failed to fetch children count: ${error.message}`);
  }

  return count ?? 0;
}
