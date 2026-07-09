import type { TypedSupabaseClient } from '@/utils/supabase/client';
import type { Database } from '@/types/database.types';

type ReportRow = Database['public']['Tables']['daily_reports']['Row'];

export type StaffReportRow = ReportRow & {
  groups: { name: string } | null;
};

export type GetStaffReportsParams = {
  /** Restrict to groups taught by this teacher. Omit to return all groups (admin). */
  teacherId?: string;
};

/**
 * Reports for the groups a staff user manages, newest first, joined with the
 * group name. A teacher passes their own id to see only their assigned
 * groups' reports; an admin omits it to see reports across every group.
 */
export async function getStaffReports(
  client: TypedSupabaseClient,
  { teacherId }: GetStaffReportsParams = {}
): Promise<StaffReportRow[]> {
  const query = teacherId
    ? client
        .from('daily_reports')
        .select('*, groups!inner(name, group_teachers!inner(teacher_id))')
        .eq('groups.group_teachers.teacher_id', teacherId)
        .order('created_at', { ascending: false })
    : client
        .from('daily_reports')
        .select('*, groups(name)')
        .order('created_at', { ascending: false });

  const { data, error } = await query;

  if (error) {
    throw new Error(`Failed to fetch staff reports: ${error.message}`);
  }

  return (data ?? []) as unknown as StaffReportRow[];
}
