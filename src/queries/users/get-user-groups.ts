import { TypedSupabaseClient } from "@/utils/supabase/client";

export function getUserGroups(client: TypedSupabaseClient, userID: string) {
  return client
    .from("groups")
    .select(`*`)
    .eq("teacher_id", userID);
}
