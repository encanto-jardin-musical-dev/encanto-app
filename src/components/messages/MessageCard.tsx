"use client";

import { markMessageAsRead } from "@/queries/messages";
import { Message } from "@/types/messages.types";
import { CheckIcon } from "@heroicons/react/16/solid";
import { Card, CardBody } from "@heroui/react";
import { useFormatter } from "next-intl";
import { useEffect, useState } from "react";

type MessageCardProps = {
  message: Message;
  isOwnMessage: boolean;
};

export default function MessageCard({
  message,
  isOwnMessage,
}: MessageCardProps) {
  const format = useFormatter();
  const [isRead] = useState(message?.is_read);
  const createdDate = new Date(message?.created_at as string);

  useEffect(() => {
    if (!message?.is_read && !isOwnMessage) {
      markMessageAsRead(message?.id as string);
    }
  }, [message, isOwnMessage]);

  return (
    <div
      key={message?.id}
      className={`gap-2 flex flex-col ${isOwnMessage ? "items-end" : "item-start"}`}
    >
      <Card
        key={message?.id}
        className={`w-11/12 ${isOwnMessage ? "bg-secondary-200 justify-self-end" : "bg-default-200"}`}
        shadow="none"
      >
        <CardBody>
          <p>{message?.content}</p>
        </CardBody>
      </Card>
      <div className="flex">
        <span className={`text-tiny ${isOwnMessage && "justify-self-end"}`}>
          {format.dateTime(createdDate, {
            year: "numeric",
            month: "short",
            day: "numeric",
            hour: "numeric",
            minute: "numeric",
          })}
        </span>
        {isRead && isOwnMessage ? (
          <div>
            <CheckIcon className="w-4 h-4 text-success-400" />
          </div>
        ) : null}
      </div>
    </div>
  );
}
