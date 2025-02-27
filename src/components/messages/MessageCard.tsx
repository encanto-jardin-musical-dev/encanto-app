"use client";
import { Message } from "@/types/messages.types";
import { CheckIcon } from "@heroicons/react/16/solid";
import { Card, CardBody } from "@heroui/react";
import { useFormatter } from "next-intl";

type MessageCardProps = {
  message: Message;
  senderId: string;
};

export default function MessageCard({ message, senderId }: MessageCardProps) {
  const format = useFormatter();
  const createdDate = new Date(message.created_at);

  const isUserSender = message.sender.sender_id !== senderId;

  return (
    <div
      key={message.id}
      className={`gap-2 flex flex-col ${isUserSender ? "items-end" : "item-start"}`}
    >
      <Card
        key={message.id}
        className={`w-11/12 ${isUserSender ? "bg-secondary-200 justify-self-end" : "bg-default-200"}`}
        shadow="none"
      >
        <CardBody>
          <p>{message.content}</p>
        </CardBody>
      </Card>
      <div className="flex">
        <span className={`text-tiny ${isUserSender && "justify-self-end"}`}>
          {format.dateTime(createdDate, {
            year: "numeric",
            month: "short",
            day: "numeric",
            hour: "numeric",
            minute: "numeric",
          })}
        </span>
        {message.is_read ? (
          <div>
            <CheckIcon className="w-4 h-4 text-success-400" />
          </div>
        ) : null}
      </div>
    </div>
  );
}
