import { Database } from "@/types/database.types";
import { TypedSupabaseClient } from "@/utils/supabase/client";

export function sendMessage (client: TypedSupabaseClient, message: Database["public"]["Tables"]["messages"]["Insert"]) {
  return client
  .from("messages").insert([
    {
      content: message.content,
      sender_id: message.sender_id,
      receiver_id: message.receiver_id,
      group_id: message.group_id || null,
      is_read: false,
      read_at: null,
    }
  ])
  .select();
}