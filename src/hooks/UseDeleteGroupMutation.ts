import { deleteGroup } from '@/queries/groups/delete-group';
import { createClient } from '@/utils/supabase/client';
import { useMutation, useQueryClient } from '@tanstack/react-query';

function useDeleteGroupMutation() {
  const client = createClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteGroup(client, id),
    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({ queryKey: ['groups-list'] });
      queryClient.removeQueries({ queryKey: ['group', id] });
    },
  });
}

export default useDeleteGroupMutation;
