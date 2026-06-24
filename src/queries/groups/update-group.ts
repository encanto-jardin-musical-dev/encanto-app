import { TypedSupabaseClient } from '@/utils/supabase/client';

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

  const { data: existingLinks, error: fetchError } = await client
    .from('group_teachers')
    .select('teacher_id')
    .eq('group_id', id);

  if (fetchError) {
    throw new Error(`Failed to fetch teacher links: ${fetchError.message}`);
  }

  const existingTeacherIds = (existingLinks ?? []).map((l) => l.teacher_id);
  const toAdd = teacherIds.filter((t) => !existingTeacherIds.includes(t));
  const toRemove = existingTeacherIds.filter((t) => !teacherIds.includes(t));

  if (toAdd.length > 0) {
    const { error: addError } = await client
      .from('group_teachers')
      .insert(toAdd.map((teacher_id) => ({ group_id: id, teacher_id })));
    if (addError) throw new Error(`Failed to add teacher links: ${addError.message}`);
  }

  if (toRemove.length > 0) {
    const { error: removeError } = await client
      .from('group_teachers')
      .delete()
      .eq('group_id', id)
      .in('teacher_id', toRemove);
    if (removeError) throw new Error(`Failed to remove teacher links: ${removeError.message}`);
  }
}
