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
 * see only their assigned groups; an admin omits it to see every group
 * (including groups with no teacher assigned yet), or passes a specific
 * teacher's id to filter by that teacher.
 */
export async function getAttendanceGroups(
  client: TypedSupabaseClient,
  { teacherId }: GetAttendanceGroupsParams = {}
): Promise<AttendanceGroupRow[]> {
  // The inner join is only applied when filtering by teacher — an
  // unconditional `!inner` would silently drop teacherless groups from the
  // admin's "all groups" view. group_teachers is UNIQUE (group_id,
  // teacher_id), so the filtered query yields one row per group.
  const query = teacherId
    ? client
        .from('groups')
        .select('id, name, image_url, group_teachers!inner(teacher_id)')
        .eq('group_teachers.teacher_id', teacherId)
        .order('name', { ascending: true })
    : client.from('groups').select('id, name, image_url').order('name', { ascending: true });

  const { data, error } = await query;

  if (error) {
    throw new Error(`Failed to fetch attendance groups: ${error.message}`);
  }

  const rows = data ?? [];
  const imagePaths = rows
    .map((group) => group.image_url)
    .filter((path): path is string => !!path);
  const signedUrls = await getGroupImageSignedUrls(client, imagePaths);

  return rows.map((group) => ({
    id: group.id,
    name: group.name,
    image_url: group.image_url ? signedUrls.get(group.image_url) ?? null : null,
  }));
}
