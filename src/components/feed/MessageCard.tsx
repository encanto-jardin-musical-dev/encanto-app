"use client";

import { Message as MessageType } from "@/types/messages.types";
import { EnvelopeIcon, ClockIcon } from "@heroicons/react/24/outline";
import { Card, CardBody, CardHeader } from "@heroui/react";
import { useFormatter, useTranslations } from "next-intl";

type MessageProps = {
  message: MessageType;
};

export default function MessageCard({ message }: MessageProps) {
  const t = useTranslations("MessageCard");
  const format = useFormatter();
  const messageDate = new Date(message.created_at);

  const handlePress = () => {
    // add navigation to message details
  };

  return (
    <>
      <Card
        className={`text-white ${message.from.role === "admin" ? "bg-secondary-400" : "bg-success-600"}`}
        isPressable
        onPress={handlePress}
      >
        <CardHeader className="gap-2 items-start">
          <div>
            <EnvelopeIcon className="w-6 h-6" />
          </div>
          <div className="text-left flex-1">
            <h3 className="text-medium">{t("title")}</h3>
            <p className="text-tiny">de {message.from.first_name}</p>
          </div>
          <div className="flex justify-end items-center text-tiny">
            <ClockIcon className="w-4 h-4" />
            <span>{format.relativeTime(messageDate)}</span>
          </div>
        </CardHeader>
        <CardBody>
          <p className="text-small  pl-8">{message.content}</p>
        </CardBody>
      </Card>
    </>
  );
}
