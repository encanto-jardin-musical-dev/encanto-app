import { getParentById } from '@/queries/parents/get-parent-by-id';
import { createClient } from '@/utils/supabase/client';
import { useQuery } from '@tanstack/react-query';

function useParentByIdQuery(parentID: string) {
  const client = createClient();

  return useQuery({
    queryKey: ['parent', parentID],
    queryFn: () => getParentById(client, parentID),
    enabled: !!parentID,
  });
}

export default useParentByIdQuery;
