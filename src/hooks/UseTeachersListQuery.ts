import { getTeachersPage } from '@/queries/teachers/get-teachers-page';
import { createClient } from '@/utils/supabase/client';
import { useInfiniteQuery } from '@tanstack/react-query';

const PAGE_SIZE = 20;

function useTeachersListQuery(search: string = '') {
  const client = createClient();

  return useInfiniteQuery({
    queryKey: ['teachers-list', search],
    queryFn: ({ pageParam }) =>
      getTeachersPage(client, {
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

export default useTeachersListQuery;
