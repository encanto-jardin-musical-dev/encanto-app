import { createChild, CreateChildParams } from '@/queries/children/create-child';
import { createClient } from '@/utils/supabase/client';
import { useQueryClient, useMutation } from '@tanstack/react-query';

function useCreateChildMutation() {
  const client = createClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: CreateChildParams) => createChild(client, params),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['children-list'] });
      queryClient.invalidateQueries({ queryKey: ['children-count'] });
    },
  });
}

export default useCreateChildMutation;
