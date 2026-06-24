import { TypedSupabaseClient } from '@/utils/supabase/client';
import { Database } from '@/types/database.types';
import { getParentAvatarSignedUrls } from '@/utils/uploadParentAvatar';

export type ParentsPageParams = {
  search?: string;
  offset: number;
  pageSize: number;
};

export type ParentListRow = {
  id: string;
  first_name: string;
  last_name: string;
  role: Database['public']['Enums']['user_role'];
  avatar_url: string | null;
  children: Array<{ id: string; first_name: string; last_name: string }>;
};

export async function getParentsPage(
  client: TypedSupabaseClient,
  { search, offset, pageSize }: ParentsPageParams
): Promise<ParentListRow[]> {
  let query = client
    .from('profiles')
    .select(`
      id,
      first_name,
      last_name,
      role,
      avatar_url,
      child_guardians (
        children (
          id,
          first_name,
          last_name
        )
      )
    `)
    .eq('role', 'parent')
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
    throw new Error(`Failed to fetch parents page: ${error.message}`);
  }

  const rows = data ?? [];
  const avatarPaths = rows
    .map((parent) => parent.avatar_url)
    .filter((path): path is string => !!path);
  const signedUrls = await getParentAvatarSignedUrls(client, avatarPaths);

  return rows.map((parent) => {
    const children = (parent.child_guardians ?? [])
      .map((cg) => cg.children)
      .filter(
        (c): c is { id: string; first_name: string; last_name: string } => c !== null
      );

    return {
      id: parent.id,
      first_name: parent.first_name,
      last_name: parent.last_name,
      role: parent.role,
      avatar_url: parent.avatar_url ? signedUrls.get(parent.avatar_url) ?? null : null,
      children,
    };
  });
}
