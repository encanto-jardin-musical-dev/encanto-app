import { getStaffReports } from '@/queries/reports/get-staff-reports';
import { createClient } from '@/utils/supabase/client';
import { useQuery } from '@tanstack/react-query';

export function useStaffReportsQuery(userId: string, teacherId?: string) {
  const client = createClient();

  return useQuery({
    queryKey: ['reports', 'staff', userId],
    queryFn: () => getStaffReports(client, { teacherId }),
    enabled: !!userId,
  });
}

export default useStaffReportsQuery;
