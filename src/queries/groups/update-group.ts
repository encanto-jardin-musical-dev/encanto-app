import { TypedSupabaseClient } from '@/utils/supabase/client';

export type UpdateGroupParams = {
  id: string;
  name: string;
  image_url?: string | null;
  teacher_id: string | null;
};

export async function updateGroup(
  client: TypedSupabaseClient,
  params: UpdateGroupParams
): Promise<void> {
  const { id, ...groupData } = params;

  const { error } = await client.from('groups').update(groupData).eq('id', id);

  if (error) {
    throw new Error(`Failed to update group: ${error.message}`);
  }
}
