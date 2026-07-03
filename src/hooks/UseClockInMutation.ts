import { clockInChildren } from '@/queries/attendance/clock-in-children';
import { createClient } from '@/utils/supabase/client';
import { useMutation, useQueryClient } from '@tanstack/react-query';

export function useClockInMutation(groupId: string) {
  const client = createClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (childIds: string[]) => clockInChildren(client, childIds),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['group-attendance', groupId] });
    },
  });
}

export default useClockInMutation;
