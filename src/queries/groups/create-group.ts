import { TypedSupabaseClient } from '@/utils/supabase/client';
import { reconcileLinks } from '@/queries/shared/reconcile-links';

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
    await reconcileLinks(client, {
      table: 'group_teachers',
      parentColumn: 'group_id',
      childColumn: 'teacher_id',
      parentId: groupId,
      desired: params.teacherIds,
      getKey: (t) => t,
      buildRow: (teacher_id) => ({ group_id: groupId, teacher_id }),
    });
  }

  return groupId;
}
