"use client";

import { groupMessagesAtom } from "@/lib/store/feed";
import { getUserMessages } from "@/queries/user";
import { useAtom } from "jotai";
import { useCallback, useEffect, useMemo } from "react";
import { Message } from "@/types/messages.types";
import MessageFeedCard from "./MessageFeedCard";
import { groupContextSelectedAtom } from "@/lib/store";
import { userAtom } from "@/lib/store/user";
import { Spinner } from "@heroui/react";
import { useTranslations } from "next-intl";

function filterMostRecentMessagesBySender(messages: Message[]) {
  const senderMap = new Map();

  for (const message of messages) {
    const senderId = message.sender.sender_id;

    if (
      !senderMap.has(senderId) ||
      new Date(message.created_at) >
        new Date(senderMap.get(senderId).created_at)
    ) {
      senderMap.set(senderId, message);
    }
  }

  return Array.from(senderMap.values()).sort(
    (a, b) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
  );
}

export default function FeedGroup() {
  const [user] = useAtom(userAtom);
  const [groupContext] = useAtom(groupContextSelectedAtom);
  const [groupMessages, setGroupMessages] = useAtom(groupMessagesAtom);
  const t = useTranslations("UserFeedPage");

  const groupContextId = useMemo(() => {
    const selectedValue = groupContext as Set<string | number>;
    return selectedValue ? selectedValue.values().next().value : "";
  }, [groupContext]);

  const getGroupMessages = useCallback(async () => {
    const allUserMessages = await getUserMessages(
      user.id,
      groupContextId as string,
    );
    setGroupMessages(allUserMessages as unknown as Message[]);
  }, [setGroupMessages, user.id, groupContextId]);

  useEffect(() => {
    if (groupContext) {
      getGroupMessages();
    }
  }, [groupContext, getGroupMessages]);

  const filteredMessages = useMemo(() => {
    if (!Array.isArray(groupMessages)) return [];
    return filterMostRecentMessagesBySender(groupMessages);
  }, [groupMessages]);

  return (
    <div className="w-full flex flex-col gap-4">
      {filteredMessages.map((message) => (
        <MessageFeedCard key={message.id} message={message} />
      ))}
      {filteredMessages.length === 0 && (
        <Spinner color="primary" label={t("GroupFeed.loading")} />
      )}
    </div>
  );
}
