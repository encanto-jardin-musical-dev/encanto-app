"use client";

import { messagesAtom, receiverAtom, senderAtom } from "@/lib/store/messages";
import { getMessages } from "@/queries/messages";
import { Message } from "@/types/messages.types";
import { createClient } from "@/utils/supabase/client";
import { useAtom } from "jotai";
import { useEffect, useRef } from "react";
import MessageCard from "./MessageCard";

type MessagesListProps = {
  senderID: string;
};

const supabase = createClient();

export default function MessagesList({ senderID }: MessagesListProps) {
  const [messages, setMessages] = useAtom(messagesAtom);
  const [sender] = useAtom(senderAtom);
  const [receiver] = useAtom(receiverAtom);

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
              ...payload.new,
              sender,
              receiver,
            };
            setMessages([...messages, incomingMessage as Message]);
            scrollToBottom();
          } else if (payload?.eventType === "UPDATE") {
            // TODO: Figured out how to update messages when isRead was updated
            const updatedMessageIndex = messages.findIndex(
              (message) => message.id === payload.new.id,
            );
            if (updatedMessageIndex !== -1) {
              const newMessages = [...messages];
              newMessages[updatedMessageIndex] = payload.new as Message;
              setMessages(newMessages);
            }
          }
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [setMessages, messages, sender, receiver]);

  useEffect(() => {
    const fetchMessages = async () => {
      const messages: Message[] = await getMessages(senderID);
      if (!messages) {
        console.log("error");
      }
      setMessages(messages);
    };
    if (senderID) {
      fetchMessages();
    }
  }, [senderID, setMessages]);

  return (
    <div
      className="w-full flex flex-col gap-4 overflow-auto scroll-smooth"
      ref={messageListRef}
    >
      {Array.isArray(messages)
        ? messages.map((message) => (
            <MessageCard key={message.id} message={message} />
          ))
        : []}
    </div>
  );
}
