import { TypedSupabaseClient } from '@/utils/supabase/client';
import { todayDateString } from '@/utils/dates';
import { getChildAvatarSignedUrls } from '@/utils/uploadChildAvatar';
import { AttendanceChildRow } from './get-group-attendance';

export type AdminAttendanceOverviewRow = {
  groupId: string;
  groupName: string;
  children: AttendanceChildRow[];
};

/**
 * School-wide attendance overview for admin review. Fetches all groups with
 * their children, merges with today's attendance, and filters to only show
 * currently present children (checked-in but not checked-out). Groups with no
 * currently present children are excluded from results.
 */
export async function getAdminAttendanceOverview(
  client: TypedSupabaseClient
): Promise<AdminAttendanceOverviewRow[] | null> {
  // Fetch all groups with their children
  const { data: groups, error: groupsError } = await client
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
    `);

  if (groupsError) {
    throw new Error(`Failed to fetch groups for attendance overview: ${groupsError.message}`);
  }

  if (!groups?.length) {
    return [];
  }

  // Flatten all children across all groups
  const allChildren: Array<{ 
    groupId: string; 
    groupName: string; 
    child: {
      id: string;
      first_name: string;
      last_name: string;
      avatar_url: string | null;
    } 
  }> = [];
  groups.forEach((group) => {
    const children = (group.child_groups ?? [])
      .map((cg) => cg.children)
      .filter((c): c is { id: string; first_name: string; last_name: string; avatar_url: string | null } => 
        c !== null
      );
    
    children.forEach((child) => {
      allChildren.push({
        groupId: group.id,
        groupName: group.name,
        child
      });
    });
  });

  // If no children at all, return empty
  if (allChildren.length === 0) {
    return [];
  }

  const avatarPaths = allChildren
    .map((item) => item.child.avatar_url)
    .filter((path): path is string => !!path);
  const childIds = allChildren.map((item) => item.child.id);

  // Get avatar URLs and today's attendance in parallel
  const [avatarSignedUrls, attendanceResult] = await Promise.all([
    getChildAvatarSignedUrls(client, avatarPaths),
    client
      .from('attendance')
      .select('child_id, check_in, check_out')
      .in('child_id', childIds)
      .eq('attendance_date', todayDateString()),
  ]);

  if (attendanceResult.error) {
    throw new Error(`Failed to fetch today's attendance: ${attendanceResult.error.message}`);
  }

  // Build attendance map. A child may have multiple rows today (re-entry after
  // checkout), so derive current status from the latest open row.
  const attendanceByChild = new Map<string, { check_in: string | null; check_out: string | null }>();
  for (const a of attendanceResult.data ?? []) {
    if (!a.child_id || !a.check_in) continue;

    const existing = attendanceByChild.get(a.child_id);
    const isOpen = a.check_out === null;
    const existingIsOpen = existing?.check_out === null;

    if (!existing || (isOpen && !existingIsOpen) || (isOpen === existingIsOpen && a.check_in > (existing.check_in ?? ''))) {
      attendanceByChild.set(a.child_id, { check_in: a.check_in, check_out: a.check_out });
    }
  }

  // Group children by their group and filter for present children only
  const childrenByGroup = new Map<string, AdminAttendanceOverviewRow>();
  
  allChildren.forEach(({ groupId, groupName, child }) => {
    const attendance = attendanceByChild.get(child.id);
    
    // Include only children who are checked-in but not checked-out (currently present)
    if (attendance && attendance.check_in && !attendance.check_out) {
      const childRow: AttendanceChildRow = {
        id: child.id,
        first_name: child.first_name,
        last_name: child.last_name,
        avatar_url: child.avatar_url ? avatarSignedUrls.get(child.avatar_url) ?? null : null,
        check_in: attendance.check_in,
        check_out: attendance.check_out,
      };

      if (!childrenByGroup.has(groupId)) {
        childrenByGroup.set(groupId, {
          groupId,
          groupName,
          children: []
        });
      }
      
      childrenByGroup.get(groupId)!.children.push(childRow);
    }
  });

  // Return only groups that have currently present children
  return Array.from(childrenByGroup.values());
}