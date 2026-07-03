import { TypedSupabaseClient } from '@/utils/supabase/client';
import { getChildAvatarSignedUrls } from '@/utils/uploadChildAvatar';

export type AttendanceChildRow = {
  id: string;
  first_name: string;
  last_name: string;
  avatar_url: string | null;
  check_in: string | null;
  check_out: string | null;
};

export type GroupAttendanceResult = {
  groupName: string;
  children: AttendanceChildRow[];
};

function todayDateString(): string {
  return new Date().toISOString().slice(0, 10);
}

/**
 * Group's children plus today's attendance rows, merged into a single list.
 * A child with no attendance row today has `check_in`/`check_out` as `null`
 * (the derived-absent state).
 */
export async function getGroupAttendance(
  client: TypedSupabaseClient,
  groupId: string
): Promise<GroupAttendanceResult | null> {
  // Use limit(1) + index instead of .single() so the embedded child_groups
  // join does not trigger a PGRST109 "multiple rows" error.
  const { data: groupRows, error: groupError } = await client
    .from('groups')
    .select(`
      id,
      name,
      child_groups (
        children (
          id,
          first_name,
          last_name,
          avatar_url
        )
      )
    `)
    .eq('id', groupId)
    .limit(1);

  if (groupError) {
    throw new Error(`Failed to fetch group attendance: ${groupError.message}`);
  }

  const row = groupRows?.[0];
  if (!row) return null;

  const children = (row.child_groups ?? [])
    .map((cg) => cg.children)
    .filter((c): c is { id: string; first_name: string; last_name: string; avatar_url: string | null } => c !== null);

  const avatarPaths = children
    .map((c) => c.avatar_url)
    .filter((path): path is string => !!path);
  const avatarSignedUrls = await getChildAvatarSignedUrls(client, avatarPaths);

  const attendanceByChild = new Map<string, { check_in: string | null; check_out: string | null }>();
  const childIds = children.map((c) => c.id);

  if (childIds.length > 0) {
    const { data: attendanceRows, error: attendanceError } = await client
      .from('attendance')
      .select('child_id, check_in, check_out')
      .in('child_id', childIds)
      .eq('attendance_date', todayDateString());

    if (attendanceError) {
      throw new Error(`Failed to fetch today's attendance: ${attendanceError.message}`);
    }

    for (const a of attendanceRows ?? []) {
      if (a.child_id) {
        attendanceByChild.set(a.child_id, { check_in: a.check_in, check_out: a.check_out });
      }
    }
  }

  return {
    groupName: row.name,
    children: children.map((c) => {
      const attendance = attendanceByChild.get(c.id);
      return {
        id: c.id,
        first_name: c.first_name,
        last_name: c.last_name,
        avatar_url: c.avatar_url ? avatarSignedUrls.get(c.avatar_url) ?? null : null,
        check_in: attendance?.check_in ?? null,
        check_out: attendance?.check_out ?? null,
      };
    }),
  };
}
