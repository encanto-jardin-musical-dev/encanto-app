import { TypedSupabaseClient } from '@/utils/supabase/client';
import { Database } from '@/types/database.types';
import { getTeacherAvatarSignedUrl } from '@/utils/uploadTeacherAvatar';
import { getGroupImageSignedUrls } from '@/utils/uploadGroupImage';

export type TeacherDetail = {
  id: string;
  first_name: string;
  last_name: string;
  document_type: Database['public']['Enums']['document_type'];
  document_number: string;
  role: Database['public']['Enums']['user_role'];
  phone: string | null;
  avatar_url: string | null;
  groups: Array<{ id: string; name: string; image_url: string | null }>;
};

export async function getTeacherById(
  client: TypedSupabaseClient,
  teacherId: string
): Promise<TeacherDetail | null> {
  // Use limit(1) instead of .single() to avoid PGRST109 when embedded joins
  // (group_teachers) produce multiple rows.
  const { data, error } = await client
    .from('profiles')
    .select(`
      id,
      first_name,
      last_name,
      document_type,
      document_number,
      role,
      phone,
      avatar_url,
      group_teachers (
        groups (
          id,
          name,
          image_url
        )
      )
    `)
    .eq('id', teacherId)
    .eq('role', 'teacher')
    .limit(1);

  if (error) {
    throw new Error(`Failed to fetch teacher: ${error.message}`);
  }

  const row = data?.[0];
  if (!row) return null;

  const avatarUrl = await getTeacherAvatarSignedUrl(client, row.avatar_url);

  const rawGroups = (row.group_teachers ?? [])
    .map((gt) => gt.groups)
    .filter((g): g is { id: string; name: string; image_url: string | null } => g !== null);

  const groupImagePaths = rawGroups
    .map((g) => g.image_url)
    .filter((p): p is string => p !== null);

  const groupImageUrls = groupImagePaths.length > 0
    ? await getGroupImageSignedUrls(client, groupImagePaths)
    : new Map<string, string>();

  return {
    id: row.id,
    first_name: row.first_name,
    last_name: row.last_name,
    document_type: row.document_type,
    document_number: row.document_number,
    role: row.role,
    phone: row.phone,
    avatar_url: avatarUrl,
    groups: rawGroups.map((g) => ({
      ...g,
      image_url: g.image_url ? (groupImageUrls.get(g.image_url) ?? null) : null,
    })),
  };
}
