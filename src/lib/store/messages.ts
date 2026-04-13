import { Message, UserContact } from "@/types/messages.types";
import { atom } from "jotai";

type MessageUser = {
  id: string | undefined;
  first_name: string | undefined;
  last_name: string | undefined;
  role: string | undefined;
};

// Messages
export const messagesAtom = atom<Message[]>([]);

// Receiver
export const receiverAtom = atom<MessageUser>();

// User contacts
export const userContactsAtom = atom<UserContact[]>([]);
