import type { TypedSupabaseClient } from '@/utils/supabase/client';
import type { Database } from '@/types/database.types';
import type { Attachment } from '@/types/messages.types';

type TaskUpdate = Database['public']['Tables']['tasks']['Update'];

export type UpdateTaskParams = {
  taskId: string;
  title: string;
  groupId: string;
  dueDate?: string | null;
  description?: string | null;
  attachments?: Attachment[];
};

export async function updateTask(
  client: TypedSupabaseClient,
  { taskId, title, groupId, dueDate, description, attachments }: UpdateTaskParams
): Promise<void> {
  const payload: TaskUpdate = {
    title,
    group_id: groupId,
    due_date: dueDate ?? null,
    description: description ?? null,
    attachments: attachments?.length ? (attachments as unknown as TaskUpdate['attachments']) : null,
  };

  const { error } = await client.from('tasks').update(payload).eq('id', taskId);

  if (error) {
    throw new Error(`Failed to update task: ${error.message}`);
  }
}
