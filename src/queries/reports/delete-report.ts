import type { TypedSupabaseClient } from '@/utils/supabase/client';

export async function deleteReport(client: TypedSupabaseClient, reportId: string): Promise<void> {
  const { error } = await client.from('daily_reports').delete().eq('id', reportId);

  if (error) {
    throw new Error(`Failed to delete report: ${error.message}`);
  }
}
