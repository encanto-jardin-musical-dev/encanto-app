import { Message } from "@/types/messages.types";
import { atom } from "jotai";

type MessageUser = {
  id: string;
  first_name: string;
  last_name: string;
  role: string;
};

// Messages
export const messagesAtom = atom<Message[]>([]);

// Sender
export const senderAtom = atom<MessageUser>();

// Receiver
export const receiverAtom = atom<MessageUser>();
