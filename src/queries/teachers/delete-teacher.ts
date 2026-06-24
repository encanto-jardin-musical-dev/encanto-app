import { TypedSupabaseClient } from '@/utils/supabase/client';

export async function deleteTeacher(
  client: TypedSupabaseClient,
  id: string
): Promise<void> {
  const { error } = await client.functions.invoke('admin-delete-user', {
    body: { userId: id },
  });

  if (error) {
    throw new Error(`Failed to delete teacher: ${error.message}`);
  }
}
