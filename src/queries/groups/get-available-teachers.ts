import { TypedSupabaseClient } from '@/utils/supabase/client';

export type TeacherOption = {
  id: string;
  first_name: string;
  last_name: string;
};

export async function getAvailableTeachers(
  client: TypedSupabaseClient
): Promise<TeacherOption[]> {
  const { data, error } = await client
    .from('profiles')
    .select('id, first_name, last_name')
    .eq('role', 'teacher')
    .order('last_name', { ascending: true })
    .order('first_name', { ascending: true });

  if (error) {
    throw new Error(`Failed to fetch available teachers: ${error.message}`);
  }

  return data ?? [];
}
