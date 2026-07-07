import { updateTask } from '@/queries/tasks/update-task';
import { createClient } from '@/utils/supabase/client';
import { useMutation, useQueryClient } from '@tanstack/react-query';

export function useUpdateTaskMutation() {
  const client = createClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: Parameters<typeof updateTask>[1]) => updateTask(client, params),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });
}

export default useUpdateTaskMutation;
