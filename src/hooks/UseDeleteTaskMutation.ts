import { deleteTask } from '@/queries/tasks/delete-task';
import { createClient } from '@/utils/supabase/client';
import { useMutation, useQueryClient } from '@tanstack/react-query';

export function useDeleteTaskMutation() {
  const client = createClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (taskId: string) => deleteTask(client, taskId),
    onSuccess: (_data, taskId) => {
      // Drop the deleted task's own detail query first — otherwise the
      // broad invalidate below refetches it, gets null back, and a still-
      // mounted detail screen calls notFound() mid-navigation.
      queryClient.removeQueries({ queryKey: ['tasks', 'detail', taskId] });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });
}

export default useDeleteTaskMutation;
