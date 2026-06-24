import { Database } from '@/types/database.types';
import { TypedSupabaseClient } from '@/utils/supabase/client';
import { reconcileLinks } from '@/queries/shared/reconcile-links';

export type UpdateTeacherParams = {
  id: string;
  first_name: string;
  last_name: string;
  document_type: Database['public']['Enums']['document_type'];
  document_number: string;
  role: Database['public']['Enums']['user_role'];
  phone?: string | null;
  avatar_url?: string | null;
  groupIds: string[];
};

export async function updateTeacher(
  client: TypedSupabaseClient,
  params: UpdateTeacherParams
): Promise<void> {
  const { id, groupIds, ...profileData } = params;

  const { error } = await client
    .from('profiles')
    .update(profileData)
    .eq('id', id)
    .eq('role', 'teacher');

  if (error) {
    throw new Error(`Failed to update teacher: ${error.message}`);
  }

  // Reconcile group links
  await reconcileLinks(client, {
    table: 'group_teachers',
    parentColumn: 'teacher_id',
    childColumn: 'group_id',
    parentId: id,
    desired: groupIds,
    getKey: (g) => g,
    buildRow: (group_id) => ({ teacher_id: id, group_id }),
  });
}
