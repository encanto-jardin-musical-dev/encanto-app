import { TypedSupabaseClient } from '@/utils/supabase/client';

export type CreateGroupParams = {
  name: string;
  image_url?: string | null;
  teacherIds?: string[];
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
    })
    .select('id')
    .single();

  if (error) {
    throw new Error(`Failed to create group: ${error.message}`);
  }

  const groupId = data.id;

  if (params.teacherIds && params.teacherIds.length > 0) {
    const links = params.teacherIds.map((teacher_id) => ({ group_id: groupId, teacher_id }));
    const { error: teacherError } = await client.from('group_teachers').insert(links);
    if (teacherError) {
      throw new Error(`Failed to link teachers: ${teacherError.message}`);
    }
  }

  return groupId;
}
