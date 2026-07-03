import { TypedSupabaseClient } from '@/utils/supabase/client';

/** Lightweight existence + name lookup, for pages that only need the title. */
export async function getGroupName(
  client: TypedSupabaseClient,
  groupID: string
): Promise<string | null> {
  const { data, error } = await client
    .from('groups')
    .select('name')
    .eq('id', groupID)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to fetch group name: ${error.message}`);
  }

  return data?.name ?? null;
}
