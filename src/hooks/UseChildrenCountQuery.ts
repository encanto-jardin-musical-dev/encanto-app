import { getChildrenCount } from '@/queries/children/get-children-count';
import { createClient } from '@/utils/supabase/client';
import { useQuery } from '@tanstack/react-query';

function useChildrenCountQuery() {
  const client = createClient();

  return useQuery({
    queryKey: ['children-count'],
    queryFn: () => getChildrenCount(client),
  });
}

export default useChildrenCountQuery;
