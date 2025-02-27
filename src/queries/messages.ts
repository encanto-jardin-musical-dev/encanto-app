import { Message } from "@/types/messages.types";
import { createClient } from "@/utils/supabase/client";

export async function getMessages(senderID: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from<string, Message[]>("messages")
    .select(
      `
      id,
      content,
      created_at,
      is_read,
      read_at,
      attachments,
      sender:profiles!messages_sender_id_fkey(
        first_name,
        last_name,
        role,
        sender_id:id,
        groups (group_id:id, group_name:name, teacher_id )
      ),
      receiver:profiles!messages_receiver_id_fkey(
        first_name,
        last_name,
        role,
        receiver_id:id,
        groups (group_id:id, group_name:name, teacher_id )
      )
    `,
    )
    .or(`sender_id.eq.${senderID},receiver_id.eq.${senderID}`)
    .order("created_at")
    .returns<Message[]>();
  // TODO: Add rage by create_at

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    return [];
  }

  return data;
}
