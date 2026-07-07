import type { TypedSupabaseClient } from '@/utils/supabase/client';
import type { Database } from '@/types/database.types';

export type TaskRow = Database['public']['Tables']['tasks']['Row'];

/** Tasks for a single group, newest first. Used by the parent feed and the staff group filter. */
export async function getGroupTasks(
  client: TypedSupabaseClient,
  groupId: string
): Promise<TaskRow[]> {
  const { data, error } = await client
    .from('tasks')
    .select('*')
    .eq('group_id', groupId)
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(`Failed to fetch group tasks: ${error.message}`);
  }

  return data ?? [];
}
