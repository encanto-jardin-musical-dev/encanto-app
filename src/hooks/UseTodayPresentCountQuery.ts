import { getTodayPresentCount } from '@/queries/attendance/get-today-present-count';
import { todayDateString } from '@/utils/dates';
import { createClient } from '@/utils/supabase/client';
import { useQuery } from '@tanstack/react-query';

function useTodayPresentCountQuery() {
  const client = createClient();

  return useQuery({
    queryKey: ['today-present-count', todayDateString()],
    queryFn: () => getTodayPresentCount(client),
  });
}

export default useTodayPresentCountQuery;
