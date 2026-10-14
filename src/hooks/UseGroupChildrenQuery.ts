import { getGroupChildren } from '@/queries/attendance/get-group-children';
import { createClient } from '@/utils/supabase/client';
import { useQuery } from '@tanstack/react-query';

export function useGroupChildrenQuery(groupId?: string) {
  const client = createClient();

  return useQuery({
    queryKey: ['group-children', groupId],
    queryFn: () => getGroupChildren(client, groupId as string),
    enabled: !!groupId,
  });
}

export default useGroupChildrenQuery;
