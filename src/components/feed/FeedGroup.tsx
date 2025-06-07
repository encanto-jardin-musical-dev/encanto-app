"use client";

import { contextGroupValue } from "@/lib/store";
import { groupMessagesAtom } from "@/lib/store/feed";
import { getUserMessages } from "@/queries/user";
import { DetailedMessage } from "@/types/messages.types";
import { useAtom } from "jotai";
import { useCallback, useEffect, useMemo } from "react";
import MessageFeedCard from "./MessageFeedCard";
import { ActionButton } from "../common/ActionButton";
import { userAtom } from "@/lib/store/user";
import EmptyFeed from "./EmptyFeed";

function filterMostRecentMessagesBySender(messages: DetailedMessage[]) {
  const senderMap = new Map();

  for (const message of messages) {
    const senderId = message.sender_id;

    if (
      !senderMap.has(senderId) ||
      new Date(message.message_created_at as string) >
      new Date(senderMap.get(senderId).message_created_at)
    ) {
      senderMap.set(senderId, message);
    }
  }

  return Array.from(senderMap.values()).sort(
    (a, b) =>
      new Date(b.message_created_at).getTime() - new Date(a.message_created_at).getTime(),
  );
}

export default function FeedGroup() {
  const [user] = useAtom(userAtom);
  const [groupContextId] = useAtom(contextGroupValue);
  const [groupMessages, setGroupMessages] = useAtom(groupMessagesAtom);

  const getGroupMessages = useCallback(async () => {
    const allUserMessages = await getUserMessages(user.id, groupContextId as string);
    setGroupMessages(allUserMessages as unknown as DetailedMessage[]);
  }, [groupContextId, setGroupMessages, user.id]);

  useEffect(() => {
    if (groupContextId) {
      getGroupMessages();
    }
  }, [groupContextId, getGroupMessages]);

  const filteredMessages = useMemo(() => {
    if (!Array.isArray(groupMessages)) return [];
    return filterMostRecentMessagesBySender(groupMessages);
  }, [groupMessages]);



  return (
    <div className="w-full flex flex-col gap-4 h-full">
      {filteredMessages.length > 0
        ? filteredMessages.map(message => (
          <MessageFeedCard key={message.message_id} message={message} />
        ))
        : (<EmptyFeed />)}
      <ActionButton />
    </div>
  );
}
