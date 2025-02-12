import { Message } from "@/types/messages.types";
import { createClient } from "@/utils/supabase/client";

export const getUserChildren = async () => {
  const supabase = createClient();
  const { data, error } = await supabase.from("child_guardians").select(`
      relationship,
      children (
        id,
        first_name,
        last_name,
        child_group:child_groups (
          group_id
        )
      )
    `);

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    return []; // or handle it as per your application's requirement
  }

  return data;
};

export const getAllGroups = async () => {
  const supabase = createClient();
  const { data, error } = await supabase.from("groups").select("*");
  if (error) {
    throw new Error(error.message);
  }
  if (!data) {
    return [];
  }
  return data;
};

export const getUserGroups = async (id: string) => {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("groups")
    .select(`*`)
    .eq("teacher_id", id);

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    return []; // or handle it as per your application's requirement
  }

  return data;
};

export const getUserMessages = async () => {
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
      from:profiles!messages_sender_id_fkey(
        first_name,
        last_name,
        role,
        sender_id:id,
        groups (group_id:id, group_name:name, teacher_id )
      ),
      to:profiles!messages_receiver_id_fkey(
        first_name,
        last_name,
        role,
        receiver_id:id,
        groups (group_id:id, group_name:name, teacher_id )
      )
    `,
    )
    .order("created_at", { ascending: false });
  if (error) {
    throw new Error(error.message);
  }
  if (!data) {
    return [];
  }
  return data;
};
