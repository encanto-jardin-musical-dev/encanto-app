import { TypedSupabaseClient } from '@/utils/supabase/client';
import { getGroupImageSignedUrls } from '@/utils/uploadGroupImage';

export type GroupsPageParams = {
  search?: string;
  offset: number;
  pageSize: number;
};

export type GroupListRow = {
  id: string;
  name: string;
  image_url: string | null;
};

export async function getGroupsPage(
  client: TypedSupabaseClient,
  { search, offset, pageSize }: GroupsPageParams
): Promise<GroupListRow[]> {
  let query = client
    .from('groups')
    .select('id, name, image_url')
    .order('name', { ascending: true })
    .order('id', { ascending: true })
    .range(offset, offset + pageSize - 1);

  if (search && search.trim().length > 0) {
    query = query.ilike('name', `%${search.trim()}%`);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Failed to fetch groups page: ${error.message}`);
  }

  const rows = data ?? [];
  const imagePaths = rows
    .map((group) => group.image_url)
    .filter((path): path is string => !!path);
  const signedUrls = await getGroupImageSignedUrls(client, imagePaths);

  return rows.map((group) => ({
    id: group.id,
    name: group.name,
    image_url: group.image_url ? signedUrls.get(group.image_url) ?? null : null,
  }));
}
