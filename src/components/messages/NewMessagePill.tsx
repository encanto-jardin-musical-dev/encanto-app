"use client";

import { Button } from "@heroui/react";
import { useTranslations } from "next-intl";

type NewMessagePillProps = {
  count: number;
  onPress: () => void;
};

export default function NewMessagePill({ count, onPress }: NewMessagePillProps) {
  const t = useTranslations("MessagesList.newMessagePill");

  if (count <= 0) return null;

  const label = t(count === 1 ? "one" : "other", { count });

  return (
    <div className="pointer-events-none absolute bottom-4 left-0 right-0 flex justify-center z-10">
      <Button
        size="sm"
        color="primary"
        variant="shadow"
        className="pointer-events-auto rounded-full"
        onPress={onPress}
        aria-label={label}
      >
        {label}
      </Button>
    </div>
  );
}
