import { getTaskById } from '@/queries/tasks/get-task-by-id';
import { createClient } from '@/utils/supabase/client';
import { useQuery } from '@tanstack/react-query';

export function useTaskByIdQuery(taskId: string) {
  const client = createClient();

  return useQuery({
    queryKey: ['tasks', 'detail', taskId],
    queryFn: () => getTaskById(client, taskId),
    enabled: !!taskId,
  });
}

export default useTaskByIdQuery;
