import { clockOutChildren } from '@/queries/attendance/clock-out-children';
import { createClient } from '@/utils/supabase/client';
import { useMutation, useQueryClient } from '@tanstack/react-query';

export function useClockOutMutation(groupId: string) {
  const client = createClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (childIds: string[]) => clockOutChildren(client, childIds),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['group-attendance', groupId] });
    },
  });
}

export default useClockOutMutation;
