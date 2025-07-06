import type { TypedSupabaseClient } from "@/utils/supabase/client";

export function getUserContacts(client: TypedSupabaseClient, userID: string) {
  return client
    .from("profiles")
    .select(`first_name, last_name, id, avatar_url, role`)
    .neq("id", userID)
}

