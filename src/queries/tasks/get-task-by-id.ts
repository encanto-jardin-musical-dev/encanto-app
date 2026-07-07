import type { TypedSupabaseClient } from '@/utils/supabase/client';
import type { Database } from '@/types/database.types';

type TaskRow = Database['public']['Tables']['tasks']['Row'];

export type TaskDetailResult =
  | (TaskRow & {
      groups: { name: string } | null;
      profiles: { first_name: string; last_name: string } | null;
    })
  | null;

/** A single task with its group name and author profile, for the detail page. */
export async function getTaskById(
  client: TypedSupabaseClient,
  taskId: string
): Promise<TaskDetailResult> {
  const { data, error } = await client
    .from('tasks')
    .select('*, groups(name), profiles!tasks_teacher_id_fkey(first_name, last_name)')
    .eq('id', taskId)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to fetch task: ${error.message}`);
  }

  return data as unknown as TaskDetailResult;
}
