import { getStaffTasks } from '@/queries/tasks/get-staff-tasks';
import { createClient } from '@/utils/supabase/client';
import { useQuery } from '@tanstack/react-query';

export function useStaffTasksQuery(userId: string, teacherId?: string) {
  const client = createClient();

  return useQuery({
    queryKey: ['tasks', 'staff', userId],
    queryFn: () => getStaffTasks(client, { teacherId }),
    enabled: !!userId,
  });
}

export default useStaffTasksQuery;
