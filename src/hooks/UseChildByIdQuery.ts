import { getChildById } from '@/queries/children/get-child-by-id';
import { createClient } from '@/utils/supabase/client';
import { useQuery } from '@tanstack/react-query';

function useChildByIdQuery(childID: string) {
  const client = createClient();

  return useQuery({
    queryKey: ['child', childID],
    queryFn: () => getChildById(client, childID),
    enabled: !!childID,
  });
}

export default useChildByIdQuery;
