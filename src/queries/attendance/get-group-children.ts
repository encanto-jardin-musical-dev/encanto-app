import type { TypedSupabaseClient } from '@/utils/supabase/client';

export type GroupChildRow = {
  id: string;
  first_name: string;
  last_name: string;
};

/** Children of a group ordered by name. */
export async function getGroupChildren(
  client: TypedSupabaseClient,
  groupId: string
): Promise<GroupChildRow[]> {
  const { data, error } = await client
    .from('groups')
    .select(`
      id,
      child_groups (
        children (
          id,
          first_name,
          last_name
        )
      )
    `)
    .eq('id', groupId)
    .limit(1);

  if (error) {
    throw new Error(`Failed to fetch group children: ${error.message}`);
  }

  const children = (data?.[0]?.child_groups ?? [])
    .map((cg) => cg.children)
    .filter((c): c is GroupChildRow => c !== null);

  return children.sort(
    (a, b) =>
      a.first_name.localeCompare(b.first_name, 'es') ||
      a.last_name.localeCompare(b.last_name, 'es')
  );
}
