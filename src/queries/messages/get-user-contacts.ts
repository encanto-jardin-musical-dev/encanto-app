import type { UserRoles } from "@/types/common.types";
import type { TypedSupabaseClient } from "@/utils/supabase/client";

export function getUserContacts(
  client: TypedSupabaseClient,
  userID: string,
  roleFilter?: UserRoles,
) {
  const query = client
    .from("profiles")
    .select(`first_name, last_name, id, avatar_url, role`)
    .neq("id", userID);

  return roleFilter ? query.eq("role", roleFilter) : query;
}

