import {
  getAttendanceReport,
  type GetAttendanceReportParams,
} from '@/queries/attendance/get-attendance-report';
import { createClient } from '@/utils/supabase/client';
import { useQuery } from '@tanstack/react-query';

/**
 * Pass the submitted filter snapshot (not live form state); `null` keeps the
 * query disabled until the user presses Generate.
 */
export function useAttendanceReportQuery(filters: GetAttendanceReportParams | null) {
  const client = createClient();

  return useQuery({
    queryKey: ['attendance-report', filters?.childId, filters?.from, filters?.to],
    queryFn: () => getAttendanceReport(client, filters as GetAttendanceReportParams),
    enabled: !!filters,
    staleTime: 60 * 1000,
  });
}

export default useAttendanceReportQuery;
