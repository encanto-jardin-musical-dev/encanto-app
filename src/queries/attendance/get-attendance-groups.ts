import { TypedSupabaseClient } from '@/utils/supabase/client';
import { getGroupImageSignedUrls } from '@/utils/uploadGroupImage';

export type AttendanceGroupRow = {
  id: string;
  name: string;
  image_url: string | null;
};

export type GetAttendanceGroupsParams = {
  /** Restrict to groups taught by this teacher. Omit to return all groups (admin). */
  teacherId?: string;
};

/**
 * Groups available for attendance logging. A teacher passes their own id to
 * see only their assigned groups; an admin omits it to see every group, or
 * passes a specific teacher's id to filter by that teacher.
 */
export async function getAttendanceGroups(
  client: TypedSupabaseClient,
  { teacherId }: GetAttendanceGroupsParams = {}
): Promise<AttendanceGroupRow[]> {
  let query = client
    .from('groups')
    .select('id, name, image_url, group_teachers!inner(teacher_id)')
    .order('name', { ascending: true });

  if (teacherId) {
    query = query.eq('group_teachers.teacher_id', teacherId);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Failed to fetch attendance groups: ${error.message}`);
  }

  const rows = data ?? [];
  const imagePaths = rows
    .map((group) => group.image_url)
    .filter((path): path is string => !!path);
  const signedUrls = await getGroupImageSignedUrls(client, imagePaths);

  const seen = new Set<string>();
  const result: AttendanceGroupRow[] = [];
  for (const group of rows) {
    if (seen.has(group.id)) continue;
    seen.add(group.id);
    result.push({
      id: group.id,
      name: group.name,
      image_url: group.image_url ? signedUrls.get(group.image_url) ?? null : null,
    });
  }

  return result;
}
