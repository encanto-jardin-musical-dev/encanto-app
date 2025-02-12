export interface Message {
  id: string;
  content: string;
  created_at: string;
  is_read: boolean;
  read_at: string | null;
  attachments: string[];
  from: SenderProfile;
  to: ReceiverProfile;
}

interface SenderProfile {
  first_name: string;
  last_name: string;
  role: string;
  sender_id: string;
  groups: Group[];
}

interface ReceiverProfile {
  first_name: string;
  last_name: string;
  role: string;
  receiver_id: string;
  groups: Group[];
}

interface Group {
  group_id: string;
  group_name: string;
  teacher_id: string;
}
