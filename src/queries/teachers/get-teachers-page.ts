import { TypedSupabaseClient } from '@/utils/supabase/client';
import { Database } from '@/types/database.types';
import { getTeacherAvatarSignedUrls } from '@/utils/uploadTeacherAvatar';

export type TeachersPageParams = {
  search?: string;
  offset: number;
  pageSize: number;
};

export type TeacherListRow = {
  id: string;
  first_name: string;
  last_name: string;
  role: Database['public']['Enums']['user_role'];
  avatar_url: string | null;
};

export async function getTeachersPage(
  client: TypedSupabaseClient,
  { search, offset, pageSize }: TeachersPageParams
): Promise<TeacherListRow[]> {
  let query = client
    .from('profiles')
    .select('id, first_name, last_name, role, avatar_url')
    .eq('role', 'teacher')
    .order('last_name', { ascending: true })
    .order('first_name', { ascending: true })
    .order('id', { ascending: true })
    .range(offset, offset + pageSize - 1);

  if (search && search.trim().length > 0) {
    const term = `%${search.trim()}%`;
    query = query.or(`first_name.ilike.${term},last_name.ilike.${term}`);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Failed to fetch teachers page: ${error.message}`);
  }

  const rows = data ?? [];
  const avatarPaths = rows
    .map((teacher) => teacher.avatar_url)
    .filter((path): path is string => !!path);
  const signedUrls = await getTeacherAvatarSignedUrls(client, avatarPaths);

  return rows.map((teacher) => ({
    id: teacher.id,
    first_name: teacher.first_name,
    last_name: teacher.last_name,
    role: teacher.role,
    avatar_url: teacher.avatar_url ? signedUrls.get(teacher.avatar_url) ?? null : null,
  }));
}
