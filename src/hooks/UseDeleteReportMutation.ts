import { deleteReport } from '@/queries/reports/delete-report';
import { createClient } from '@/utils/supabase/client';
import { useMutation, useQueryClient } from '@tanstack/react-query';

export function useDeleteReportMutation() {
  const client = createClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (reportId: string) => deleteReport(client, reportId),
    onSuccess: (_data, reportId) => {
      // Drop the deleted report's own detail query first — otherwise the
      // broad invalidate below refetches it, gets null back, and a still-
      // mounted detail screen calls notFound() mid-navigation.
      queryClient.removeQueries({ queryKey: ['reports', 'detail', reportId] });
      queryClient.invalidateQueries({ queryKey: ['reports'] });
    },
  });
}

export default useDeleteReportMutation;
