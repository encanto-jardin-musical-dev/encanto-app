import type { TypedSupabaseClient } from '@/utils/supabase/client';

export type AttendanceReportRow = {
  attendance_id: string;
  attendance_date: string;
  check_in: string;
  check_out: string | null;
};

export type GetAttendanceReportParams = {
  childId: string;
  /** Inclusive start, YYYY-MM-DD (school calendar day). */
  from: string;
  /** Inclusive end, YYYY-MM-DD (school calendar day). */
  to: string;
};

/**
 * One child's attendance rows within an inclusive date range, most recent day
 * first then check-in ascending. Authorization and the 90-day cap are enforced
 * by the `get_attendance_report` RPC (security invoker, so attendance RLS applies).
 */
export async function getAttendanceReport(
  client: TypedSupabaseClient,
  { childId, from, to }: GetAttendanceReportParams
): Promise<AttendanceReportRow[]> {
  const { data, error } = await client.rpc('get_attendance_report', {
    p_child_id: childId,
    p_from: from,
    p_to: to,
  });

  if (error) {
    throw new Error(`Failed to fetch attendance report: ${error.message}`);
  }

  // The generated type marks check_out as non-null; the function can return null.
  return (data ?? []) as AttendanceReportRow[];
}
