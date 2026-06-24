import { TypedSupabaseClient } from '@/utils/supabase/client';
import { reconcileLinks } from '@/queries/shared/reconcile-links';

export type UpdateGroupParams = {
  id: string;
  name: string;
  image_url?: string | null;
  teacherIds: string[];
};

export async function updateGroup(
  client: TypedSupabaseClient,
  params: UpdateGroupParams
): Promise<void> {
  const { id, teacherIds, ...groupData } = params;

  const { error } = await client.from('groups').update(groupData).eq('id', id);

  if (error) {
    throw new Error(`Failed to update group: ${error.message}`);
  }

  await reconcileLinks(client, {
    table: 'group_teachers',
    parentColumn: 'group_id',
    childColumn: 'teacher_id',
    parentId: id,
    desired: teacherIds,
    getKey: (t) => t,
    buildRow: (teacher_id) => ({ group_id: id, teacher_id }),
  });
}
