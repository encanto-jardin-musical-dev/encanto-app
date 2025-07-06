import { TypedSupabaseClient } from "@/utils/supabase/client";

export function getParentUserContacts(client: TypedSupabaseClient) {
  return client.rpc("get_profiles_by_guardian");
}
