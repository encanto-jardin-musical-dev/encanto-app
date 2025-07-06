import { TypedSupabaseClient } from "@/utils/supabase/client";

export function getUserChildren(client: TypedSupabaseClient, userID?: string, groupID?: string) {
  let query = client
    .from('child_guardians')
    .select(`
      relationship,
      children (
        id,
        first_name,
        last_name,
        child_groups (
          group_id
        )
      )
    `);
  if (userID) {
    query = query.eq('guardian_id', userID);
  }

  if (groupID) {
    query = query.eq('children.child_groups.group_id', groupID);
  }

  return query;
}
