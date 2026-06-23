import { createGroup, CreateGroupParams } from '@/queries/groups/create-group';
import { createClient } from '@/utils/supabase/client';
import { useQueryClient, useMutation } from '@tanstack/react-query';

function useCreateGroupMutation() {
  const client = createClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: CreateGroupParams) => createGroup(client, params),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['groups-list'] });
    },
  });
}

export default useCreateGroupMutation;
