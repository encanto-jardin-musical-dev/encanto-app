import { getGroupsPage } from '@/queries/groups/get-groups-page';
import { createClient } from '@/utils/supabase/client';
import { useInfiniteQuery } from '@tanstack/react-query';

const PAGE_SIZE = 20;

function useGroupsListQuery(search: string = '') {
  const client = createClient();

  return useInfiniteQuery({
    queryKey: ['groups-list', search],
    queryFn: ({ pageParam }) =>
      getGroupsPage(client, {
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

export default useGroupsListQuery;
