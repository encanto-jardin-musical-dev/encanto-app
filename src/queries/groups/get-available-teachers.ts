import { TypedSupabaseClient } from '@/utils/supabase/client';
import { getProfilesByRole, ProfileOption } from '@/queries/shared/get-profiles-by-role';

export type TeacherOption = Omit<ProfileOption, 'avatar_url'>;

export async function getAvailableTeachers(
  client: TypedSupabaseClient
): Promise<TeacherOption[]> {
  return getProfilesByRole(client, 'teacher');
}
