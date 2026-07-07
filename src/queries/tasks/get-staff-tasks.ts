import type { TypedSupabaseClient } from '@/utils/supabase/client';
import type { Database } from '@/types/database.types';

type TaskRow = Database['public']['Tables']['tasks']['Row'];

export type StaffTaskRow = TaskRow & {
  groups: { name: string } | null;
};

export type GetStaffTasksParams = {
  /** Restrict to groups taught by this teacher. Omit to return all groups (admin). */
  teacherId?: string;
};

/**
 * Tasks for the groups a staff user manages, newest first, joined with the
 * group name. A teacher passes their own id to see only their assigned
 * groups' tasks; an admin omits it to see tasks across every group.
 */
export async function getStaffTasks(
  client: TypedSupabaseClient,
  { teacherId }: GetStaffTasksParams = {}
): Promise<StaffTaskRow[]> {
  const query = teacherId
    ? client
        .from('tasks')
        .select('*, groups!inner(name, group_teachers!inner(teacher_id))')
        .eq('groups.group_teachers.teacher_id', teacherId)
        .order('created_at', { ascending: false })
    : client
        .from('tasks')
        .select('*, groups(name)')
        .order('created_at', { ascending: false });

  const { data, error } = await query;

  if (error) {
    throw new Error(`Failed to fetch staff tasks: ${error.message}`);
  }

  return (data ?? []) as unknown as StaffTaskRow[];
}
