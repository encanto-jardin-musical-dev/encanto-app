import { updateChild, UpdateChildParams } from '@/queries/children/update-child';
import { createClient } from '@/utils/supabase/client';
import { useQueryClient, useMutation } from '@tanstack/react-query';

function useUpdateChildMutation() {
  const client = createClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: UpdateChildParams) => updateChild(client, params),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['children-list'] });
      queryClient.invalidateQueries({ queryKey: ['child', variables.id] });
    },
  });
}

export default useUpdateChildMutation;
