import { TypedSupabaseClient } from '@/utils/supabase/client';
import { getChildAvatarSignedUrls } from '@/utils/uploadChildAvatar';
import { getGroupImageSignedUrl } from '@/utils/uploadGroupImage';

export type GroupDetailRow = {
  id: string;
  name: string;
  image_url: string | null;
  teachers: Array<{ id: string; first_name: string; last_name: string }>;
  children: Array<{ id: string; first_name: string; last_name: string; avatar_url: string | null }>;
};

export async function getGroupById(
  client: TypedSupabaseClient,
  groupID: string
): Promise<GroupDetailRow | null> {
  // Use limit(1) + index instead of .single() so that multiple rows returned
  // by PostgREST due to the embedded child_groups join do not trigger a
  // PGRST109 "multiple rows" error.
  const { data, error } = await client
    .from('groups')
    .select(`
      id,
      name,
      image_url,
      group_teachers (
        profiles (
          id,
          first_name,
          last_name
        )
      ),
      child_groups (
        children (
          id,
          first_name,
          last_name,
          avatar_url
        )
      )
    `)
    .eq('id', groupID)
    .limit(1);

  if (error) {
    throw new Error(`Failed to fetch group: ${error.message}`);
  }

  const row = data?.[0];
  if (!row) return null;

  const imageUrl = await getGroupImageSignedUrl(client, row.image_url);

  const children = (row.child_groups ?? [])
    .map((cg) => cg.children)
    .filter((c): c is { id: string; first_name: string; last_name: string; avatar_url: string | null } => c !== null);

  const avatarPaths = children
    .map((c) => c.avatar_url)
    .filter((path): path is string => !!path);
  const avatarSignedUrls = await getChildAvatarSignedUrls(client, avatarPaths);

  const teachers = (row.group_teachers ?? [])
    .map((gt) => gt.profiles)
    .filter((p): p is { id: string; first_name: string; last_name: string } => p !== null);

  return {
    id: row.id,
    name: row.name,
    image_url: imageUrl,
    teachers,
    children: children.map((c) => ({
      id: c.id,
      first_name: c.first_name,
      last_name: c.last_name,
      avatar_url: c.avatar_url ? avatarSignedUrls.get(c.avatar_url) ?? null : null,
    })),
  };
}
