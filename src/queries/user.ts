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

export const getUserMessages = async (userID: string, groupID: string) => {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("detailed_messages")
    .select("*")
    .eq("receiver_id", userID)
    .or(`group_id.is.null, group_id.eq.${groupID}`)
    .order("message_created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }
  if (!data) {
    return [];
  }
  return data;
};
