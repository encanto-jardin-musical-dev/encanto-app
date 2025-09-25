import { Database } from "./database.types";

export type Message = Database["public"]["Views"]["detailed_messages"]["Row"];

type ChildGroup = {
  group_id: string;
};

export type UserChildren = {
  relationship: string;
  children: {
    id: string;
    first_name: string;
    last_name: string;
    child_groups: ChildGroup[];
  };
};
export type UserContact = {
  id: string;
  first_name: string;
  last_name: string;
  role: string;
  avatar_url?: string | null;
};

export type DetailedMessage = {
  message_id: string;
  message_content: string;
  message_created_at: string;
  sender_id: string;
  sender_first_name: string;
  sender_last_name: string;
  sender_role: string;
  receiver_id: string;
  receiver_first_name: string;
  receiver_last_name: string;
  receiver_role: string;
  group_id?: string;
  message_attachments?: string[];
  is_read?: boolean | null;
  read_at?: string | null;
}
