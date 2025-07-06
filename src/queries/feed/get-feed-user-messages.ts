import type { TypedSupabaseClient } from "@/utils/supabase/client";

export function getFeedUserMessages(client: TypedSupabaseClient, { userID, groupID }: { userID: string, groupID: string }) {
  return client
    .from("detailed_messages")
    .select("*")
    .eq("receiver_id", userID)
    .or(`group_id.is.null, group_id.eq.${groupID}`)
    .order("message_created_at", { ascending: false });
}
