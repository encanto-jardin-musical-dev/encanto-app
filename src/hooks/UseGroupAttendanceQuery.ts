import { getGroupAttendance } from '@/queries/attendance/get-group-attendance';
import { todayDateString } from '@/utils/dates';
import { createClient } from '@/utils/supabase/client';
import { useQuery } from '@tanstack/react-query';

export function useGroupAttendanceQuery(groupId: string) {
  const client = createClient();

  return useQuery({
    queryKey: ['group-attendance', groupId, todayDateString()],
    queryFn: () => getGroupAttendance(client, groupId),
    enabled: !!groupId,
  });
}

export default useGroupAttendanceQuery;
