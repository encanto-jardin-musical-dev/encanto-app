import type { TypedSupabaseClient } from '@/utils/supabase/client';

export async function deleteTask(client: TypedSupabaseClient, taskId: string): Promise<void> {
  const { error } = await client.from('tasks').delete().eq('id', taskId);

  if (error) {
    throw new Error(`Failed to delete task: ${error.message}`);
  }
}
