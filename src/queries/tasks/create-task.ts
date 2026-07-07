import type { TypedSupabaseClient } from '@/utils/supabase/client';
import type { Database } from '@/types/database.types';
import type { Attachment } from '@/types/messages.types';

type TaskInsert = Database['public']['Tables']['tasks']['Insert'];

export type CreateTaskParams = {
  title: string;
  groupId: string;
  teacherId: string;
  dueDate?: string | null;
  description?: string | null;
  attachments?: Attachment[];
};

export async function createTask(
  client: TypedSupabaseClient,
  { title, groupId, teacherId, dueDate, description, attachments }: CreateTaskParams
): Promise<void> {
  const payload: TaskInsert = {
    title,
    group_id: groupId,
    teacher_id: teacherId,
    due_date: dueDate ?? null,
    description: description ?? null,
    attachments: attachments?.length ? (attachments as unknown as TaskInsert['attachments']) : null,
  };

  const { error } = await client.from('tasks').insert(payload);

  if (error) {
    throw new Error(`Failed to create task: ${error.message}`);
  }
}
