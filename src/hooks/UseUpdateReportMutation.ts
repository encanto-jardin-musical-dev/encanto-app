import { updateReport } from '@/queries/reports/update-report';
import { createClient } from '@/utils/supabase/client';
import { useMutation, useQueryClient } from '@tanstack/react-query';

export function useUpdateReportMutation() {
  const client = createClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: Parameters<typeof updateReport>[1]) => updateReport(client, params),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reports'] });
    },
  });
}

export default useUpdateReportMutation;
