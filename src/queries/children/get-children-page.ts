import { TypedSupabaseClient } from '@/utils/supabase/client';
import { getChildAvatarSignedUrls } from '@/utils/uploadChildAvatar';

export type ChildrenPageParams = {
  search?: string;
  offset: number;
  pageSize: number;
};

export type ChildListRow = {
  id: string;
  first_name: string;
  last_name: string;
  avatar_url: string | null;
  parentName: string | null;
};

export async function getChildrenPage(
  client: TypedSupabaseClient,
  { search, offset, pageSize }: ChildrenPageParams
): Promise<ChildListRow[]> {
  let query = client
    .from('children')
    .select(`
      id,
      first_name,
      last_name,
      avatar_url,
      child_guardians (
        profiles (
          first_name,
          last_name
        )
      )
    `)
    .order('first_name', { ascending: true })
    .order('last_name', { ascending: true })
    .order('id', { ascending: true })
    .range(offset, offset + pageSize - 1);

  if (search && search.trim().length > 0) {
    const term = `%${search.trim()}%`;
    query = query.or(`first_name.ilike.${term},last_name.ilike.${term}`);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Failed to fetch children page: ${error.message}`);
  }

  const rows = data ?? [];
  const avatarPaths = rows
    .map((child) => child.avatar_url)
    .filter((path): path is string => !!path);
  const signedUrls = await getChildAvatarSignedUrls(client, avatarPaths);

  return rows.map((child) => {
    const guardian = child.child_guardians?.[0]?.profiles;
    const parentName = guardian
      ? `${guardian.first_name} ${guardian.last_name}`
      : null;
    return {
      id: child.id,
      first_name: child.first_name,
      last_name: child.last_name,
      avatar_url: child.avatar_url ? signedUrls.get(child.avatar_url) ?? null : null,
      parentName,
    };
  });
}
