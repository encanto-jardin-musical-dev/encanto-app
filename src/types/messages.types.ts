export type Message = {
  id: string;
  content: string;
  created_at: string;
  is_read: boolean;
  read_at: string | null;
  attachments: string[];
  sender: SenderProfile;
  receiver: ReceiverProfile;
};

type SenderProfile = {
  first_name: string;
  last_name: string;
  role: string;
  sender_id: string;
  groups: Group[];
  children: UserChildren[];
};

type ReceiverProfile = {
  first_name: string;
  last_name: string;
  role: string;
  receiver_id: string;
  groups: Group[];
  children: UserChildren[];
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
