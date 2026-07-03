import { TypedSupabaseClient } from '@/utils/supabase/client';
import { todayDateString } from '@/utils/dates';

/**
 * Count of children currently present (checked-in but not checked-out) for today,
 * across all groups. `attendance_date` is unique per child per day, so the row
 * count is the distinct-children count — no dedup needed.
 */
export async function getTodayPresentCount(client: TypedSupabaseClient): Promise<number> {
  const { count, error } = await client
    .from('attendance')
    .select('*', { count: 'exact', head: true })
    .eq('attendance_date', todayDateString())
    .not('check_in', 'is', null)
    .is('check_out', null);

  if (error) {
    throw new Error(`Failed to fetch today's present count: ${error.message}`);
  }

  return count ?? 0;
}
