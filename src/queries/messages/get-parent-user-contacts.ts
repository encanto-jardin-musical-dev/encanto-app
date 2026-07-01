import { TypedSupabaseClient } from "@/utils/supabase/client";

export function getParentUserContacts(client: TypedSupabaseClient, childId?: string) {
  return client.rpc("get_profiles_by_guardian", { p_child_id: childId ?? undefined });
}
