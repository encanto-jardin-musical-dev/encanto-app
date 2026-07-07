import { getGroupTasks } from '@/queries/tasks/get-group-tasks';
import { createClient } from '@/utils/supabase/client';
import { useQuery } from '@tanstack/react-query';

export function useGroupTasksQuery(groupId: string, enabled = true) {
  const client = createClient();

  return useQuery({
    queryKey: ['tasks', 'group', groupId],
    queryFn: () => getGroupTasks(client, groupId),
    enabled: enabled && !!groupId,
  });
}

export default useGroupTasksQuery;
