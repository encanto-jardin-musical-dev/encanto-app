"use client";

import { receiverAtom } from "@/lib/store/messages";
import { userGroupIdAtom, userIdAtom, userRoleAtom } from "@/lib/store/user";
import { sendMessage } from "@/queries/messages";
import { Message } from "@/types/messages.types";
import { PaperAirplaneIcon, PlusIcon } from "@heroicons/react/24/outline";
import { Button, Textarea } from "@heroui/react";
import { useAtom } from "jotai";
import { useTranslations } from "next-intl";
import { useState } from "react";

export default function MessageInput() {
  const t = useTranslations("MessagesInput");
  const [content, setContent] = useState("");
  const [userId] = useAtom(userIdAtom);
  const [userRole] = useAtom(userRoleAtom);
  const [groupId] = useAtom(userGroupIdAtom);
  const [receiver] = useAtom(receiverAtom);

  const handleSubmit = async () => {
    const newMessage: Message = {
      content,
      sender_id: userId,
      receiver_id: receiver?.id,
      ...(userRole === "teacher" && { group_id: groupId }),
    };
    if (newMessage.content) {
      sendMessage(newMessage);
    }
    //TODO: add empty message notification
    setContent("");
  };

  return (
    <div className="flex gap-2 justify-around items-end">
      <Textarea
        variant="bordered"
        minRows={1}
        placeholder={t("placeholder")}
        isClearable
        value={content}
        onValueChange={setContent}
      />
      {userRole !== 'parent' ? (
        <Button isIconOnly aria-label="add files" isDisabled>
          <PlusIcon className="w-4 h-4" />
        </Button>
      ) : null}
      <Button
        isIconOnly
        aria-label="submit message"
        color="primary"
        onPress={handleSubmit}
      >
        <PaperAirplaneIcon className="w-4 h-4" />
      </Button>
    </div>
  );
}
