import { createParent, CreateParentParams } from '@/queries/parents/create-parent';
import { createClient } from '@/utils/supabase/client';
import { useQueryClient, useMutation } from '@tanstack/react-query';

function useCreateParentMutation() {
  const client = createClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: CreateParentParams) => createParent(client, params),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['parents-list'] });
    },
  });
}

export default useCreateParentMutation;
