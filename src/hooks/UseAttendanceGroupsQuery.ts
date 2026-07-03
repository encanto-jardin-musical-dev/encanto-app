import { getAttendanceGroups } from '@/queries/attendance/get-attendance-groups';
import { createClient } from '@/utils/supabase/client';
import { useQuery } from '@tanstack/react-query';

export function useAttendanceGroupsQuery(teacherId?: string) {
  const client = createClient();

  return useQuery({
    queryKey: ['attendance-groups', teacherId ?? null],
    queryFn: () => getAttendanceGroups(client, { teacherId }),
  });
}

export default useAttendanceGroupsQuery;
