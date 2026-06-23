import { TypedSupabaseClient } from '@/utils/supabase/client';

export async function deleteGroup(
  client: TypedSupabaseClient,
  id: string
): Promise<void> {
  const { error } = await client.from('groups').delete().eq('id', id);

  if (error) {
    throw new Error(`Failed to delete group: ${error.message}`);
  }
}
