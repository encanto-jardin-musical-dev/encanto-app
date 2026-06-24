import { getTeacherById } from '@/queries/teachers/get-teacher-by-id';
import { createClient } from '@/utils/supabase/client';
import { useQuery } from '@tanstack/react-query';

function useTeacherByIdQuery(teacherID: string) {
  const client = createClient();

  return useQuery({
    queryKey: ['teacher', teacherID],
    queryFn: () => getTeacherById(client, teacherID),
    enabled: !!teacherID,
  });
}

export default useTeacherByIdQuery;
