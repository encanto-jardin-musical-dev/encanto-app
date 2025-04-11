import { Message, UserContact } from "@/types/messages.types";
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
      sender_id,
      receiver_id,
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

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    return [];
  }

  return { data, error };
}

export async function sendMessage(message: Message) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("messages")
    .insert({
      content: message.content,
      sender_id: message.sender_id,
      receiver_id: message.receiver_id,
      ...(message.group_id && { group_id: message.group_id }),
      created_at: new Date(),
    })
    .select();

  if (error) {
    throw new Error(error.message);
  }

  return { data, error };
}

export async function markMessageAsRead(messageID: string) {
  const supabase = createClient();
  const { error } = await supabase
    .from("messages")
    .update({ is_read: true, read_at: new Date() })
    .match({ id: messageID })
    .select();

  if (error) {
    throw new Error(error.message);
  }

  return { error };
}

export async function getUserContacts(userID: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select(`first_name, last_name, id, avatar_url, role`)
    .neq("id", userID)
    .returns<UserContact[]>();

  if (error) {
    throw new Error(error.message);
  }

  return { data, error };
}

export async function getProfilesByGuardian() {
  const supabase = createClient();
  const { data, error } = await supabase.rpc("get_profiles_by_guardian");
  if (error) {
    throw new Error(error.message);
  }
  return { data, error };
}
