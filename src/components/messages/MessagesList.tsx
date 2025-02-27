"use client";

import { messagesAtom } from "@/lib/store/messages";
import { getMessages } from "@/queries/messages";
import { Message } from "@/types/messages.types";
import { useAtom } from "jotai";
import { useEffect } from "react";
import MessageCard from "./MessageCard";

type MessagesListProps = {
  senderID: string;
};

export default function MessagesList({ senderID }: MessagesListProps) {
  const [messages, setMessages] = useAtom(messagesAtom);
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
    <div className="w-full flex flex-col gap-4 overflow-auto">
      {Array.isArray(messages)
        ? messages.map((message) => (
            <MessageCard key={message.id} message={message} senderId={senderID}/>
          ))
        : []}
    </div>
  );
}
