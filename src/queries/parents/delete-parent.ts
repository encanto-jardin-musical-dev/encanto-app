import { TypedSupabaseClient } from '@/utils/supabase/client';

export async function deleteParent(
  client: TypedSupabaseClient,
  parentId: string
): Promise<void> {
  const { error } = await client.functions.invoke('admin-delete-user', {
    body: { userId: parentId },
  });

  if (error) {
    try {
      const body = await (error as { context?: Response }).context?.json?.();
      if (body?.error) {
        throw new Error(body.error);
      }
    } catch (parseErr) {
      if (parseErr instanceof Error && parseErr.message !== error.message) {
        throw parseErr;
      }
    }
    throw new Error(`Failed to delete parent: ${error.message}`);
  }
}
