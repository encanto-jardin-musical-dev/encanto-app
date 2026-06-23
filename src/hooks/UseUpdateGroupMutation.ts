import { updateGroup, UpdateGroupParams } from '@/queries/groups/update-group';
import { createClient } from '@/utils/supabase/client';
import { useQueryClient, useMutation } from '@tanstack/react-query';

function useUpdateGroupMutation() {
  const client = createClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: UpdateGroupParams) => updateGroup(client, params),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['groups-list'] });
      queryClient.invalidateQueries({ queryKey: ['group', variables.id] });
    },
  });
}

export default useUpdateGroupMutation;
