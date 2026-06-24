import { createTeacher, CreateTeacherParams } from '@/queries/teachers/create-teacher';
import { createClient } from '@/utils/supabase/client';
import { useQueryClient, useMutation } from '@tanstack/react-query';

function useCreateTeacherMutation() {
  const client = createClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: CreateTeacherParams) => createTeacher(client, params),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teachers-list'] });
    },
  });
}

export default useCreateTeacherMutation;
