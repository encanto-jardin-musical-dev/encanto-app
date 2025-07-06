import { TypedSupabaseClient } from "@/utils/supabase/client";

export function getAllGroups(client: TypedSupabaseClient) {
  return client.from('groups').select("*");
}
