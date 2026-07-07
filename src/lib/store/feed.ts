import { Database } from "@/types/database.types";
import { DetailedMessage } from "@/types/messages.types";
import { atom } from "jotai";

type Tasks = Database["public"]["Tables"]["tasks"]["Row"];

export const groupTasksAtom = atom<Tasks[]>([]);
export const groupMessagesAtom = atom<DetailedMessage[]>([]);
