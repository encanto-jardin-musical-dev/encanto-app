import { TypedSupabaseClient } from '@/utils/supabase/client';

export type CreateGroupParams = {
  name: string;
  image_url?: string | null;
  teacher_id?: string | null;
};

export async function createGroup(
  client: TypedSupabaseClient,
  params: CreateGroupParams
): Promise<string> {
  const { data, error } = await client
    .from('groups')
    .insert({
      name: params.name,
      image_url: params.image_url ?? null,
      teacher_id: params.teacher_id ?? null,
    })
    .select('id')
    .single();

  if (error) {
    throw new Error(`Failed to create group: ${error.message}`);
  }

  return data.id;
}
