import { getGroupAttendance } from '@/queries/attendance/get-group-attendance';
import { createClient } from '@/utils/supabase/client';
import { useQuery } from '@tanstack/react-query';

function todayDateString(): string {
  return new Date().toISOString().slice(0, 10);
}

export function useGroupAttendanceQuery(groupId: string) {
  const client = createClient();

  return useQuery({
    queryKey: ['group-attendance', groupId, todayDateString()],
    queryFn: () => getGroupAttendance(client, groupId),
    enabled: !!groupId,
  });
}

export default useGroupAttendanceQuery;
