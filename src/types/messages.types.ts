import { Database } from "./database.types";

export type Message = Database["public"]["Views"]["detailed_messages"]["Row"];

/**
 * A single file attachment stored in the messages.attachments jsonb column.
 * key: S3 object key (e.g. "messages/2024/01/<uuid>.webp")
 * contentType: MIME type of the file
 * size: file size in bytes
 * name: sanitized original filename
 */
export type Attachment = {
  key: string;
  contentType: string;
  size: number;
  name: string;
};

export type MessageAttachments = Attachment[];

export type MessagePage = Message[];

export type MessagesCursor = string | null;

export type ThreadKind = "direct" | "group";

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
