import type { TypedSupabaseClient } from '@/utils/supabase/client';
import type { Database } from '@/types/database.types';

export type ReportRow = Database['public']['Tables']['daily_reports']['Row'] & {
  profiles: { first_name: string; last_name: string } | null;
  children: { first_name: string; last_name: string } | null;
};

/**
 * Reports visible for a group in a given child context, newest first: group-wide
 * reports (`child_id is null`) plus reports individually targeted at `childId`.
 * Used by the parent feed. RLS already restricts individual reports to that
 * child's guardians; this filter matches the currently selected child.
 *
 * `includeAllChildren` skips the child filter entirely, returning every
 * report in the group regardless of target — used for the staff feed, where
 * RLS (staff bypass) already permits seeing every child's individual report.
 */
export async function getGroupReports(
  client: TypedSupabaseClient,
  groupId: string,
  childId?: string | null,
  includeAllChildren = false
): Promise<ReportRow[]> {
  let query = client
    .from('daily_reports')
    .select(
      '*, profiles!daily_reports_teacher_id_fkey(first_name, last_name), children(first_name, last_name)'
    )
    .eq('group_id', groupId);

  if (!includeAllChildren) {
    query = childId ? query.or(`child_id.is.null,child_id.eq.${childId}`) : query.is('child_id', null);
  }

  const { data, error } = await query.order('created_at', { ascending: false });

  if (error) {
    throw new Error(`Failed to fetch group reports: ${error.message}`);
  }

  return (data ?? []) as unknown as ReportRow[];
}
