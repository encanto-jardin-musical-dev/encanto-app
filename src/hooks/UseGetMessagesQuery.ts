import { MESSAGES_PAGE_SIZE } from "@/lib/const";
import { getMessagesPage } from "@/queries/messages/get-messages";
import type { Message, MessagePage, ThreadKind } from "@/types/messages.types";
import { createClient } from "@/utils/supabase/client";
import { useInfiniteQuery } from "@tanstack/react-query";
import { useMemo } from "react";

export type UseGetMessagesQueryParams = {
  currentUserId: string;
  threadId: string;
  kind?: ThreadKind;
  enabled?: boolean;
};

export function getMessagesQueryKey(currentUserId: string, threadId: string) {
  return ["messages", currentUserId, threadId] as const;
}

/**
 * Paginated messages for a thread via `useInfiniteQuery`.
 *
 * Note: in React Query terms, "next page" here means **older** messages.
 * The server returns newest-first; we flatten and reverse so the UI renders
 * oldest-at-top (ASC) like a conventional chat thread.
 */
function UseGetMessagesQuery({
  currentUserId,
  threadId,
  kind = "direct",
  enabled = true,
}: UseGetMessagesQueryParams) {
  const client = createClient();

  const query = useInfiniteQuery({
    queryKey: getMessagesQueryKey(currentUserId, threadId),
    queryFn: ({ pageParam }) =>
      getMessagesPage(client, {
        currentUserId,
        threadId,
        kind,
        cursor: pageParam,
        pageSize: MESSAGES_PAGE_SIZE,
      }),
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage: MessagePage): string | undefined => {
      if (lastPage.length < MESSAGES_PAGE_SIZE) return undefined;
      const oldest = lastPage[lastPage.length - 1];
      return oldest?.message_created_at ?? undefined;
    },
    enabled: enabled && !!currentUserId && !!threadId,
  });

  const messages: Message[] = useMemo(() => {
    const pages = query.data?.pages ?? [];
    const flat: Message[] = [];
    for (let i = pages.length - 1; i >= 0; i--) {
      const page = pages[i];
      for (let j = page.length - 1; j >= 0; j--) {
        flat.push(page[j]);
      }
    }
    return flat;
  }, [query.data]);

  return {
    ...query,
    messages,
  };
}

export default UseGetMessagesQuery;
