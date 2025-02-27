"use client";
import { PaperAirplaneIcon, PlusIcon } from "@heroicons/react/24/outline";
import { Button, Textarea } from "@heroui/react";
import { useTranslations } from "next-intl";

export default function MessageInput() {
  const t = useTranslations("MessagesInput");

  return (
    <div className="flex gap-2 justify-around items-end">
      <Textarea variant="bordered" minRows={1} placeholder={t("placeholder")} />
      <Button isIconOnly aria-label="add files">
        <PlusIcon className="w-4 h-4" />
      </Button>
      <Button isIconOnly aria-label="submit message" color="primary">
        <PaperAirplaneIcon className="w-4 h-4" />
      </Button>
    </div>
  );
}
