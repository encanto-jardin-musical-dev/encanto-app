import { MESSAGES_PAGE_SIZE } from "@/lib/const";
import type { MessagePage, MessagesCursor, ThreadKind } from "@/types/messages.types";
import { TypedSupabaseClient } from "@/utils/supabase/client";

export type GetMessagesPageParams = {
  currentUserId: string;
  threadId: string;
  kind?: ThreadKind;
  cursor?: MessagesCursor;
  pageSize?: number;
};

export async function getMessagesPage(
  client: TypedSupabaseClient,
  {
    currentUserId,
    threadId,
    kind = "direct",
    cursor = null,
    pageSize = MESSAGES_PAGE_SIZE,
  }: GetMessagesPageParams
): Promise<MessagePage> {
  let query = client.from("detailed_messages").select("*");

  if (kind === "group") {
    query = query.eq("group_id", threadId);
  } else {
    query = query.or(
      `and(sender_id.eq.${currentUserId},receiver_id.eq.${threadId}),` +
        `and(sender_id.eq.${threadId},receiver_id.eq.${currentUserId})`
    );
  }

  if (cursor) {
    query = query.lt("message_created_at", cursor);
  }

  const { data, error } = await query
    .order("message_created_at", { ascending: false })
    .limit(pageSize);

  if (error) {
    throw new Error(`Failed to fetch messages page: ${error.message}`);
  }

  return (data ?? []) as MessagePage;
}
