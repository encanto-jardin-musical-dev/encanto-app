import type { TypedSupabaseClient } from '@/utils/supabase/client';

export type AttendedChildRow = {
  id: string;
  first_name: string;
  last_name: string;
};

/**
 * Children of a group with a `present` or `late` attendance record for the
 * given date. Powers the report form's child selector — a single-child
 * report can only target a child whose attendance was recorded that day.
 *
 * `includeChildId` always keeps that child in the result (if they belong to
 * the group) even without a matching attendance record — used when editing
 * an existing single-child report so its current target stays selectable,
 * regardless of whether attendance for that date still qualifies.
 */
export async function getAttendedChildren(
  client: TypedSupabaseClient,
  groupId: string,
  date: string,
  includeChildId?: string | null
): Promise<AttendedChildRow[]> {
  const { data: groupRows, error: groupError } = await client
    .from('groups')
    .select('id, child_groups(children(id, first_name, last_name))')
    .eq('id', groupId)
    .limit(1);

  if (groupError) {
    throw new Error(`Failed to fetch group children: ${groupError.message}`);
  }

  const row = groupRows?.[0];
  if (!row) return [];

  const children = (row.child_groups ?? [])
    .map((cg) => cg.children)
    .filter((c): c is AttendedChildRow => c !== null);

  const childIds = children.map((c) => c.id);

  const attendedIds = new Set<string>();
  if (childIds.length > 0) {
    const { data: attendanceRows, error: attendanceError } = await client
      .from('attendance')
      .select('child_id, status')
      .in('child_id', childIds)
      .eq('attendance_date', date)
      .in('status', ['present', 'late']);

    if (attendanceError) {
      throw new Error(`Failed to fetch attendance: ${attendanceError.message}`);
    }

    for (const a of attendanceRows ?? []) {
      if (a.child_id) attendedIds.add(a.child_id);
    }
  }

  if (includeChildId) attendedIds.add(includeChildId);

  return children.filter((c) => attendedIds.has(c.id));
}
