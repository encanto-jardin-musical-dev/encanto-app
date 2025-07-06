import { TypedSupabaseClient } from "@/utils/supabase/client";

export function markMessagesAsRead(client: TypedSupabaseClient, messageID: string) {
  return client
    .from("messages")
    .update({ is_read: true, read_at: new Date().toISOString() })
    .match({ id: messageID })
    .select();
}