"use client";

import { CheckIcon } from "@heroicons/react/16/solid";
import { Card, CardBody } from "@heroui/react";
import { useFormatter } from "next-intl";
import { useEffect, useState } from "react";

import type { Message } from "@/types/messages.types";
import useMarkMessageRead from "@/hooks/UseMarkMessageReadedMutation";

type MessageCardProps = {
  message: Message;
  isOwnMessage: boolean;
};

export default function MessageCard({
  message,
  isOwnMessage,
}: MessageCardProps) {
  const {
    message_id,
    message_content,
    message_created_at,
    is_read,
  } = message;
  const format = useFormatter();
  const [isRead] = useState(is_read);
  const createdDate = new Date(message_created_at as string);

  const { mutate: markMessageAsRead } = useMarkMessageRead();

  useEffect(() => {
    if (!is_read && !isOwnMessage) {
      markMessageAsRead(message_id!);
    }
  }, [isOwnMessage, is_read, markMessageAsRead, message_id]);

  return (
    <div
      key={message_id}
      className={`gap-2 flex flex-col ${isOwnMessage ? "items-end" : "item-start"}`}
    >
      <Card
        key={message_id}
        className={`w-11/12 ${isOwnMessage ? "bg-secondary-200 justify-self-end" : "bg-default-200"}`}
        shadow="none"
      >
        <CardBody>
          <p>{message_content}</p>
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
