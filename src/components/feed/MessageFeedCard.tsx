"use client";

import { groupContextSelectedAtom } from "@/lib/store";
import { receiverAtom, senderAtom } from "@/lib/store/messages";
import { Message as MessageFeedResponse } from "@/types/messages.types";
import { getGroupContextValue } from "@/utils";
import { EnvelopeIcon, ClockIcon } from "@heroicons/react/24/outline";
import { Card, CardBody, CardHeader, Selection } from "@heroui/react";
import { useAtom } from "jotai";
import { useFormatter, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";

type MessageFeedCardProps = {
  message: MessageFeedResponse;
};

export default function MessageFeedCard({ message }: MessageFeedCardProps) {
  const t = useTranslations("MessageCard");
  const format = useFormatter();
  const messageDate = new Date(message.created_at as string);
  const router = useRouter();

  const [groupContext] = useAtom(groupContextSelectedAtom);
  const [, setSender] = useAtom(senderAtom);
  const [, setReceiver] = useAtom(receiverAtom);

  const handlePress = () => {
    router.push(`/messages/${message.sender?.sender_id}`);
    setSender((prev) => ({
      ...prev,
      id: message.receiver?.receiver_id,
      first_name: message.receiver?.first_name,
      last_name: message?.receiver?.last_name,
      role: message?.receiver?.role,
    }));
    setReceiver((prev) => ({
      ...prev,
      id: message.sender?.sender_id,
      first_name: message.sender?.first_name,
      last_name: message.sender?.last_name,
      role: message.sender?.role,
    }));
  };

  const messageChild = message?.sender?.children?.find((child) => {
    return (
      child?.children?.child_group[0]?.group_id ===
      getGroupContextValue(groupContext as Selection)
    );
  });

  return (
    <Card
      className={`text-white ${message.sender?.role === "admin" ? "bg-secondary-400" : "bg-success-600"}`}
      isPressable
      onPress={handlePress}
    >
      <CardHeader className="gap-2 items-start">
        <div>
          <EnvelopeIcon className="w-6 h-6" />
        </div>
        <div className="text-left flex-1">
          <h3 className="text-medium">{t("title")}</h3>
          <p className="text-tiny text-white/50">
            {t("senderInfo", {
              senderName: `${message?.sender?.first_name}`,
            })}
            {messageChild
              ? t("childInfo", {
                  relationship: `${messageChild?.relationship}`,
                  childName: `${messageChild?.children?.first_name} ${messageChild?.children?.last_name}`,
                })
              : null}
          </p>
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
  );
}
