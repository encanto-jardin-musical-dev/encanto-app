import { TypedSupabaseClient } from "@/utils/supabase/client";

export async function getUserGroups(client: TypedSupabaseClient, userID: string) {
  const { data, error } = await client
    .from("group_teachers")
    .select("groups(*)")
    .eq("teacher_id", userID);

  if (error) {
    return { data: null, error };
  }

  return { data: (data ?? []).map((row) => row.groups).filter((g) => g !== null), error: null };
}
