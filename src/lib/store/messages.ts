import { UserContact } from "@/types/messages.types";
import { atom } from "jotai";

type MessageUser = {
  id: string | undefined;
  first_name: string | undefined;
  last_name: string | undefined;
  role: string | undefined;
  /** Already-resolved signed URL — set when navigating from the contacts list. */
  avatar_url?: string | null;
};

// Receiver
export const receiverAtom = atom<MessageUser>();

// User contacts
export const userContactsAtom = atom<UserContact[]>([]);
