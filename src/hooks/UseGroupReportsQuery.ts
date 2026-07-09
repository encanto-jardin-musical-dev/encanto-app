import { getGroupReports } from '@/queries/reports/get-group-reports';
import { createClient } from '@/utils/supabase/client';
import { useQuery } from '@tanstack/react-query';

export function useGroupReportsQuery(
  groupId: string,
  childId?: string | null,
  enabled = true,
  includeAllChildren = false
) {
  const client = createClient();

  return useQuery({
    queryKey: ['reports', groupId, childId ?? null, includeAllChildren],
    queryFn: () => getGroupReports(client, groupId, childId, includeAllChildren),
    enabled: enabled && !!groupId,
  });
}

export default useGroupReportsQuery;
