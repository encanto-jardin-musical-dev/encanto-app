"use client";

import { messagesAtom, receiverAtom, senderAtom } from "@/lib/store/messages";
import { Message } from "@/types/messages.types";
import { createClient } from "@/utils/supabase/client";
import { useAtom } from "jotai";
import { useEffect, useRef } from "react";
import MessageCard from "./MessageCard";
import { userIdAtom } from "@/lib/store/user";
import UseGetMessagesQuery from "@/hooks/UseGetMessagesQuery";
import { Spinner } from "@heroui/react";

type MessagesListProps = {
  senderID: string;
};

const supabase = createClient();

export default function MessagesList({ senderID }: MessagesListProps) {
  const [messages, setMessages] = useAtom(messagesAtom);
  const [sender] = useAtom(senderAtom);
  const [receiver] = useAtom(receiverAtom);
  const [userID] = useAtom(userIdAtom);

  const messageListRef = useRef<HTMLDivElement | null>(null);

  const scrollToBottom = () => {
    if (messageListRef.current) {
      messageListRef.current.scrollTop = messageListRef.current.scrollHeight;
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    const channel = supabase
      .channel("MessagesList")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "messages" },
        (payload) => {
          if (payload?.eventType === "INSERT") {
            const incomingMessage = {
              message_id: payload.new.id,
              message_content: payload.new.content,
              sender_id: payload.new.sender_id,
              receiver_id: payload.new.receiver_id,
              message_created_at: payload.new.created_at,
              is_read: payload.new.is_read,
            };
            setMessages([...messages, incomingMessage as unknown as Message]);
            scrollToBottom();
          }
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [setMessages, messages, sender, receiver]);

  const { data: responseMessages, isLoading: isLoadingMessages } = UseGetMessagesQuery({ params: { userID: senderID } })

  useEffect(() => {
    setMessages(responseMessages || []);
  }, [responseMessages, setMessages]);


  return (
    <div
      className="w-full flex flex-col gap-4 overflow-auto scroll-smooth"
      ref={messageListRef}
    >
      {isLoadingMessages && (<Spinner />)}
      {Array.isArray(messages)
        ? messages.map((message) => (
          <MessageCard
            key={message.message_id}
            message={message}
            isOwnMessage={message.sender_id === userID}
          />
        ))
        : []}
    </div>
  );
}
