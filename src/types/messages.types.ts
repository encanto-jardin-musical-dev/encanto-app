export type Message = {
  id?: string;
  content: string;
  created_at?: string;
  is_read?: boolean;
  read_at?: string | null;
  attachments?: string[];
  sender_id?: string;
  receiver_id?: string;
  group_id?: string;
  sender?: SenderProfile;
  receiver?: ReceiverProfile;
};

type UserProfile = {
  first_name: string;
  last_name: string;
  role: string;
  groups?: Group[];
  children?: UserChildren[];
};

type SenderProfile = UserProfile & {
  sender_id: string;
};

type ReceiverProfile = UserProfile & {
  receiver_id: string;
};

type Group = {
  group_id: string;
  group_name: string;
  teacher_id: string;
};

type ChildGroup = {
  group_id: string;
};

export type UserChildren = {
  relationship: string;
  children: {
    id: string;
    first_name: string;
    last_name: string;
    child_group: ChildGroup[];
  };
};
