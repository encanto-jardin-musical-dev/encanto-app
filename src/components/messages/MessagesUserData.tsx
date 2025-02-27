"use client";

import { senderAtom } from "@/lib/store/messages";
import { Avatar } from "@heroui/react";
import { useAtomValue } from "jotai";

export default function MessagesUserData() {
  const sender = useAtomValue(senderAtom);
  return (
    <div className="flex first-letter: items-center gap-4">
      <div>
        <Avatar
          size="md"
          name={`${sender?.first_name} ${sender?.last_name}`}
          color="primary"
        />
      </div>
      <h1>{`${sender?.first_name} ${sender?.last_name}`}</h1>
    </div>
  );
}
