import { getAttendedChildren } from '@/queries/reports/get-attended-children';
import { createClient } from '@/utils/supabase/client';
import { useQuery } from '@tanstack/react-query';

export function useAttendedChildrenQuery(groupId: string, date: string, includeChildId?: string | null) {
  const client = createClient();

  return useQuery({
    queryKey: ['attended-children', groupId, date, includeChildId ?? null],
    queryFn: () => getAttendedChildren(client, groupId, date, includeChildId),
    enabled: !!groupId && !!date,
  });
}

export default useAttendedChildrenQuery;
