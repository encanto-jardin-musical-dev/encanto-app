import { TypedSupabaseClient } from "@/utils/supabase/client";

export function getMessages(client: TypedSupabaseClient, userID: string) {
  return client
    .from("detailed_messages")
    .select("*")
    .or(`sender_id.eq.${userID},receiver_id.eq.${userID}`)
    .order("message_created_at");
}
