import { Message } from "@/types/messages.types";
import { atom } from "jotai";

type MessageUser = {
  id: string | undefined;
  first_name: string | undefined;
  last_name: string | undefined;
  role: string | undefined;
};

// Messages
export const messagesAtom = atom<Message[]>([]);

// Sender
export const senderAtom = atom<MessageUser>();

// Receiver
export const receiverAtom = atom<MessageUser>();
