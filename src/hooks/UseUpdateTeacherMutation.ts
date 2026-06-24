import { updateTeacher, UpdateTeacherParams } from '@/queries/teachers/update-teacher';
import { createClient } from '@/utils/supabase/client';
import { useQueryClient, useMutation } from '@tanstack/react-query';

function useUpdateTeacherMutation() {
  const client = createClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: UpdateTeacherParams) => updateTeacher(client, params),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['teachers-list'] });
      queryClient.invalidateQueries({ queryKey: ['teacher', variables.id] });
    },
  });
}

export default useUpdateTeacherMutation;
