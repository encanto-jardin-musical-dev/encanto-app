import { TypedSupabaseClient } from '@/utils/supabase/client';

export async function deleteChild(
  client: TypedSupabaseClient,
  id: string
): Promise<void> {
  const { error } = await client.from('children').delete().eq('id', id);

  if (error) {
    throw new Error(`Failed to delete child: ${error.message}`);
  }
}
