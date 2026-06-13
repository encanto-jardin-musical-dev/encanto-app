import { deleteChild } from '@/queries/children/delete-child';
import { createClient } from '@/utils/supabase/client';
import { useMutation, useQueryClient } from '@tanstack/react-query';

function useDeleteChildMutation() {
  const client = createClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteChild(client, id),
    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({ queryKey: ['children-list'] });
      queryClient.removeQueries({ queryKey: ['child', id] });
    },
  });
}

export default useDeleteChildMutation;
