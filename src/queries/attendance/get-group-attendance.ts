import { TypedSupabaseClient } from '@/utils/supabase/client';
import { todayDateString } from '@/utils/dates';
import { getChildAvatarSignedUrls } from '@/utils/uploadChildAvatar';

export type AttendanceChildRow = {
  id: string;
  first_name: string;
  last_name: string;
  avatar_url: string | null;
  check_in: string | null;
  check_out: string | null;
};

/**
 * Group's children plus today's attendance rows, merged into a single list.
 * A child with no attendance row today has `check_in`/`check_out` as `null`
 * (the derived-absent state). "Today" is the school's local calendar day —
 * see `todayDateString`, which mirrors the date the RPCs write.
 */
export async function getGroupAttendance(
  client: TypedSupabaseClient,
  groupId: string
): Promise<AttendanceChildRow[] | null> {
  // Use limit(1) + index instead of .single() so the embedded child_groups
  // join does not trigger a PGRST109 "multiple rows" error.
  const { data: groupRows, error: groupError } = await client
    .from('groups')
    .select(`
      id,
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
  const childIds = children.map((c) => c.id);

  // Signed avatar URLs (storage) and today's attendance rows (DB) are
  // independent — fetch them in parallel.
  const [avatarSignedUrls, attendanceResult] = await Promise.all([
    getChildAvatarSignedUrls(client, avatarPaths),
    childIds.length > 0
      ? client
          .from('attendance')
          .select('child_id, check_in, check_out')
          .in('child_id', childIds)
          .eq('attendance_date', todayDateString())
      : Promise.resolve({ data: [], error: null }),
  ]);

  if (attendanceResult.error) {
    throw new Error(`Failed to fetch today's attendance: ${attendanceResult.error.message}`);
  }

  // Group today's attendance rows by child. A child may have multiple rows
  // (re-entry after checkout), so derive current status from the latest row.
  const attendanceByChild = new Map<string, { check_in: string | null; check_out: string | null }>();
  for (const a of attendanceResult.data ?? []) {
    if (!a.child_id || !a.check_in) continue;

    const existing = attendanceByChild.get(a.child_id);
    // Prefer the most recent open row (no check_out) because that determines
    // current building occupation. If no open row exists, keep the latest closed row.
    const isOpen = a.check_out === null;
    const existingIsOpen = existing?.check_out === null;

    if (!existing || (isOpen && !existingIsOpen) || (isOpen === existingIsOpen && a.check_in > (existing.check_in ?? ''))) {
      attendanceByChild.set(a.child_id, { check_in: a.check_in, check_out: a.check_out });
    }
  }

  return children.map((c) => {
    const attendance = attendanceByChild.get(c.id);
    return {
      id: c.id,
      first_name: c.first_name,
      last_name: c.last_name,
      avatar_url: c.avatar_url ? avatarSignedUrls.get(c.avatar_url) ?? null : null,
      check_in: attendance?.check_in ?? null,
      check_out: attendance?.check_out ?? null,
    };
  });
}
