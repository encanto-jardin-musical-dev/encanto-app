import { getParentsPage } from '@/queries/parents/get-parents-page';
import { createClient } from '@/utils/supabase/client';
import { useInfiniteQuery } from '@tanstack/react-query';

const PAGE_SIZE = 20;

function useParentsListQuery(search: string = '') {
  const client = createClient();

  return useInfiniteQuery({
    queryKey: ['parents-list', search],
    queryFn: ({ pageParam }) =>
      getParentsPage(client, {
        search,
        offset: pageParam,
        pageSize: PAGE_SIZE,
      }),
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) => {
      if (lastPage.length < PAGE_SIZE) return undefined;
      return allPages.length * PAGE_SIZE;
    },
  });
}

export default useParentsListQuery;
