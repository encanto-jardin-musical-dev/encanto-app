import type { TypedSupabaseClient } from '@/utils/supabase/client';
import type { Database } from '@/types/database.types';

type ReportRow = Database['public']['Tables']['daily_reports']['Row'];

export type ReportDetailResult =
  | (ReportRow & {
      groups: { name: string } | null;
      profiles: { first_name: string; last_name: string } | null;
    })
  | null;

/** A single report with its group name and author profile, for the detail page. */
export async function getReportById(
  client: TypedSupabaseClient,
  reportId: string
): Promise<ReportDetailResult> {
  const { data, error } = await client
    .from('daily_reports')
    .select('*, groups(name), profiles!daily_reports_teacher_id_fkey(first_name, last_name)')
    .eq('id', reportId)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to fetch report: ${error.message}`);
  }

  return data as unknown as ReportDetailResult;
}
