import { Database } from "@/types/database.types";
import { DetailedMessage } from "@/types/messages.types";
import type { ReportRow } from "@/queries/reports/get-group-reports";
import { atom } from "jotai";

type Tasks = Database["public"]["Tables"]["tasks"]["Row"];
type Reports = ReportRow;

export type FeedFilter = "all" | "messages" | "tasks" | "reports";

export const groupTasksAtom = atom<Tasks[]>([]);
export const groupReportsAtom = atom<Reports[]>([]);
export const groupMessagesAtom = atom<DetailedMessage[]>([]);
export const feedFilterAtom = atom<FeedFilter>("all");
