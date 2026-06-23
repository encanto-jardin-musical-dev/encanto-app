import { getGroupById } from '@/queries/groups/get-group-by-id';
import { createClient } from '@/utils/supabase/client';
import { useQuery } from '@tanstack/react-query';

function useGroupByIdQuery(groupID: string) {
  const client = createClient();

  return useQuery({
    queryKey: ['group', groupID],
    queryFn: () => getGroupById(client, groupID),
    enabled: !!groupID,
  });
}

export default useGroupByIdQuery;
