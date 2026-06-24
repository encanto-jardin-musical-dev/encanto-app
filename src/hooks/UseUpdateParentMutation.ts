import { updateParent, UpdateParentParams } from '@/queries/parents/update-parent';
import { createClient } from '@/utils/supabase/client';
import { useQueryClient, useMutation } from '@tanstack/react-query';

function useUpdateParentMutation() {
  const client = createClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: UpdateParentParams) => updateParent(client, params),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['parents-list'] });
      queryClient.invalidateQueries({ queryKey: ['parent', variables.id] });
    },
  });
}

export default useUpdateParentMutation;
