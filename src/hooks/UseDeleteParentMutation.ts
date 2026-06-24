import { deleteParent } from '@/queries/parents/delete-parent';
import { createClient } from '@/utils/supabase/client';
import { useMutation, useQueryClient } from '@tanstack/react-query';

function useDeleteParentMutation() {
  const client = createClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteParent(client, id),
    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({ queryKey: ['parents-list'] });
      queryClient.removeQueries({ queryKey: ['parent', id] });
    },
  });
}

export default useDeleteParentMutation;
