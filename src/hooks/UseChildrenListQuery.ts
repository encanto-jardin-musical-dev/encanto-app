import { getChildrenPage } from '@/queries/children/get-children-page';
import { createClient } from '@/utils/supabase/client';
import { useInfiniteQuery } from '@tanstack/react-query';

const PAGE_SIZE = 20;

function useChildrenListQuery(search: string = '') {
  const client = createClient();

  return useInfiniteQuery({
    queryKey: ['children-list', search],
    queryFn: ({ pageParam }) =>
      getChildrenPage(client, {
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

export default useChildrenListQuery;
