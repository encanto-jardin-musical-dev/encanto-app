"use client";

import { contextGroupValue } from "@/lib/store";
import { groupMessagesAtom } from "@/lib/store/feed";
import { userAtom } from "@/lib/store/user";
import { getUserMessages } from "@/queries/user";
import { Message } from "@/types/messages.types";
import { Spinner } from "@heroui/react";
import { useAtom } from "jotai";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useMemo } from "react";
import MessageFeedCard from "./MessageFeedCard";
import { ActionButton } from "../common/ActionButton";

function filterMostRecentMessagesBySender(messages: Message[]) {
  const senderMap = new Map();

  for (const message of messages) {
    const senderId = message.sender_id;

    if (
      !senderMap.has(senderId) ||
      new Date(message.created_at as string) >
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
  const [groupContextId] = useAtom(contextGroupValue);
  const [groupMessages, setGroupMessages] = useAtom(groupMessagesAtom);
  const t = useTranslations("UserFeedPage");

  const getGroupMessages = useCallback(async () => {
    const allUserMessages = await getUserMessages(
      user.id,
      groupContextId as string,
    );
    setGroupMessages(allUserMessages as unknown as Message[]);
  }, [setGroupMessages, user.id, groupContextId]);

  useEffect(() => {
    if (groupContextId) {
      getGroupMessages();
    }
  }, [groupContextId, getGroupMessages]);

  const filteredMessages = useMemo(() => {
    if (!Array.isArray(groupMessages)) return [];
    return filterMostRecentMessagesBySender(groupMessages);
  }, [groupMessages]);

  console.log({ filteredMessages })

  return (
    <div className="w-full flex flex-col gap-4">
      {filteredMessages.map((message) => (
        <MessageFeedCard key={message.id} message={message} />
      ))}
      {filteredMessages.length === 0 && (
        <Spinner color="primary" label={t("GroupFeed.loading")} />
      )}
      <ActionButton />
    </div>
  );
}
