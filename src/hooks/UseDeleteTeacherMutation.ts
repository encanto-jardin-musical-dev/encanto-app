import { deleteTeacher } from '@/queries/teachers/delete-teacher';
import { createClient } from '@/utils/supabase/client';
import { useMutation, useQueryClient } from '@tanstack/react-query';

function useDeleteTeacherMutation() {
  const client = createClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteTeacher(client, id),
    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({ queryKey: ['teachers-list'] });
      queryClient.removeQueries({ queryKey: ['teacher', id] });
    },
  });
}

export default useDeleteTeacherMutation;
