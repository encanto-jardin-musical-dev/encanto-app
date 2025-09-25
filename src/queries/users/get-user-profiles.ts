import type { TypedSupabaseClient } from "@/utils/supabase/client";

export function getUserProfiles(client: TypedSupabaseClient, userIds: string[]) {
  return client
    .from("profiles")
    .select("id, first_name, last_name, role, avatar_url")
    .in("id", userIds);
}