import { getAvailableTeachers } from '@/queries/groups/get-available-teachers';
import { createClient } from '@/utils/supabase/client';
import { useQuery } from '@tanstack/react-query';

export function useAvailableTeachersQuery(enabled: boolean) {
  const client = createClient();

  return useQuery({
    queryKey: ['available-teachers'],
    queryFn: () => getAvailableTeachers(client),
    enabled,
  });
}

export default useAvailableTeachersQuery;
