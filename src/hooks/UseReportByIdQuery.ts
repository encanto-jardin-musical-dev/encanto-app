import { getReportById } from '@/queries/reports/get-report-by-id';
import { createClient } from '@/utils/supabase/client';
import { useQuery } from '@tanstack/react-query';

export function useReportByIdQuery(reportId: string) {
  const client = createClient();

  return useQuery({
    queryKey: ['reports', 'detail', reportId],
    queryFn: () => getReportById(client, reportId),
    enabled: !!reportId,
  });
}

export default useReportByIdQuery;
