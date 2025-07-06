"use client";

import { contextGroupValue } from "@/lib/store/common";
import { groupMessagesAtom } from "@/lib/store/feed";
import { DetailedMessage } from "@/types/messages.types";
import { useAtom } from "jotai";
import { useEffect, useMemo } from "react";
import MessageFeedCard from "./MessageFeedCard";
import { ActionButton } from "../common/ActionButton";
import { userAtom } from "@/lib/store/user";
import EmptyFeed from "./EmptyFeed";
import useGetUserFeedMessages from "@/hooks/UseGetUserFeedMessages";
import { Spinner } from "@heroui/react";

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

  const { id } = user;

  const {
    data: feedMeessages,
    refetch: refetchMessages,
    isLoading,
    isPending
  } = useGetUserFeedMessages(id, groupContextId as string, id !== "" && groupContextId !== "");

  useEffect(() => {
    if (groupContextId) {
      refetchMessages();
    }
  }, [groupContextId, refetchMessages])

  useEffect(() => {
    if (feedMeessages) {
      setGroupMessages(feedMeessages as DetailedMessage[]);
    }
  }, [feedMeessages, setGroupMessages]);

  const filteredMessages = useMemo(() => {
    if (!Array.isArray(groupMessages)) return [];
    return filterMostRecentMessagesBySender(groupMessages);
  }, [groupMessages]);

  return (
    <div className="w-full flex flex-col gap-4 h-full">
      {isLoading && (
        <Spinner />
      )}
      {filteredMessages.length === 0 && !isLoading && !isPending ? (
        <EmptyFeed />
      ) : null}
      {filteredMessages.length > 0 && !isLoading
        ? filteredMessages.map(message => (
          <MessageFeedCard key={message.message_id} message={message} />
        ))
        : null
      }
      <ActionButton />
    </div>
  );
}
